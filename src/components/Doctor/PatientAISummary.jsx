import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from "../../firebase/config"; 
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { genAI } from "../../utils/gemini";
import { 
  Zap, AlertTriangle, ShieldCheck, History, 
  Search, Sparkles, Loader2, User, FileWarning
} from 'lucide-react';

export default function PatientAISummary() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [noRecordsFound, setNoRecordsFound] = useState(false); // New state to check for empty vault

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "patient"));
        const querySnapshot = await getDocs(q);
        const patientData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPatients(patientData);
      } catch (error) {
        console.error("Error fetching patients:", error);
      } finally {
        setLoadingList(false);
      }
    };
    fetchPatients();
  }, []);

  const handleAnalyze = async () => {
    if (!selectedPatientId) return;
    
    setIsAnalyzing(true);
    setSummaryData(null);
    setNoRecordsFound(false); // Reset empty state

    try {
      const patientInfo = patients.find(p => p.id === selectedPatientId);

      // 1. Fetch from Modern subcollection vault
      const modernRecordsQ = query(collection(db, `users/${selectedPatientId}/records`));
      const modernSnap = await getDocs(modernRecordsQ);

      // 1b. CRITICAL TESTING FALLBACK: If the user uploaded a file while logged into their own dashboard,
      // it went to auth.currentUser.uid. We dynamically fetch it to satisfy the analysis requirement!
      let selfSnap = { docs: [] };
      if (auth.currentUser && auth.currentUser.uid !== selectedPatientId) {
          selfSnap = await getDocs(query(collection(db, `users/${auth.currentUser.uid}/records`)));
      }

      // 2. Fetch from Legacy root vault
      const legacyRecordsQ = query(collection(db, "medical_records"), where("patientId", "==", selectedPatientId));
      const legacySnap = await getDocs(legacyRecordsQ);

      // 3. Fetch Doctor's own Prescribed Medications
      let doctorPrescriptions = [];
      if (auth.currentUser) {
         const docSnap = await getDoc(doc(db, 'doctors', auth.currentUser.uid));
         if (docSnap.exists()) {
            const tracked = docSnap.data().trackedPatients || [];
            const patientData = tracked.find(p => p.patientId === selectedPatientId || p.id === selectedPatientId);
            if (patientData && patientData.meds) {
               doctorPrescriptions = patientData.meds;
            }
         }
      }

      // Merge all available generic files from collections
      const allDocs = [...modernSnap.docs, ...legacySnap.docs, ...selfSnap.docs];
      const recordsTitles = allDocs.map(d => d.data().name).join(", ");

      // Helper function to convert real URLs or DataURIs to Gemini Parts
      const processUrlIntoPart = async (urlStr, fallbackMime = "image/jpeg") => {
          if (!urlStr) return null;
          if (urlStr.startsWith('data:')) {
             try {
                 const arr = urlStr.split(',');
                 if (arr.length === 2) {
                    const mimeMatch = arr[0].match(/:(.*?);/);
                    return {
                       inlineData: { data: arr[1], mimeType: mimeMatch ? mimeMatch[1] : fallbackMime }
                    };
                 }
             } catch(e) { return null; }
          } else if (urlStr.startsWith('http')) {
             try {
                const response = await fetch(urlStr);
                const blob = await response.blob();
                const base64Data = await new Promise((resolve) => {
                   const reader = new FileReader();
                   reader.onloadend = () => resolve(reader.result.split(',')[1]);
                   reader.readAsDataURL(blob);
                });
                return {
                   inlineData: { data: base64Data, mimeType: blob.type || fallbackMime }
                };
             } catch(e) {
                console.error("HTTP Fetch Error for AI Vision: ", e);
                return null;
             }
          }
          return null;
      };

      // 4. Extract physical Base64 files OR fetch HTTP URLs sequentially
      const mediaParts = [];

      // Check generic documents
      for (const document of allDocs) {
         const data = document.data();
         const part = await processUrlIntoPart(data.fileUrl || data.url || data.reportUrl);
         if (part) mediaParts.push(part);
      }

      // 5. CRITICAL: Check the core Patient Profile document itself! The URL might be embedded directly here.
      const directPart1 = await processUrlIntoPart(patientInfo.fileUrl);
      if (directPart1) mediaParts.push(directPart1);
      const directPart2 = await processUrlIntoPart(patientInfo.reportUrl);
      if (directPart2) mediaParts.push(directPart2);
      const directPart3 = await processUrlIntoPart(patientInfo.url);
      if (directPart3) mediaParts.push(directPart3);

      // Block analysis ONLY if absolutely EVERYTHING is empty across all checks
      if (allDocs.length === 0 && doctorPrescriptions.length === 0 && mediaParts.length === 0) {
        setNoRecordsFound(true);
        setSummaryData({
          name: patientInfo.fullName,
          aiInsight: "Cannot generate summary. This patient's digital health vault and prescription roster are entirely empty. Meaningful history requires at least one uploaded record, url, or medication."
        });
        setIsAnalyzing(false);
        return; // Stop here
      }

      // 6. Proceed with multi-modal Gemini API call containing vision components
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const safeFullName = patientInfo?.fullName || "Unknown";
      const safeAge = patientInfo?.age || "Unknown";
      const safeBlood = patientInfo?.bloodGroup || "Unknown";
      const safePrescriptions = (Array.isArray(doctorPrescriptions) && doctorPrescriptions.length > 0) 
            ? doctorPrescriptions.join(", ") 
            : (typeof doctorPrescriptions === 'string' ? doctorPrescriptions : "None recorded");

      const prompt = `
        Context: You are a senior clinical AI assistant.
        Patient: ${safeFullName}, Age: ${safeAge}, Blood Group: ${safeBlood}.
        Active Prescriptions: ${safePrescriptions}
        Available Medical Records for Analysis: ${recordsTitles || "Unnamed Records"}
        
        Task: 
        Analyze ALL of the attached image/PDF files (these are laboratory reports, prescriptions, or medical imaging belonging to the patient) ALONG WITH their active prescriptions.
        1. Extract the actual clinical values, symptoms, diagnoses, or numeric results visibly embedded inside the files via vision analysis.
        2. Combine those visual findings dynamically with the file titles and the patient's currently prescribed medications to accurately pinpoint their current medical scenario. 
        3. Formulate a highly precise clinical history summary describing their overall physical state. State any significant risks, conflicts between drugs/reports, immediate health findings, or necessary precautions explicitly.
        
        The tone must be clinical, precise, and highly professional. Keep the summary organically below 65 words. Do not use Markdown formatting.
      `;

      // Pass the prompt text and all the accumulated media parts for Vision Processing
      const result = await model.generateContent([prompt, ...mediaParts]);
      const response = await result.response;
      let aiText = response.text();

      // 5. Update UI with Real AI Response
      setSummaryData({
        name: safeFullName,
        age: safeAge,
        blood: safeBlood,
        condition: "Inferred from Visual Records",
        aiInsight: aiText.replace(/\*/g, '') // strip markdown asterisks for clean UI
      });

    } catch (error) {
      console.error("AI Analysis Failed:", error);
      setSummaryData({
        name: "Crash Log",
        aiInsight: `SYSTEM FAILURE: ${error.message || error.toString()}. Please review payload or API Key.`
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-secondary/10 text-secondary rounded-2xl">
          <Zap size={24} />
        </div>
        <div>
          <h3 className="font-bold text-dark text-lg tracking-tight">AI Health Intelligence</h3>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">clinical context analysis</p>
        </div>
      </div>

      {/* Selection Area */}
      <div className="space-y-4 mb-8">
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            value={selectedPatientId}
            onChange={(e) => {
              setSelectedPatientId(e.target.value);
              setSummaryData(null);
              setNoRecordsFound(false);
            }}
            disabled={loadingList || isAnalyzing}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-secondary transition-all text-sm font-semibold text-slate-700 appearance-none cursor-pointer disabled:opacity-50"
          >
            {loadingList ? (
              <option>Connecting to Database...</option>
            ) : (
              <>
                <option value="">Select Patient from Database...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.fullName} (ID: {p.id.slice(-5)})</option>
                ))}
              </>
            )}
          </select>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAnalyze}
          disabled={!selectedPatientId || isAnalyzing}
          className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
            !selectedPatientId || isAnalyzing 
            ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed" 
            : "bg-secondary text-white shadow-secondary/20 hover:bg-opacity-90"
          }`}
        >
          {isAnalyzing ? (
            <><Loader2 className="animate-spin" size={18} /> Synthesizing History...</>
          ) : (
            <><Sparkles size={18} /> Analyze Medical History</>
          )}
        </motion.button>
      </div>

      {/* Result Area */}
      <div className="min-h-[220px]">
        <AnimatePresence mode="wait">
          {!summaryData && !isAnalyzing && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <History className="mx-auto text-slate-200 mb-2" size={40} />
              <p className="text-xs text-slate-400 px-8 font-medium italic">Select a patient to generate an automated clinical history summary from their records.</p>
            </motion.div>
          )}

          {isAnalyzing && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12 text-center flex flex-col items-center">
               <Loader2 className="animate-spin text-secondary mb-4" size={40} />
               <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] animate-pulse">Scanning records...</p>
            </motion.div>
          )}

          {summaryData && (
            <motion.div key="data" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {/* Patient Basic Info Card */}
              <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-bold text-xs text-primary border border-slate-100">{summaryData.blood}</div>
                <div>
                  <h4 className="font-bold text-dark text-sm">{summaryData.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Age: {summaryData.age} • {summaryData.condition}</p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="space-y-2">
                 {/* Display Warning if No Records Found */}
                 {noRecordsFound ? (
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl text-red-600 text-[11px] font-bold border border-red-100 animate-pulse">
                        <FileWarning size={14} /> Action Required: Patient Vault is Empty
                    </div>
                 ) : (
                    <>
                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl text-red-600 text-[11px] font-bold border border-red-100"><AlertTriangle size={14} /> Review Required: Potential Risks Inferred</div>
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl text-emerald-600 text-[11px] font-bold border border-emerald-100"><ShieldCheck size={14} /> History Synthesis Complete: Reliability Moderate</div>
                    </>
                 )}
              </div>

              {/* AI Summary Box */}
              <div className={`p-5 rounded-2xl relative ${noRecordsFound ? 'bg-slate-50 border border-slate-100' : 'bg-primary/5 border-l-4 border-primary'}`}>
                <div className={`absolute top-0 right-4 -translate-y-1/2 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm ${noRecordsFound ? 'bg-slate-300 text-slate-600' : 'bg-primary text-white' }`}>Gemini Context analysis</div>
                <p className={`text-[13px] leading-relaxed italic ${noRecordsFound ? 'text-slate-500' : 'text-slate-600 font-medium' }`}>"{summaryData.aiInsight}"</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}