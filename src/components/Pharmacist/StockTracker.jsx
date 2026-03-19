import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StockTracker() {
  const stockItems = [
    { id: 1, name: "Paracetamol 500mg", stock: 12, min: 50, expiry: "2026-04-10", type: "Tablet" },
    { id: 2, name: "Cough Syrup (Z-Link)", stock: 450, min: 100, expiry: "2027-10-22", type: "Syrup" },
    { id: 3, name: "Insulin Glargine", stock: 8, min: 20, expiry: "2026-05-01", type: "Injection" },
  ];

  const checkStatus = (item) => {
    if (item.stock < item.min) return { label: "Understock", color: "text-red-500 bg-red-50", icon: <ArrowDownRight size={14}/> };
    if (item.stock > 400) return { label: "Overstock", color: "text-orange-500 bg-orange-50", icon: <ArrowUpRight size={14}/> };
    return { label: "Healthy", color: "text-emerald-500 bg-emerald-50", icon: <CheckCircle2 size={14}/> };
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-dark">Live Inventory Ledger</h3>
          <p className="text-xs text-slate-400 mt-1">Real-time stock monitoring & alerts</p>
        </div>
        <button className="px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-primary border border-slate-100">View Full Report</button>
      </div>

      <div className="space-y-4">
        {stockItems.map((item) => {
          const status = checkStatus(item);
          return (
            <motion.div key={item.id} whileHover={{ x: 5 }} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50 transition-all">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-bold text-primary">
                  {item.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-dark">{item.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{item.type} • Batch: B223</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Stock</p>
                  <p className={`font-bold text-sm ${item.stock < item.min ? 'text-red-500' : 'text-dark'}`}>{item.stock}</p>
                </div>

                <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${status.color}`}>
                  {status.icon} {status.label}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}