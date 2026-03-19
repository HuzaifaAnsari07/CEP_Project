import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Clock, Bell, Trash2, X, Plus, CheckCircle2 } from 'lucide-react';
import { db, auth } from '../../firebase/config';
import { collection, query, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const MedicationItem = ({ id, name, time, dose, quantity, completed, onDelete, onTake }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all group gap-4 sm:gap-0 ${completed ? 'bg-slate-50 opacity-75 grayscale border-slate-200 shadow-none' : 'bg-white hover:border-primary/20 hover:shadow-md border-slate-100 shadow-sm'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl shadow-sm transition-colors ${completed ? 'bg-slate-200 text-slate-500' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'}`}>
        <Pill size={20} />
      </div>
      <div>
        <div className="flex items-center gap-2">
           <h4 className={`font-bold text-sm ${completed ? 'text-slate-500 line-through' : 'text-dark'}`}>{name}</h4>
           {completed && <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Completed</span>}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{dose}</p>
        <p className={`text-[10px] font-bold mt-1.5 uppercase tracking-wider inline-block px-2 py-0.5 rounded-md ${completed ? 'bg-slate-200 text-slate-500' : 'bg-primary/10 text-primary'}`}>
           Remaining: {quantity}
        </p>
      </div>
    </div>
    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
      <div className={`flex items-center gap-2 font-bold text-sm px-3 py-1.5 rounded-lg flex-1 sm:flex-none justify-center ${completed ? 'bg-slate-200 text-slate-500' : 'bg-primary/5 text-primary'}`}>
        <Clock size={14} /> {time}
      </div>
      
      {!completed && (
        <button 
          onClick={() => onTake(id, quantity)}
          className="p-2 text-emerald-500 bg-emerald-50 hover:bg-emerald-500 hover:text-white rounded-lg transition-all shadow-sm border border-emerald-100"
          title="Take Dosage"
        >
          <CheckCircle2 size={18} />
        </button>
      )}

      <button 
        onClick={() => onDelete(id)}
        className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all border border-transparent hover:border-red-100"
        title="Delete Dosage"
      >
        <Trash2 size={18} />
      </button>
    </div>
  </motion.div>
);

export default function MedicationTracker() {
  const [user, setUser] = useState(auth.currentUser);
  const [dosages, setDosages] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [time, setTime] = useState('');
  const [instruction, setInstruction] = useState('After Meals');
  const [quantity, setQuantity] = useState('');

  const [nextDoseText, setNextDoseText] = useState("No upcoming doses");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const formatTimeAMPM = (time24h) => {
    if (!time24h) return "";
    const [hours, minutes] = time24h.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const numH = h % 12 || 12;
    return `${numH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const calculateNextDose = (dosesList) => {
    // Only calculate timers for non-completed medications
    const activeDosesList = dosesList.filter(d => !d.completed);

    if (activeDosesList.length === 0) {
      if (dosesList.length > 0) {
        setNextDoseText("All scheduled medications completed");
      } else {
        setNextDoseText("No medications scheduled");
      }
      return;
    }

    const now = new Date();
    
    const upcomingDoses = activeDosesList.map(d => {
      const rawSplit = d.rawTime ? d.rawTime.split(':') : null;
      if (!rawSplit) return null;
      
      const doseDate = new Date();
      doseDate.setHours(parseInt(rawSplit[0], 10), parseInt(rawSplit[1], 10), 0, 0);
      
      if (doseDate < now) {
         doseDate.setDate(doseDate.getDate() + 1);
      }
      return { ...d, nextOccurrence: doseDate };
    }).filter(d => d !== null);

    upcomingDoses.sort((a, b) => a.nextOccurrence - b.nextOccurrence);

    if (upcomingDoses.length > 0) {
      const nextDose = upcomingDoses[0];
      const diffMs = nextDose.nextOccurrence - now;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let timeString = "";
      if (diffHrs > 0) timeString += `${diffHrs} hours `;
      timeString += `${diffMins} minutes`;
      
      setNextDoseText(`${timeString} (${nextDose.name})`);
    } else {
      setNextDoseText("No upcoming doses");
    }
  };

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, `users/${user.uid}/dosages`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dosesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      dosesData.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.rawTime || "00:00").localeCompare(b.rawTime || "00:00");
      });
      
      setDosages(dosesData);
      calculateNextDose(dosesData);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      calculateNextDose(dosages);
    }, 60000);
    return () => clearInterval(interval);
  }, [dosages]);

  const handleAddDosage = async (e) => {
    e.preventDefault();
    if (!name || !amount || !time || !user || !quantity) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/dosages`), {
        name,
        dose: `${amount} - ${instruction}`,
        time: formatTimeAMPM(time),
        rawTime: time,
        quantity: parseInt(quantity, 10),
        completed: false,
        createdAt: new Date()
      });
      setShowAddModal(false);
      setName('');
      setAmount('');
      setTime('');
      setInstruction('After Meals');
      setQuantity('');
    } catch (err) {
      console.error("Error adding dosage:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/dosages`, id));
    } catch (err) {
      console.error("Error deleting dosage:", err);
    }
  };

  const handleTake = async (id, currentQty) => {
    if (!user) return;
    try {
      const newQty = currentQty - 1;
      const isCompleted = newQty <= 0;

      await updateDoc(doc(db, `users/${user.uid}/dosages`, id), {
        quantity: Math.max(0, newQty),
        completed: isCompleted
      });
    } catch (err) {
      console.error("Error toggling consumption:", err);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
        <h3 className="text-xl font-bold text-dark flex items-center gap-2">
          <Pill className="text-primary" /> Today's Dosages
        </h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="text-xs font-bold text-primary hover:text-white hover:bg-primary border border-primary/20 flex items-center justify-center gap-1 bg-primary/5 px-4 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <Plus size={16} /> Add Dosage
        </button>
      </div>
      
      <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {dosages.length === 0 ? (
           <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-center text-sm font-medium text-slate-400 py-10 bg-slate-50 border border-slate-100 rounded-3xl border-dashed">
             No dosages properly scheduled. <br/> <span className="text-primary cursor-pointer hover:underline inline-block mt-2" onClick={() => setShowAddModal(true)}>Click to add one.</span>
           </motion.div>
          ) : (
            dosages.map(d => (
              <MedicationItem 
                key={d.id} 
                id={d.id}
                name={d.name} 
                time={d.time} 
                dose={d.dose}
                quantity={d.quantity}
                completed={d.completed}
                onDelete={handleDelete}
                onTake={handleTake}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
        <p className="text-xs text-primary font-bold flex items-center gap-2 tracking-wide">
          <Bell size={14} className="animate-pulse" /> Next dose in: {nextDoseText}
        </p>
      </div>

      {/* Add Dosage Modal Overlay */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-dark/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button onClick={() => setShowAddModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-dark transition-colors bg-slate-50 p-2 rounded-full">
                <X size={18} />
              </button>
              <h3 className="font-bold text-xl mb-6 text-dark flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl"><Plus size={20} className="text-primary" /></div>
                New Dosage
              </h3>
              
              <form onSubmit={handleAddDosage} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Medication Name</label>
                  <input required value={name} onChange={e=>setName(e.target.value)} type="text" placeholder="e.g. Paracetamol" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:bg-white transition-all shadow-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Dose Amount</label>
                    <input required value={amount} onChange={e=>setAmount(e.target.value)} type="text" placeholder="e.g. 500mg" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:bg-white transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Time</label>
                    <input required value={time} onChange={e=>setTime(e.target.value)} type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:bg-white transition-all shadow-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Total Quantity</label>
                    <input required value={quantity} onChange={e=>setQuantity(e.target.value)} type="number" min="1" placeholder="e.g. 30 (pills)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:bg-white transition-all shadow-sm" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Instructions</label>
                    <select value={instruction} onChange={e=>setInstruction(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:bg-white transition-all shadow-sm appearance-none">
                      <option>Before Meals</option>
                      <option>After Meals</option>
                      <option>With Food</option>
                      <option>Night / Bed</option>
                      <option>Empty Stomach</option>
                    </select>
                  </div>
                </div>
                <div className="pt-2">
                  <button disabled={isSubmitting} type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 disabled:opacity-50 flex justify-center items-center gap-2">
                    {isSubmitting ? 'Saving...' : <><Plus size={18} /> Save Dosage</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}