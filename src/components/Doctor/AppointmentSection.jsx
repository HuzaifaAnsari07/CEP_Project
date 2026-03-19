import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, ChevronRight, MoreHorizontal, User, CheckCircle2, XCircle, Plus, Trash2, X, MoreVertical } from 'lucide-react';
import { db, auth } from '../../firebase/config';
import { collection, collectionGroup, query, where, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDoc, getDocs, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const AppointmentRow = ({ appt, onStatusUpdate, onDelete, onSelectPatient, onViewPatient }) => {
  const { patientName, type, date, time, status, id, slotId, isPast, patientDetails, patientId } = appt;

  return (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ x: 5 }}
    onClick={() => onSelectPatient && onSelectPatient({ id: patientId, name: patientName })}
    className="flex items-center justify-between p-4 mb-3 bg-white rounded-2xl border border-slate-50 hover:border-primary/20 hover:shadow-md transition-all group cursor-pointer"
  >
    <div className="flex items-center gap-4 flex-1">
      {/* Patient Avatar/Initials */}
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
        {(patientName || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
      </div>
      
      <div>
        <h4 
          onClick={(e) => { e.stopPropagation(); onViewPatient(patientId, patientName, patientDetails); }}
          className="font-bold text-dark text-sm hover:underline hover:text-primary transition-colors cursor-pointer"
        >
          {patientName}
        </h4>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase tracking-wider">
            {type || 'Consultation'}
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
            <Calendar size={10} /> {date}
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
            <Clock size={10} /> {time}
          </span>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-6">
      {/* Status Badge */}
      <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
        status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 
        status === 'Pending' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'Confirmed' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
        {status}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isPast && status !== 'Confirmed' && status !== 'Cancelled' && (
          <button 
            onClick={(e) => { e.stopPropagation(); onStatusUpdate(appt, 'Confirmed'); }}
            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" 
            title="Approve"
          >
            <CheckCircle2 size={18} />
          </button>
        )}
        {!isPast && status !== 'Cancelled' && status !== 'Completed' && (
          <button 
            onClick={(e) => { e.stopPropagation(); onStatusUpdate(appt, 'Cancelled'); }}
            className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" 
            title="Cancel"
          >
            <XCircle size={18} />
          </button>
        )}
        {isPast && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(appt); }}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
            title="Delete Record"
          >
            <Trash2 size={18} />
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onViewPatient(patientId, patientName, patientDetails); }}
          className="p-2 text-slate-400 hover:bg-slate-50 hover:text-primary rounded-lg transition-colors"
          title="View Patient Profile"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>
    </div>
  </motion.div>
  );
};

export default function AppointmentSection({ onSelectPatient }) {
  const [activeTab, setActiveTab] = useState('All');
  const [appointments, setAppointments] = useState({ All: [], Today: [], Upcoming: [], Past: [] });
  const [user, setUser] = useState(auth.currentUser);
  
  // Slot Management State
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [mySlots, setMySlots] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [isAddingSlot, setIsAddingSlot] = useState(false);

  // Patient Modal State
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const docRefAppointments = doc(db, 'doctors', user.uid);
    const unsub = onSnapshot(docRefAppointments, (snap) => {
      const apts = { All: [], Today: [], Upcoming: [], Past: [] };
      if (!snap.exists()) {
        setAppointments(apts);
        return;
      }
      
      const apptsData = snap.data().Appointment || snap.data().appointments || [];
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const validAppts = apptsData.filter(appt => typeof appt === 'object' && appt !== null && appt.date && appt.time);
      validAppts.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)).forEach(apptInfo => {
        const dateStr = apptInfo.date;
        const apptDate = new Date(`${dateStr} ${apptInfo.time}`);
        const isPast = apptDate < now;
        
        const apptObj = { ...apptInfo, isPast, rawAppt: apptInfo, id: apptInfo.id || Math.random().toString(), name: apptInfo.patientName || 'Unknown Patient', patientName: apptInfo.patientName || 'Unknown Patient', type: apptInfo.type || 'Consultation' };

        apts.All.push(apptObj);
        
        if (isPast) {
          apts.Past.push(apptObj);
        } else if (dateStr === todayStr) {
          apts.Today.push(apptObj);
        } else {
          apts.Upcoming.push(apptObj);
        }
      });
      
      // Sort upcoming by closeness
      apts.Upcoming.sort((a,b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
      
      setAppointments(apts);
    });

    // Fetch the doctor's available slots from arrays
    const docRefSlots = doc(db, 'doctors', user.uid);
    const unsubSlots = onSnapshot(docRefSlots, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const slots = data.slots || [];
        setMySlots(slots.sort((a,b) => new Date(a.date) - new Date(b.date)));
      }
    });

    return () => {
      unsub();
      unsubSlots();
    };
  }, [user]);

  const handleAddSlot = async () => {
    if(!newDate || !newTime || !user) return;
    setIsAddingSlot(true);
    try {
      const newSlot = {
        id: new Date().getTime().toString(),
        date: newDate,
        time: newTime,
        createdAt: new Date().getTime()
      };
      await setDoc(doc(db, 'doctors', user.uid), {
        slots: arrayUnion(newSlot)
      }, { merge: true });
      setNewDate('');
      setNewTime('');
    } catch(err) {
      console.error(err);
      alert("Please ensure your doctor profile document exists and is active!");
    } finally {
      setIsAddingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotToRemove) => {
    try {
      await updateDoc(doc(db, 'doctors', user.uid), {
        slots: arrayRemove(slotToRemove)
      });
    } catch(err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (appt, newStatus) => {
    try {
      const rawAppt = appt.rawAppt;
      const updatedAppt = { ...rawAppt, status: newStatus, isConfirmed: newStatus === 'Confirmed' };
      
      const doctorDocRef = doc(db, 'doctors', user.uid);
      await updateDoc(doctorDocRef, { Appointment: arrayRemove(rawAppt) });
      
      if (newStatus !== 'Cancelled') {
        await updateDoc(doctorDocRef, { Appointment: arrayUnion(updatedAppt) });
      }
      
      if (appt.patientId && appt.patientId !== 'unknown') {
        const patientDocRef = doc(db, 'users', appt.patientId);
        await updateDoc(patientDocRef, { Appointment: arrayRemove(rawAppt) });
        
        if (newStatus !== 'Cancelled') {
          await updateDoc(patientDocRef, { Appointment: arrayUnion(updatedAppt) });
        }
      }
      
      // If doctor confirms, optionally remove the slot from their availability
      if (newStatus === 'Confirmed' && appt.slotId && user) {
        const doctorDoc = await getDoc(doc(db, 'doctors', user.uid));
        if (doctorDoc.exists()) {
           const currentSlots = doctorDoc.data().slots || [];
           const updatedSlots = currentSlots.filter(s => s.id !== appt.slotId);
           await updateDoc(doc(db, 'doctors', user.uid), { slots: updatedSlots });
        }
      }
    } catch(err) {
      console.error("Error updating appointment state:", err);
    }
  };

  const handleDeleteRecord = async (appt) => {
    if (window.confirm("Are you sure you want to permanently delete this past appointment?")) {
      try {
        const rawAppt = appt.rawAppt;
        await updateDoc(doc(db, 'doctors', user.uid), { Appointment: arrayRemove(rawAppt) });
        
        if (appt.patientId && appt.patientId !== 'unknown') {
          await updateDoc(doc(db, 'users', appt.patientId), { Appointment: arrayRemove(rawAppt) });
        }
      } catch(err) {
        console.error("Error deleting appointment record: ", err);
      }
    }
  };

  const handleViewPatient = async (patientId, patientName, patientDetails) => {
    setShowPatientModal(true);
    setLoadingPatientDetails(true);
    try {
      if (patientDetails) {
        setSelectedPatientDetails(patientDetails);
        setLoadingPatientDetails(false);
        return;
      }
      
      let userData = null;
      if (patientId && patientId !== 'unknown') {
        const pDoc = await getDoc(doc(db, 'users', patientId));
        if (pDoc.exists()) {
          userData = pDoc.data();
        }
      }
      
      // If not found by ID or ID is unknown, fallback to searching by name in users table
      if (!userData && patientName && patientName !== 'Unknown Patient' && patientName !== 'Patient') {
        const q = query(collection(db, 'users'), where('fullName', '==', patientName));
        const snap = await getDocs(q);
        if (!snap.empty) {
          userData = snap.docs[0].data();
        }
      }

      if (userData) {
        setSelectedPatientDetails(userData);
      } else {
        // Fallback: Just show the name if query fails
        setSelectedPatientDetails({ fullName: patientName || 'Unknown Patient' });
      }
    } catch(err) {
      console.error(err);
      setSelectedPatientDetails({ fullName: patientName || 'Unknown Patient' });
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="text-xl font-bold text-dark flex items-center gap-2">
            <Calendar className="text-primary" size={24} /> Appointment Schedule
          </h3>
          <p className="text-xs text-slate-400 mt-1">Manage and track your daily patient flow</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSlotModal(true)}
            className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl text-sm hover:bg-primary hover:text-white transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Manage Slots
          </button>
          
          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {['All', 'Today', 'Upcoming', 'Past'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-slate-500 hover:text-dark"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appointment List Area */}
      <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {appointments[activeTab].map((apt) => (
              <AppointmentRow 
                key={apt.id}
                appt={apt}
                onStatusUpdate={handleStatusUpdate}
                onDelete={handleDeleteRecord}
                onViewPatient={handleViewPatient}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {appointments[activeTab].length === 0 && (
          <div className="text-center py-10">
            <p className="text-slate-400 text-sm">No appointments found for this category.</p>
          </div>
        )}
      </div>

      {/* Footer / View All */}
      <div className="mt-6 text-center border-t border-slate-50 pt-4">
        <button className="text-xs font-bold text-primary flex items-center gap-1 mx-auto hover:underline group">
          View Detailed Calendar <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      {/* Patient Profile Modal */}
      <AnimatePresence>
        {showPatientModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-dark/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-slate-50 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-sm shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowPatientModal(false)} 
                className="absolute top-6 right-6 text-slate-400 hover:text-dark transition-colors bg-white p-2 rounded-full shadow-sm z-10"
              >
                <X size={20} />
              </button>
              
              <h3 className="font-bold text-xl mb-6 text-dark flex items-center gap-3">
                <User className="text-[#0080FF]" size={24} /> {selectedPatientDetails ? `${selectedPatientDetails.fullName || 'Patient'}` : 'Patient'} Profile
              </h3>
              
              {loadingPatientDetails ? (
                <p className="text-center text-[#0080FF] font-bold text-sm py-10 animate-pulse">Loading profile...</p>
              ) : selectedPatientDetails ? (
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Age</p>
                    <p className="font-bold text-dark text-sm">{selectedPatientDetails.age ? `${selectedPatientDetails.age} YRS` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Gender</p>
                    <p className="font-bold text-dark text-sm">{selectedPatientDetails.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Blood Group</p>
                    <p className="font-bold text-[#0080FF] text-sm">{selectedPatientDetails.bloodGroup || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Contact</p>
                    <p className="font-bold text-dark text-sm">{selectedPatientDetails.phone || selectedPatientDetails.contact || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Email</p>
                    <p className="font-bold text-dark text-sm">{selectedPatientDetails.email || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Address</p>
                    <p className="font-bold text-dark text-sm leading-relaxed">{selectedPatientDetails.address || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-white rounded-3xl border border-slate-200 border-dashed">
                  <p className="text-slate-500 font-bold mb-2">Profile Not Found</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for Slot Management */}
      <AnimatePresence>
        {showSlotModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-dark/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <button onClick={() => setShowSlotModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-dark transition-colors bg-slate-100 p-2 rounded-full z-10">
                <X size={20} />
              </button>
              
              <h3 className="font-bold text-2xl mb-2 text-dark flex items-center gap-3">
                 <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0"><Clock size={24} /></div>
                 Availability Slots
              </h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">Add time slots when you are available for appointments.</p>
              
              {/* Add Slot Form */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <input 
                  type="date" 
                  value={newDate} 
                  onChange={(e) => setNewDate(e.target.value)}
                  className="px-4 py-3 bg-white border border-slate-200 rounded-xl flex-1 text-sm outline-none focus:border-primary"
                  min={new Date().toISOString().split('T')[0]}
                />
                <input 
                  type="time" 
                  value={newTime} 
                  onChange={(e) => setNewTime(e.target.value)}
                  className="px-4 py-3 bg-white border border-slate-200 rounded-xl flex-1 text-sm outline-none focus:border-primary"
                />
                <button 
                  onClick={handleAddSlot}
                  disabled={isAddingSlot || !newDate || !newTime}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {isAddingSlot ? 'Adding...' : 'Add'}
                </button>
              </div>

              {/* Existing Slots List */}
              <div className="flex-1 overflow-y-auto px-1 custom-scrollbar space-y-3">
                <h4 className="font-bold text-sm text-slate-700 mb-3 sticky top-0 bg-white py-1">Your Active Slots</h4>
                {mySlots.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500 text-sm font-medium">No slots added yet.</p>
                  </div>
                ) : (
                  mySlots.map(slot => (
                    <div key={slot.id} className="flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-xl hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/5 text-primary rounded-lg"><Calendar size={18} /></div>
                        <div>
                          <p className="font-bold text-dark text-sm">{slot.date}</p>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Clock size={12}/> {slot.time}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteSlot(slot)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Slot"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}