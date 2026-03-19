import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Pill, Trash2, Plus, Search, ChevronRight, Activity, X, User as UserIcon } from 'lucide-react';
import { db, auth } from '../../firebase/config';
import { collection, onSnapshot, doc, getDocs, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function PatientManager({ onSelectPatient }) {
  const [patients, setPatients] = useState([]);
  const [user, setUser] = useState(auth.currentUser);

  // Active state
  const [selectedId, setSelectedId] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedNewPatient, setSelectedNewPatient] = useState(null);
  const [newMedName, setNewMedName] = useState('');
  const [selectedMeds, setSelectedMeds] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  // Fetch doctor's tracked patients
  useEffect(() => {
    if(!user) return;
    const unsub = onSnapshot(doc(db, 'doctors', user.uid), snap => {
      if(snap.exists()) {
        const pts = snap.data().trackedPatients || [];
        setPatients(pts.sort((a,b) => b.createdAt - a.createdAt));
      }
    });
    return () => unsub();
  }, [user]);

  // Search global users table client-side for better loose matching
  const handleSearch = async () => {
    if(!searchQuery.trim()) return;
    setIsSearching(true);
    try {
       const snap = await getDocs(collection(db, 'users'));
       const allUsers = snap.docs.map(d => ({uid: d.id, ...d.data()}));
       const results = allUsers.filter(u => 
         u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         u.email?.toLowerCase().includes(searchQuery.toLowerCase())
       );
       setSearchResults(results);
    } catch(err) {
      console.error("Error fetching users", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMedToDraft = () => {
    if(newMedName.trim() && !selectedMeds.includes(newMedName.trim())) {
      setSelectedMeds([...selectedMeds, newMedName.trim()]);
      setNewMedName('');
    }
  };

  const handleRemoveMedFromDraft = (med) => {
    setSelectedMeds(selectedMeds.filter(m => m !== med));
  };

  const handleSavePatient = async () => {
    if(!user || !selectedNewPatient) return;
    try {
      const newPatientObj = {
        id: new Date().getTime().toString(),
        name: selectedNewPatient.fullName || 'Unknown Patient',
        email: selectedNewPatient.email || '',
        age: selectedNewPatient.age || 'N/A',
        contact: selectedNewPatient.contact || '',
        patientId: selectedNewPatient.uid,
        meds: selectedMeds,
        lastVisit: 'Newly Added',
        createdAt: new Date().getTime()
      };
      await updateDoc(doc(db, 'doctors', user.uid), {
        trackedPatients: arrayUnion(newPatientObj)
      });
      // Reset Modal
      setShowAddModal(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedNewPatient(null);
      setSelectedMeds([]);
    } catch(err) {
      console.error("Error saving patient to roster", err);
    }
  };

  const handleDeleteMedication = async (patient, medToRemove) => {
    if(!user) return;
    try {
      const newMeds = (patient.meds || []).filter(m => m !== medToRemove);
      const updatedPatient = { ...patient, meds: newMeds };
      
      const docRef = doc(db, 'doctors', user.uid);
      await updateDoc(docRef, { trackedPatients: arrayRemove(patient) });
      await updateDoc(docRef, { trackedPatients: arrayUnion(updatedPatient) });
    } catch(err) {
      console.error(err);
    }
  };

  const handleQuickAddMed = async (patient) => {
    if(!user) return;
    const newMed = window.prompt("Enter new medication name:");
    if(newMed && newMed.trim()) {
      try {
        const updatedPatient = { ...patient, meds: [...(patient.meds || []), newMed.trim()] };
        const docRef = doc(db, 'doctors', user.uid);
        await updateDoc(docRef, { trackedPatients: arrayRemove(patient) });
        await updateDoc(docRef, { trackedPatients: arrayUnion(updatedPatient) });
      } catch(err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="text-xl font-bold text-dark flex items-center gap-2">
            <Users className="text-primary" size={24} /> Manage Patients
          </h3>
          <p className="text-xs text-slate-400 mt-1">Monitor vitals and manage active dosages</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-xs font-bold bg-primary text-white border border-primary px-4 py-2 rounded-xl hover:bg-opacity-90 transition-all shadow-sm"
          >
            <Plus size={16} /> Add Patient
          </button>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {patients.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
            <p className="text-slate-500 font-bold mb-2">No Patients Added</p>
            <p className="text-xs text-slate-400">Click Add Patient to search global users and bind them to your personal dosage tracking roster.</p>
          </div>
        ) : (
          patients.map((patient) => (
            <motion.div 
              key={patient.id}
              onClick={() => {
                  setSelectedId(patient.id);
                  onSelectPatient({ id: patient.patientId, name: patient.name });
              }}
              whileHover={{ scale: 1.01 }}
              className={`p-5 rounded-[2rem] border transition-all cursor-pointer ${
                selectedId === patient.id ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-50 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                     <Activity size={20} className="text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-dark text-sm">{patient.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{patient.age} YRS • {patient.contact || 'No Contact'}</p>
                  </div>
                </div>

                {/* Dosage Badges */}
                <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end md:px-4">
                  {(patient.meds || []).map((med, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm relative group">
                      <Pill size={12} className="text-primary" />
                      <span className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">{med}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteMedication(patient, med); }}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all absolute -top-2 -right-2 bg-white rounded-full shadow-sm p-0.5 border border-slate-100"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleQuickAddMed(patient); }}
                    className="p-1.5 border border-dashed border-primary/40 rounded-lg text-primary hover:bg-primary hover:text-white transition-all"
                    title="Add Dosage"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Last Visit</p>
                     <p className="text-xs font-bold text-dark">{patient.lastVisit}</p>
                  </div>
                  <ChevronRight size={18} className={selectedId === patient.id ? "text-primary" : "text-slate-300"} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Patient Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-dark/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => { setShowAddModal(false); setSelectedNewPatient(null); setSearchResults([]); }} 
                className="absolute top-6 right-6 text-slate-400 hover:text-dark transition-colors bg-slate-100 p-2 rounded-full z-10"
              >
                <X size={20} />
              </button>
              
              <h3 className="font-bold text-2xl mb-2 text-dark flex items-center gap-3 pr-10">
                 <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0"><Users size={24} /></div>
                 Bind New Patient
              </h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">Search the global users database to add a patient to your tracking roster and establish a dosage plan.</p>
              
              {!selectedNewPatient ? (
                 <div className="space-y-4 flex-1 overflow-auto">
                    <div className="flex gap-2 relative">
                       <input 
                         type="text" 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                         placeholder="Search by full name or email..."
                         className="w-full bg-slate-50 border border-slate-200 px-5 py-4 pl-12 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                       />
                       <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                       <button 
                         onClick={handleSearch}
                         disabled={isSearching}
                         className="bg-dark text-white px-6 py-4 rounded-xl font-bold whitespace-nowrap hover:bg-slate-800 transition-colors"
                       >
                         {isSearching ? '...' : 'Search'}
                       </button>
                    </div>

                    <div className="space-y-2 mt-4">
                      {searchResults.length > 0 ? (
                        searchResults.map(u => (
                          <div key={u.uid} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelectedNewPatient(u)}>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary"><UserIcon size={16}/></div>
                              <div>
                                <p className="font-bold text-sm text-dark">{u.fullName || 'Unknown'}</p>
                                <p className="text-xs text-slate-400">{u.email}</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">Select</span>
                          </div>
                        ))
                      ) : (
                        searchQuery && !isSearching && (
                           <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                             <p className="text-slate-500 text-sm font-medium">No users found matching "{searchQuery}"</p>
                           </div>
                        )
                      )}
                    </div>
                 </div>
              ) : (
                <div className="space-y-6 flex-1 overflow-auto animate-in slide-in-from-right-4">
                   <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                     <div>
                       <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Selected Patient</p>
                       <p className="font-bold text-dark text-lg">{selectedNewPatient.fullName}</p>
                       <p className="text-xs text-slate-500">{selectedNewPatient.email} • {selectedNewPatient.age ? `${selectedNewPatient.age} YRS` : 'Age Unspecified'}</p>
                     </div>
                     <button onClick={() => setSelectedNewPatient(null)} className="text-xs font-bold text-slate-400 hover:text-dark underline">Change</button>
                   </div>

                   <div>
                     <label className="text-sm font-bold text-slate-700 block mb-2">Initial Dosage Plan (Optional)</label>
                     <div className="flex gap-2 mb-4">
                       <input 
                         type="text" 
                         value={newMedName}
                         onChange={(e) => setNewMedName(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleAddMedToDraft()}
                         placeholder="e.g. Paracetamol 500mg"
                         className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-primary transition-colors text-sm"
                       />
                       <button onClick={handleAddMedToDraft} className="bg-slate-100 text-slate-600 px-4 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2">
                          <Plus size={16}/> Add Med
                       </button>
                     </div>

                     <div className="flex flex-wrap gap-2">
                       {selectedMeds.length === 0 ? (
                         <p className="text-xs text-slate-400 italic">No medications planned yet.</p>
                       ) : (
                         selectedMeds.map((med, idx) => (
                           <div key={idx} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                             <Pill size={12} className="text-slate-500" />
                             <span className="text-xs font-bold text-slate-700">{med}</span>
                             <button onClick={() => handleRemoveMedFromDraft(med)} className="text-slate-400 hover:text-red-500 transition-colors ml-1"><X size={12} /></button>
                           </div>
                         ))
                       )}
                     </div>
                   </div>

                   <div className="pt-4 border-t border-slate-100">
                     <button 
                       onClick={handleSavePatient}
                       className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-sm"
                     >
                       Confirm & Save Patient
                     </button>
                   </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}