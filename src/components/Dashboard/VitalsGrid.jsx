import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Thermometer, HeartPulse, Edit2, Check } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, unit, color, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-center gap-4 relative group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-opacity-100`}>
            <Icon size={24} className={color.replace('bg-', 'text-')} />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
        </div>
        
        {isEditing ? (
          <button onClick={handleSave} className="text-emerald-500 hover:text-emerald-600 transition-colors p-2 rounded-full hover:bg-emerald-50 shadow-sm border border-emerald-100 cursor-pointer z-10">
            <Check size={16} />
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-all p-2 rounded-full hover:bg-slate-50 cursor-pointer z-10">
            <Edit2 size={16} />
          </button>
        )}
      </div>

      <div className="px-1 flex items-baseline gap-1 mt-1">
        {isEditing ? (
          <input 
            type="text" 
            value={tempValue} 
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="text-3xl font-bold text-dark bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 w-32 outline-none focus:border-primary transition-colors z-10"
            autoFocus
          />
        ) : (
          <span className="text-3xl font-bold text-dark">{value}</span>
        )}
        <span className="text-slate-400 text-sm font-medium">{unit}</span>
      </div>
    </motion.div>
  );
};

export default function VitalsGrid() {
  const [vitals, setVitals] = useState({
    weight: "72.5",
    bodyTemp: "36.8",
    bloodPressure: "120/80"
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <StatCard 
        icon={Scale} 
        label="Weight" 
        value={vitals.weight} 
        unit="kg" 
        color="bg-primary" 
        onChange={(val) => setVitals({ ...vitals, weight: val })}
      />
      <StatCard 
        icon={Thermometer} 
        label="Body Temp" 
        value={vitals.bodyTemp} 
        unit="°C" 
        color="bg-orange-500" 
        onChange={(val) => setVitals({ ...vitals, bodyTemp: val })}
      />
      <StatCard 
        icon={HeartPulse} 
        label="Blood Pressure" 
        value={vitals.bloodPressure} 
        unit="mmHg" 
        color="bg-secondary" 
        onChange={(val) => setVitals({ ...vitals, bloodPressure: val })}
      />
    </div>
  );
}