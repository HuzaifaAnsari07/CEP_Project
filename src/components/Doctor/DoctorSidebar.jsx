import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, Calendar, 
  MessageSquare, Settings, LogOut, HeartPulse, ShieldCheck 
} from 'lucide-react';
import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function DoctorSidebar() {
  const navigate = useNavigate();
  
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, active: true },
    { name: 'My Patients', icon: Users },
    { name: 'Schedule', icon: Calendar },
    { name: 'Messages', icon: MessageSquare },
    { name: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className="w-24 lg:w-64 bg-white border-r border-slate-100 hidden md:flex flex-col py-8 px-4 h-screen sticky top-0 justify-between">
      <div className="space-y-10">
        {/* Logo */}
        <div className="flex items-center justify-center lg:justify-start gap-3 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <HeartPulse size={24} />
          </div>
          <span className="hidden lg:block font-bold text-xl tracking-tight text-primary uppercase italic">MediLink</span>
        </div>

        {/* Menu */}
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

      {/* Logout & Verification Badge */}
      <div className="space-y-4">
        <div className="hidden lg:flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
          <ShieldCheck size={16} className="text-secondary" />
          <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Verified Doctor</span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-50 transition-all"
        >
          <LogOut size={20} />
          <span className="hidden lg:block">Logout</span>
        </button>
      </div>
    </nav>
  );
}