import React from 'react';
import { motion } from 'framer-motion';
import { Pill, Droplets, FlaskConical, Thermometer, Syringe } from 'lucide-react';

const StatCard = ({ label, count, icon: Icon, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm flex items-center gap-5 flex-1 min-w-[200px]"
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h4 className="text-2xl font-bold text-dark">{count}</h4>
    </div>
  </motion.div>
);

export default function InventoryStats() {
  const stats = [
    { label: 'Tablets', count: '1,240', icon: Pill, color: 'bg-blue-500' },
    { label: 'Syrups', count: '450', icon: Droplets, color: 'bg-emerald-500' },
    { label: 'Injections', count: '85', icon: Syringe, color: 'bg-purple-500' },
    { label: 'Capsules', count: '920', icon: FlaskConical, color: 'bg-orange-500' },
    { label: 'Ointments', count: '130', icon: Thermometer, color: 'bg-pink-500' },
  ];

  return (
    <div className="flex flex-wrap gap-6">
      {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
    </div>
  );
}