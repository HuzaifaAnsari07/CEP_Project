import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, storage } from "../firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { 
  ArrowLeft, Upload, User, Briefcase, GraduationCap, 
  Hospital, ShieldCheck, Mail, Phone, MapPin, 
  Dna, Calendar as CalendarIcon, FileText, Store, CheckCircle, XCircle, Loader2 
} from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Data States
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      let proofUrl = "";
      if (file && (role === 'doctor' || role === 'pharmacist')) {
        // Enforce 1MB limit for Firestore document
        if (file.size > 1048487) {
           throw new Error("File too large! Please upload a document strictly under 1 MB.");
        }
        proofUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
      }

      const collectionName = role === 'doctor' ? 'doctors' : role === 'pharmacist' ? 'pharmacists' : 'users';
      await setDoc(doc(db, collectionName, user.uid), {
        uid: user.uid,
        role,
        ...formData,
        proofUrl,
        createdAt: new Date().toISOString()
      });

      setNotification({ type: 'success', message: 'Account Created Successfully!' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'patient', label: 'Patient', icon: <User size={18} /> },
    { id: 'doctor', label: 'Doctor', icon: <Briefcase size={18} /> },
    { id: 'pharmacist', label: 'Pharmacist', icon: <Store size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-background font-poppins py-12 px-6 selection:bg-primary selection:text-white relative">
      
      {/* Toast Notification Card */}
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
        <motion.div whileHover={{ x: -5 }}>
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-all bg-white px-6 py-2 rounded-full shadow-sm border border-slate-100">
            <ArrowLeft size={18} /> Back to Home
          </Link>
        </motion.div>
      </div>

      <motion.div layout className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-dark mb-2">Create Account</motion.h1>
            <p className="text-slate-400">Select your profile type to continue</p>
          </div>

          <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-10 relative">
            {roles.map((r) => (
              <button key={r.id} onClick={() => setRole(r.id)} className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors duration-300 ${role === r.id ? "text-primary" : "text-slate-500 hover:text-slate-700"}`}>
                {r.icon} {r.label}
                {role === r.id && <motion.div layoutId="activeRole" className="absolute inset-0 bg-white rounded-xl shadow-md -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
              </button>
            ))}
          </div>

          <form onSubmit={handleSignUp} className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div key={role} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-5">
                {role === 'doctor' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-5">
                      <InputGroup label="Full Name" name="fullName" onChange={handleChange} placeholder="Dr. Husefa Ansari" icon={<User size={18}/>} />
                      <InputGroup label="Specialization" name="specialization" onChange={handleChange} placeholder="Cardiologist" icon={<Dna size={18}/>} />
                    </div>
                    <InputGroup label="Hospital/Clinic Name" name="hospitalName" onChange={handleChange} placeholder="City Care Center" icon={<Hospital size={18}/>} />
                    <InputGroup label="Email Address" name="email" onChange={handleChange} type="email" placeholder="husefa@doctor.com" icon={<Mail size={18}/>} />
                    <div className="grid md:grid-cols-2 gap-5">
                      <InputGroup label="Education/Degree" name="degree" onChange={handleChange} placeholder="MBBS, MD" icon={<GraduationCap size={18}/>} />
                      <InputGroup label="Experience (Years)" name="experience" onChange={handleChange} type="number" placeholder="8" icon={<Briefcase size={18}/>} />
                    </div>
                    <UploadGroup label="Medical Degree Proof" onChange={(e) => setFile(e.target.files[0])} hint="Upload PDF or JPG (Max 5MB)" />
                  </>
                )}

                {role === 'patient' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-5">
                      <InputGroup label="Full Name" name="fullName" onChange={handleChange} placeholder="John Doe" icon={<User size={18}/>} />
                      <InputGroup label="Contact Number" name="contact" onChange={handleChange} placeholder="+91 98765 43210" icon={<Phone size={18}/>} />
                    </div>
                    <InputGroup label="Email Address" name="email" onChange={handleChange} type="email" placeholder="john@example.com" icon={<Mail size={18}/>} />
                    <div className="grid md:grid-cols-3 gap-5">
                      <InputGroup label="Age" name="age" onChange={handleChange} type="number" placeholder="25" icon={<CalendarIcon size={18}/>} />
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Gender</label>
                        <select name="gender" onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all text-sm outline-none">
                          <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                      </div>
                      <InputGroup label="Blood Group" name="bloodGroup" onChange={handleChange} placeholder="O+" icon={<Dna size={18}/>} />
                    </div>
                    <InputGroup label="Full Address" name="address" onChange={handleChange} placeholder="Street, City, State" icon={<MapPin size={18}/>} />
                  </>
                )}

                {role === 'pharmacist' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-5">
                      <InputGroup label="Owner Name" name="fullName" onChange={handleChange} placeholder="Owner Full Name" icon={<User size={18}/>} />
                      <InputGroup label="Medical Store Name" name="storeName" onChange={handleChange} placeholder="Ansari Medicals" icon={<Store size={18}/>} />
                    </div>
                    <InputGroup label="Store Address" name="address" onChange={handleChange} placeholder="Locality, Panvel, Navi Mumbai" icon={<MapPin size={18}/>} />
                    <div className="grid md:grid-cols-2 gap-5">
                      <InputGroup label="License Number" name="license" onChange={handleChange} placeholder="LIC-998877" icon={<FileText size={18}/>} />
                      <InputGroup label="Contact Email" name="email" onChange={handleChange} type="email" placeholder="store@pharmacy.com" icon={<Mail size={18}/>} />
                    </div>
                    <UploadGroup label="Drug License (Verification)" onChange={(e) => setFile(e.target.files[0])} hint="Upload scanned license copy" />
                  </>
                )}

                <InputGroup label="Set Password" name="password" onChange={handleChange} type="password" placeholder="••••••••" icon={<ShieldCheck size={18}/>} />

                <motion.button disabled={loading} type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-opacity-90 transition-all mt-6 text-lg flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" /> : (role === 'doctor' ? 'Request Verification' : 'Sign Up Now')}
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </form>

          <p className="text-center mt-10 text-slate-500 text-sm">Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Login here</Link></p>
        </div>
      </motion.div>
    </div>
  );
}

const InputGroup = ({ label, name, onChange, type = "text", placeholder, icon }) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-slate-700 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">{icon}</div>
      <input required name={name} onChange={onChange} type={type} placeholder={placeholder} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm" />
    </div>
  </div>
);

const UploadGroup = ({ label, hint, onChange }) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-slate-700 ml-1">{label}</label>
    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:border-primary/50 transition-all cursor-pointer group hover:bg-white relative">
      <Upload className="text-primary mb-2" size={20} />
      <p className="text-sm font-medium text-slate-700">Click to browse files</p>
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
      <input type="file" required onChange={onChange} className="absolute inset-0 opacity-0 cursor-pointer" />
    </div>
  </div>
);