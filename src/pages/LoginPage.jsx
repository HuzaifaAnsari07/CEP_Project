import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from "../firebase/config";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { 
  ArrowLeft, Mail, Lock, ShieldCheck, 
  User, Briefcase, Store, LogIn, Plus, Heart, Loader2, CheckCircle, XCircle 
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Verify role in Firestore
      const collectionName = role === 'doctor' ? 'doctors' : role === 'pharmacist' ? 'pharmacists' : 'users';
      const userDoc = await getDoc(doc(db, collectionName, user.uid));

      if (!userDoc.exists()) {
        await signOut(auth);
        setNotification({ type: 'error', message: `Unauthorized. No ${role} profile found.` });
        setTimeout(() => setNotification(null), 3000);
        setLoading(false);
        return;
      }

      setNotification({ type: 'success', message: 'Login Successful! Welcome.' });

      // LOGIC: Redirect based on the selected role
      setTimeout(() => {
        if (role === 'doctor') {
          navigate('/doctor-dashboard');
        } else if (role === 'pharmacist') {
          navigate('/pharmacist-dashboard'); // For future use
        } else {
          navigate('/patient-dashboard');
        }
      }, 1500);

    } catch (error) {
      setNotification({ type: 'error', message: 'Invalid Credentials' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'patient', label: 'Patient', icon: <User size={18} /> },
    { id: 'doctor', label: 'Doctor', icon: <Briefcase size={18} /> },
    { id: 'pharmacist', label: 'Pharmacist', icon: <Store size={18} /> },
  ];

  const renderTopIcon = () => {
    const iconBaseStyles = "w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm";
    switch (role) {
      case 'doctor': return <motion.div key="dr" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`${iconBaseStyles} bg-emerald-50`}><Briefcase className="text-secondary" size={38} /></motion.div>;
      case 'pharmacist': return <motion.div key="ph" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`${iconBaseStyles} bg-orange-50`}><Store className="text-accent" size={38} /></motion.div>;
      default: return <motion.div key="pt" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`${iconBaseStyles} bg-sky-50`}><User className="text-primary" size={38} /></motion.div>;
    }
  };

  return (
    <div className="min-h-screen bg-background font-poppins py-12 px-6 flex flex-col items-center justify-center relative">
      
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -100 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0, y: -100 }} className="fixed top-0 left-0 right-0 z-[100] flex justify-center">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${notification.type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              {notification.type === 'success' ? <CheckCircle size={24}/> : <XCircle size={24}/>}
              <span className="font-bold">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center mb-8">
        <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-all bg-white px-6 py-2 rounded-full shadow-sm border border-slate-100"><ArrowLeft size={18} /> Back to Home</Link>
      </div>

      <motion.div layout className="max-w-2xl w-full mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-12 flex flex-col items-center">
          <AnimatePresence mode="wait">{renderTopIcon()}</AnimatePresence>
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-dark">Welcome Back</h1>
              {role === 'patient' ? <Heart className="text-primary" size={28} /> : <Plus className="text-secondary" size={28} strokeWidth={3} />}
            </div>
            <p className="text-slate-400 italic">Enter your details to login</p>
          </div>

          <div className="w-full flex p-1.5 bg-slate-100 rounded-2xl mb-10 relative">
            {roles.map((r) => (
              <button key={r.id} onClick={() => setRole(r.id)} className={`relative z-10 flex-1 py-3 rounded-xl font-semibold transition-colors ${role === r.id ? "text-primary" : "text-slate-500"}`}>
                {r.label}
                {role === r.id && <motion.div layoutId="activeRole" className="absolute inset-0 bg-white rounded-xl shadow-md -z-10" />}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-6">
            <InputGroup label="Email" type="email" onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" icon={<Mail size={18}/>} />
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <a href="#" className="text-xs text-primary font-bold">Forgot?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="password" onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary text-sm" />
              </div>
            </div>
            <motion.button disabled={loading} type="submit" className={`w-full text-white py-4 rounded-2xl font-bold shadow-xl flex justify-center items-center gap-2 ${role === 'doctor' ? 'bg-secondary' : role === 'pharmacist' ? 'bg-accent' : 'bg-primary'}`}>
              {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={20} /> Login as {role}</>}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 w-full text-center">
             <p className="text-slate-500 text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary font-bold hover:underline">
                  Create Account
                </Link>
             </p>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-widest">
        <ShieldCheck size={16} className="text-secondary" />
        Authorized Healthcare Platform
      </div>
    </div>
  );
}

const InputGroup = ({ label, onChange, type = "text", placeholder, icon }) => (
  <div className="w-full space-y-2">
    <label className="text-sm font-semibold text-slate-700 ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
      <input required onChange={onChange} type={type} placeholder={placeholder} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary text-sm" />
    </div>
  </div>
);