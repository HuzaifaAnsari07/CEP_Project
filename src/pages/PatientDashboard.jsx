import React, { useState } from 'react';
import { Search, Plus, Bot, MessageSquare } from 'lucide-react';
import { auth } from "../firebase/config";

// Components
import Sidebar from '../components/Dashboard/Sidebar';
import VitalsGrid from '../components/Dashboard/VitalsGrid';
import MedicationTracker from '../components/Dashboard/MedicationTracker';
import AIConsultant from '../components/Dashboard/AIConsultant';
import AppointmentManager from '../components/Dashboard/AppointmentManager';
import ConsultationChat from '../components/Dashboard/ConsultationChat';
import MedicalRecords from '../components/Dashboard/MedicalRecords';

export default function PatientDashboard() {
  const [showAIConsultant, setShowAIConsultant] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-poppins text-dark flex">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-dark mb-1">
              Hello, {auth.currentUser?.displayName || 'Husefa'}! 👋
            </h1>
            <p className="text-slate-400 font-medium text-sm italic">
              "Track your health journey with precision and ease."
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search dashboard..." className="pl-12 pr-6 py-3 bg-white rounded-2xl border border-slate-100 outline-none w-64 focus:border-primary transition-all shadow-sm" />
            </div>
            
            <button className="flex items-center gap-3 bg-white pl-2 pr-4 py-2 rounded-2xl border border-slate-100 hover:border-primary transition-all">
              <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden shadow-inner">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid || 'Husefa'}`} alt="Avatar" />
              </div>
              <span className="font-bold text-sm hidden sm:block tracking-tight">My Profile</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button className="bg-primary text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                <Plus size={20} /> New Record
              </button>
              
              <button 
                onClick={() => setShowLiveChat(true)}
                className="bg-dark text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-dark/20 hover:scale-105 transition-transform"
              >
                <MessageSquare size={20} /> Consult Now
              </button>

              <button 
                onClick={() => setShowAIConsultant(true)} 
                className="bg-secondary text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-secondary/20 hover:scale-105 transition-transform"
              >
                <Bot size={20} /> AI Symptom Check
              </button>
            </div>

            {/* Vitals Grid */}
            <VitalsGrid />
            
            {/* Medication Tracker comes first now */}
            <MedicationTracker />

            {/* Medical Records moved below Medication Tracker */}
            <MedicalRecords />
          </div>

          {/* Right Section */}
          <div className="space-y-8">
            <AppointmentManager />
          </div>
        </div>
      </main>

      {/* Overlays */}
      <AIConsultant isOpen={showAIConsultant} onClose={() => setShowAIConsultant(false)} />
      <ConsultationChat isOpen={showLiveChat} onClose={() => setShowLiveChat(false)} />
    </div>
  );
}