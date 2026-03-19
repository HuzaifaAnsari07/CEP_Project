import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // Added for navigation
import { 
  LayoutDashboard, Box, ShoppingCart, Users, 
  Settings, LogOut, Pill, HeartPulse 
} from 'lucide-react';

export default function PharmaSidebar() {
  const navigate = useNavigate(); // Initialize navigate

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, active: true },
    { name: 'Inventory', icon: Box },
    { name: 'Sales Orders', icon: ShoppingCart },
    { name: 'Regular Patients', icon: Users },
    { name: 'Settings', icon: Settings },
  ];

  // Logout handler
  const handleLogout = () => {
    // You can add auth.signOut() here if using Firebase
    navigate('/login');
  };

  return (
    <nav className="w-24 lg:w-64 bg-white border-r border-slate-100 hidden md:flex flex-col py-8 px-4 h-screen sticky top-0 justify-between shadow-sm">
      <div className="space-y-10">
        <div className="flex items-center justify-center lg:justify-start gap-3 px-2">
          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-white shadow-lg shadow-secondary/30">
            <Pill size={24} />
          </div>
          <span className="hidden lg:block font-bold text-xl tracking-tight text-secondary uppercase italic">PharmaLink</span>
        </div>

        <div className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <motion.button 
              key={item.name}
              whileHover={{ x: 5 }}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                item.active ? "bg-secondary text-white shadow-md shadow-secondary/20" : "text-slate-400 hover:text-secondary hover:bg-secondary/5"
              }`}
            >
              <item.icon size={20}/>
              <span className="hidden lg:block">{item.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <button 
        onClick={handleLogout} // Added onClick event
        className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-50 transition-all"
      >
        <LogOut size={20} />
        <span className="hidden lg:block">Logout Store</span>
      </button>
    </nav>
  );
}