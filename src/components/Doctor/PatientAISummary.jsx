import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from "../../firebase/config"; 
import { collection, query, where, getDocs } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  Zap, AlertTriangle, ShieldCheck, History, 
  Search, Sparkles, Loader2, User, FileWarning
} from 'lucide-react';

// Initialize Gemini
const genAI = new GoogleGenerativeAI("YOUR_ACTUAL_GEMINI_API_KEY");

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

      // 1. Check for patient's medical records
      const recordsQ = query(collection(db, "medical_records"), where("patientId", "==", selectedPatientId));
      const recordsSnap = await getDocs(recordsQ);
      
      const recordsTitles = recordsSnap.docs.map(doc => doc.data().name).join(", ");
      
      // 2. CRITICAL FIX: Block analysis if no records exist
      if (!recordsTitles) {
        setNoRecordsFound(true);
        setSummaryData({
          name: patientInfo.fullName,
          aiInsight: "Cannot generate summary. This patient's digital health vault is empty. A meaningful history requires at least one uploaded medical record."
        });
        setIsAnalyzing(false);
        return; // Stop here
      }

      // 3. Proceed with Gemini API call if records exist
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        Context: You are a senior clinical AI assistant.
        Patient: ${patientInfo.fullName}, Age: ${patientInfo.age || "Unknown"}, Blood Group: ${patientInfo.bloodGroup || "Unknown"}.
        Available Medical Records for Analysis: ${recordsTitles}
        
        Task: Analyze the names of the available medical records to infer the patient's condition and previous medical events. 
        Generate a professional, high-level clinical history summary. Focus on inferring potential health trends, logical next steps, and precautions.
        The tone must be clinical, precise, and professional. Keep the summary under 65 words.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiText = response.text();

      // 4. Update UI with Real AI Response
      setSummaryData({
        name: patientInfo.fullName,
        age: patientInfo.age || "N/A",
        blood: patientInfo.bloodGroup || "N/A",
        condition: "Inferred from Records",
        aiInsight: aiText
      });

    } catch (error) {
      console.error("AI Analysis Failed:", error);
      setSummaryData({
        name: "Error",
        aiInsight: "AI service failed. The API key might be missing, restricted, or the rate limit exceeded. Please review records manually."
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