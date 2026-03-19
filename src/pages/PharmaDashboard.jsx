import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Search, BarChart3 } from 'lucide-react';

// Components
import PharmaSidebar from '../components/Pharmacist/PharmaSidebar';
import InventoryStats from '../components/Pharmacist/InventoryStats';
import StockTracker from '../components/Pharmacist/StockTracker';
import SalesAnalytics from '../components/Pharmacist/SalesAnalytics';
import PatientCompliance from '../components/Pharmacist/PatientCompliance';
import BarcodeScannerModal from '../components/Pharmacist/BarcodeScannerModal';
import ExpiryAlerts from '../components/Pharmacist/ExpiryAlerts'; 

export default function PharmaDashboard() {
  const [showScanner, setShowScanner] = useState(false);
  const [storeName] = useState("LifeCare Pharmacy");

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-poppins text-slate-800 flex">
      <PharmaSidebar />

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-dark">Welcome, {storeName} 🏥</h1>
            <p className="text-slate-400 font-medium mt-1">
              You have <span className="text-red-500 font-bold underline">12 medicines</span> expiring within 3 months.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Search inventory..." 
                className="pl-12 pr-6 py-3 bg-white rounded-2xl border-none shadow-sm w-72 focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
              />
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowScanner(true)}
              className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Camera size={20} /> Add Medicine
            </motion.button>
          </div>
        </header>

        {/* 1. Categorized Stats Row */}
        <InventoryStats />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          
          {/* LEFT COLUMN (8 Units) - Main Ledger & Expiry */}
          <div className="lg:col-span-8 space-y-8">
            {/* Sales Analytics Charts */}
            <SalesAnalytics />
            
            {/* Inventory Ledger */}
            <StockTracker />

            {/* MOVED: Expiry Management (Now below Inventory Ledger) */}
            <ExpiryAlerts /> 
          </div>

          {/* RIGHT COLUMN (4 Units) - Compliance & AI */}
          <div className="lg:col-span-4 space-y-8">
            {/* Patient Compliance Tracker */}
            <PatientCompliance />
            
            {/* AI Predictive Restock Card */}
            <div className="bg-gradient-to-br from-dark to-slate-800 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10"><BarChart3 size={120} /></div>
              <h3 className="text-lg font-bold mb-2">AI Smart Restock</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Based on seasonal trends, your stock of <span className="text-secondary font-bold">Cetirizine</span> might run out in 5 days.
              </p>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-sm transition-all">
                Order from Distributor
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Overlays */}
      <BarcodeScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} />
    </div>
  );
}