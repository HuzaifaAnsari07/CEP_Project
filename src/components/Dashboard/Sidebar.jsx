import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config'; // Adjust path if necessary
import { signOut } from 'firebase/auth';
import { 
  Activity, Calendar, FileText, Pill, 
  MessageSquare, HeartPulse, LogOut 
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', icon: Activity, active: true },
    { name: 'Appointments', icon: Calendar },
    { name: 'Reports', icon: FileText },
    { name: 'Medications', icon: Pill },
    { name: 'Consultations', icon: MessageSquare },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <nav className="w-24 lg:w-64 bg-white border-r border-slate-100 hidden md:flex flex-col py-8 px-4 h-screen sticky top-0 justify-between">
      <div className="flex flex-col gap-10">
        {/* Logo */}
        <div className="flex items-center justify-center lg:justify-start gap-3 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <HeartPulse size={24} />
          </div>
          <span className="hidden lg:block font-bold text-xl tracking-tight text-primary">MediLink</span>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <motion.button 
              key={item.name}
              whileHover={{ x: 5 }}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                item.active ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-400 hover:text-primary hover:bg-primary/5"
              }`}
            >
              <item.icon size={20}/>
              <span className="hidden lg:block">{item.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-2">
        <motion.button 
          whileHover={{ x: 5 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={20}/>
          <span className="hidden lg:block">Logout</span>
        </motion.button>
      </div>
    </nav>
  );
}