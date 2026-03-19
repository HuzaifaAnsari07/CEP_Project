import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, XCircle, Trash2, ArrowRight, ChevronRight } from 'lucide-react';

export default function ExpiryAlertSystem() {
  const medicines = [
    { id: 1, name: "Cough Syrup A", expiry: "2026-03-10", batch: "Z11" }, // Crossed
    { id: 2, name: "Vitamin C Tabs", expiry: "2026-05-15", batch: "V40" }, // Near
    { id: 3, name: "Painkiller X", expiry: "2026-06-01", batch: "P09" },   // Near
  ];

  const getExpiryStatus = (dateStr) => {
    const exp = new Date(dateStr);
    const today = new Date();
    const threeMonths = new Date();
    threeMonths.setMonth(today.getMonth() + 3);

    if (exp < today) return "EXPIRED";
    if (exp <= threeMonths) return "NEAR";
    return "SAFE";
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-dark flex items-center gap-2">
            <AlertCircle className="text-red-500" size={24} /> Expiry Watchdog
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">Automatic batch monitoring system</p>
        </div>
        
        {/* View All Button Added to top corner */}
        <button className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-xl hover:bg-primary hover:text-white transition-all">
          View All <ChevronRight size={14} />
        </button>
      </div>

      {/* Height restricted to max-h-[320px] to prevent it from being too long */}
      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
        {medicines.map(med => {
          const status = getExpiryStatus(med.expiry);
          if (status === "SAFE") return null;

          return (
            <motion.div 
              key={med.id}
              whileHover={{ x: 5 }}
              className={`p-4 rounded-3xl border flex items-center justify-between transition-all ${
                status === "EXPIRED" ? "bg-red-50 border-red-100" : "bg-orange-50 border-orange-100"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${status === "EXPIRED" ? "bg-white text-red-500" : "bg-white text-orange-500 shadow-sm"}`}>
                  {status === "EXPIRED" ? <XCircle size={20} /> : <AlertCircle size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-dark">{med.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    Expiry: <span className={status === "EXPIRED" ? "text-red-600 font-black" : "text-orange-600 font-black"}>{med.expiry}</span>
                  </p>
                </div>
              </div>

              <button className={`p-2 rounded-xl transition-all ${
                status === "EXPIRED" ? "text-red-400 hover:bg-red-500 hover:text-white" : "text-orange-400 hover:bg-orange-500 hover:text-white"
              }`}>
                {status === "EXPIRED" ? <Trash2 size={18} /> : <ArrowRight size={18} />}
              </button>
            </motion.div>
          );
        })}
        
        {medicines.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-xs italic">
            No near-expiry medicines found.
          </div>
        )}
      </div>
    </div>
  );
}