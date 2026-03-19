import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Clock, MapPin, Plus, X, Stethoscope, Briefcase, Award, Trash2 } from 'lucide-react';
import { db, auth } from '../../firebase/config';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, getDocs, getDoc, where, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const AppointmentCard = ({ id, doctor, specialty, date, time, room, status, isPast, onReschedule, onCancel }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9, height: 0, overflow: 'hidden', padding: 0, margin: 0 }}
    className="bg-dark p-6 sm:p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group shrink-0 w-full mb-4"
  >
    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 group-hover:opacity-10 transition-all duration-500">
      <Calendar size={120} />
    </div>
    
    <div className="flex justify-between items-center mb-6 relative z-10">
      <h3 className="text-xl font-bold flex items-center gap-2">
        Upcoming Appointment <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
      </h3>
      
      {/* Status Badge */}
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
        status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
        status === 'Cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
        'bg-orange-500/20 text-orange-400 border border-orange-500/20'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${
          status === 'Confirmed' ? 'bg-emerald-400' :
          status === 'Cancelled' ? 'bg-red-400' : 'bg-orange-400'
        }`} />
        {status || 'Pending'}
      </span>
    </div>

    <div className="space-y-6 relative z-10">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0 shadow-inner">
          <User size={20} className="text-secondary" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide">{doctor}</p>
          <p className="text-xs text-slate-400 font-medium">{specialty}</p>
        </div>
      </div>

      <div className="flex justify-between bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm shadow-sm gap-2">
        <div className="text-center flex-1">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Date</p>
          <p className="text-xs sm:text-sm font-bold">{date}</p>
        </div>
        <div className="w-[1px] bg-white/10"></div>
        <div className="text-center flex-1">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Time</p>
          <p className="text-xs sm:text-sm font-bold">{time}</p>
        </div>
        <div className="w-[1px] bg-white/10"></div>
        <div className="text-center flex-1">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Room</p>
          <p className="text-xs sm:text-sm font-bold">{room}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <motion.button 
          onClick={() => onReschedule(id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-secondary/10 border border-secondary/20 rounded-xl font-bold text-sm shadow-sm hover:bg-secondary hover:text-white transition-all text-secondary flex-1"
        >
          Reschedule
        </motion.button>
        <motion.button 
          onClick={() => onCancel(id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-red-400/10 border border-red-400/20 rounded-xl font-bold text-sm shadow-sm hover:bg-red-500 hover:text-white transition-all text-red-400 flex-1"
        >
          Cancel
        </motion.button>
      </div>
    </div>
  </motion.div>
);

export default function AppointmentManager() {
  const [user, setUser] = useState(auth.currentUser);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  // Fetch true doctors from 'users' collection with role=='doctor'
  useEffect(() => {
    if(!showModal) return; // Only fetch when needed, nice optimization
    
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const snap = await getDocs(collection(db, 'doctors'));
        const fetchedDoctors = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.fullName || 'Unknown Doctor',
            specialty: data.specialization || 'General',
            experience: data.experience ? `${data.experience} Years` : 'Not Specified',
            qualification: data.degree || 'Not Specified'
          };
        });
        setDoctors(fetchedDoctors);
      } catch (err) {
        console.error("Error fetching authentic doctors", err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, [showModal]);

  // Listen to user's personal appointments natively from arrays
  useEffect(() => {
    if(!user) return;
    const docRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(docRef, (snap) => {
      if(snap.exists()) {
        const data = snap.data();
        const apptsData = data.Appointment || data.appointments || [];
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        // Filter out manually input strings or invalid primitives
        const validAppts = apptsData.filter(appt => typeof appt === 'object' && appt !== null && appt.date && appt.time);
        
        const appts = validAppts.map(data => {
          const dateStr = data.date || "Upcoming";
          let isPast = false;
          if (dateStr < todayStr) {
            isPast = true;
          } else if (dateStr === todayStr) {
            try {
              const timeStr = data.time || '10:00 AM';
              const [timeMatch, modifier] = timeStr.split(' ');
              let [hours, minutes] = timeMatch.split(':');
              hours = parseInt(hours, 10);
              if (hours === 12 && modifier === 'AM') hours = 0;
              else if (hours !== 12 && modifier === 'PM') hours += 12;
              
              const aptDate = new Date(`${dateStr}T${hours.toString().padStart(2, '0')}:${minutes}:00`);
              if (now > aptDate) {
                isPast = true;
              }
            } catch(e) { console.error("Parse error", e); }
          }
          return { ...data, isPast, rawAppt: data, id: data.id };
        });

        appts.sort((a,b) => b.createdAt - a.createdAt); // Newest bookings first
        setAppointments(appts);
      } else {
        setAppointments([]);
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if(!selectedDoctor) {
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    const docRef = doc(db, 'doctors', selectedDoctor.id);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const slots = data.slots || [];
        setAvailableSlots(slots.sort((a,b) => new Date(a.date) - new Date(b.date)));
      } else {
        setAvailableSlots([]);
      }
      setLoadingSlots(false);
    });
    return () => unsub();
  }, [selectedDoctor]);

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleBook = async (slot) => {
    if(!user || !selectedDoctor) return;
    setIsSubmitting(true);
    try {
      // Fetch full patient data from users collection
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : { fullName: user.displayName || 'Patient' };
      
      let newAppt = {
        id: new Date().getTime().toString(),
        uid: new Date().getTime().toString(), // Adding explicitly for their format
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name || 'Unknown',
        doctor: selectedDoctor.name || 'Unknown',
        specialty: selectedDoctor.specialty || 'General',
        patientId: user.uid,
        patientName: userData.fullName || user.displayName || 'Patient',
        patientDetails: userData,
        date: slot.date,
        time: slot.time,
        room: `Room ${Math.floor(Math.random() * 50) + 1}`,
        status: 'Pending',
        isConfirmed: false,
        createdAt: new Date().getTime(),
        slotId: slot.id
      };
      
      // Firebase throws errors on undefined fields; sanitize securely using JSON serialization
      newAppt = JSON.parse(JSON.stringify(newAppt));
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { Appointment: arrayUnion(newAppt) }, { merge: true });
      
      const docRef = doc(db, 'doctors', selectedDoctor.id);
      await setDoc(docRef, { Appointment: arrayUnion(newAppt) }, { merge: true });
      
      setShowModal(false);
      setSelectedDoctor(null);
    } catch(err) {
      console.error("Booking Error:", err);
      alert(`Booking Failed: ${err.message}. Please check console.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (appt) => {
    if(!user) return;
    if(window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        const rawAppt = appt.rawAppt;
        
        await updateDoc(doc(db, 'users', user.uid), { Appointment: arrayRemove(rawAppt) });
        
        if (appt.doctorId) {
          await updateDoc(doc(db, 'doctors', appt.doctorId), { Appointment: arrayRemove(rawAppt) });
        }
      } catch (err) {
        console.error("Error cancelling appointment:", err);
      }
    }
  };

  const handleReschedule = async (appt) => {
    if(!user) return;
    try {
      const rawAppt = appt.rawAppt;
      await updateDoc(doc(db, 'users', user.uid), { Appointment: arrayRemove(rawAppt) });
      if (appt.doctorId) {
        await updateDoc(doc(db, 'doctors', appt.doctorId), { Appointment: arrayRemove(rawAppt) });
      }
      setSelectedDoctor(null);
      setShowModal(true);
    } catch (err) {
      console.error("Error deleting appointment:", err);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* 1. Book Appointment Action Card */}
      <motion.div 
        onClick={() => setShowModal(true)}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer shrink-0"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-inner">
            <Plus size={28} />
          </div>
          <div>
            <h3 className="font-bold text-dark">Book Appointment</h3>
            <p className="text-xs text-slate-400">Find and schedule a specialist</p>
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-2xl text-slate-300 group-hover:text-primary transition-colors group-hover:bg-primary/5">
          <Calendar size={20} />
        </div>
      </motion.div>

      {/* 2. Appointments Display (Scrollable List) */}
      <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {appointments.length > 0 ? (
            appointments.map(appt => (
              <AppointmentCard 
                key={appt.id}
                id={appt.id}
                doctor={appt.doctor}
                specialty={appt.specialty}
                date={appt.date}
                time={appt.time}
                room={appt.room}
                status={appt.status}
                isPast={appt.isPast}
                onReschedule={() => handleReschedule(appt)}
                onCancel={() => handleCancel(appt)}
              />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              className="bg-dark/5 p-8 rounded-[2.5rem] border border-slate-200 border-dashed text-center"
            >
               <p className="text-sm text-slate-500 font-bold mb-2">No Upcoming Appointments</p>
               <p className="text-xs text-slate-400 max-w-xs mx-auto">Click Book Appointment above to seamlessly schedule your very first session.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-dark/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <button onClick={() => { setShowModal(false); setSelectedDoctor(null); }} className="absolute top-6 right-6 text-slate-400 hover:text-dark transition-colors bg-slate-100 p-2 rounded-full z-10">
                <X size={20} />
              </button>
              
              <h3 className="font-bold text-2xl mb-2 text-dark flex items-center gap-3 pr-10">
                 <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0"><Stethoscope size={24} /></div>
                 {selectedDoctor ? 'Select a Time Slot' : 'Available Doctors'}
              </h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">
                  {selectedDoctor ? `Viewing slots for ${selectedDoctor.name}` : 'Select a specialist to view their availability.'}
              </p>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {!selectedDoctor ? (
                  <div className="space-y-4">
                    {loadingDoctors ? (
                      <p className="text-center text-primary font-bold text-sm py-10 animate-pulse">Fetching doctors...</p>
                    ) : (
                      <>
                        {doctors.map(doc => (
                          <motion.button 
                            key={doc.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDoctorSelect(doc)}
                            className="w-full text-left bg-slate-50 p-5 rounded-3xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all group flex flex-col sm:flex-row sm:items-start gap-4"
                          >
                             <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                               <User size={20} />
                             </div>
                             <div>
                               <h4 className="font-bold text-dark text-lg group-hover:text-primary transition-colors">{doc.name}</h4>
                               <p className="text-secondary font-bold text-xs mb-2 uppercase tracking-wide">{doc.specialty}</p>
                               <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                  <span className="flex items-center gap-1"><Briefcase size={12} /> {doc.experience}</span>
                                  <span className="flex items-center gap-1"><Award size={12} /> {doc.qualification}</span>
                               </div>
                             </div>
                          </motion.button>
                        ))}
                        {doctors.length === 0 && (
                          <div className="text-center py-10 px-4 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                            <p className="text-slate-500 font-bold mb-2">No Verified Doctors Found</p>
                            <p className="text-xs text-slate-400">Head over to the Sign-Up page and register an account under the "Doctor" role so they appear right here natively!</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                     {loadingSlots ? (
                       <p className="text-center text-primary font-bold text-sm py-10 animate-pulse">Loading available slots...</p>
                     ) : availableSlots.length === 0 ? (
                       <div className="text-center py-10 px-4 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                         <p className="text-slate-500 font-bold mb-2">No Slots Available</p>
                         <p className="text-xs text-slate-400">This doctor hasn't posted any available times yet.</p>
                       </div>
                     ) : (
                       availableSlots.map((slot, index) => (
                          <motion.button
                          key={slot.id}
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => handleBook(slot)}
                          disabled={isSubmitting}
                          className="w-full bg-white border-2 border-slate-100 p-4 sm:p-5 rounded-3xl flex items-center justify-between hover:border-primary transition-colors group"
                        >
                           <div>
                             <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Date</p>
                             <p className="font-bold text-dark text-base sm:text-lg">{slot.date}</p>
                           </div>
                           <div className="w-[1px] h-10 bg-slate-100 mx-2 sm:mx-0"></div>
                           <div>
                             <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Time</p>
                             <p className="font-bold text-primary text-base sm:text-lg flex items-center gap-1.5"><Clock size={16} /> {slot.time}</p>
                           </div>
                        </motion.button>
                       ))
                     )}
                     
                     <button
                       onClick={() => setSelectedDoctor(null)}
                       className="w-full py-4 mt-2 text-slate-500 font-bold hover:text-dark transition-colors"
                     >
                       Back to Doctors List
                     </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}