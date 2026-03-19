import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Bell, User, Calendar, Users, 
  MessageCircle, ClipboardList, Database, 
  Star, Clock, ChevronRight, Zap 
} from 'lucide-react';
import { auth } from "../firebase/config";

// Component Imports
import DoctorSidebar from '../components/Doctor/DoctorSIdebar';
import AppointmentSection from '../components/Doctor/AppointmentSection';
import PatientManager from '../components/Doctor/PatientManager';
import PatientAISummary from '../components/Doctor/PatientAISummary';
import DoctorChatSystem from '../components/Doctor/DoctorChatSystem';

export default function DoctorDashboard() {
  const [activePatient, setActivePatient] = useState(null); // For AI Summary & Management
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F7FE] font-poppins text-slate-800 flex">
      <DoctorSidebar />

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {/* 1. Header & Search */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-dark">
              Welcome, Dr. {auth.currentUser?.displayName || 'Ansari'}! 🩺
            </h1>
            <p className="text-slate-400 font-medium mt-1">
              You have <span className="text-primary font-bold">8 appointments</span> scheduled for today.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Search patient by ID or Name..." 
                className="pl-12 pr-6 py-3 bg-white rounded-2xl border-none shadow-sm w-80 focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
              />
            </div>
            <button 
              onClick={() => setShowChat(true)}
              className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-primary relative transition-all"
            >
              <MessageCircle size={22} />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=doctor`} alt="Doctor" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Appointments & Patient Management (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Appointment Tracker */}
            <AppointmentSection onSelectPatient={setActivePatient} />

            {/* Manage Patients Section */}
            <PatientManager onSelectPatient={setActivePatient} />
          </div>

          {/* RIGHT: AI Assistant & Stats (4 Cols) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* AI Patient Summary Assistant */}
            <PatientAISummary patient={activePatient} />

            {/* Quick Stats Card */}
            <div className="bg-dark p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <Star size={150} />
              </div>
              <h3 className="text-xl font-bold mb-4">Daily Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                  <span className="text-slate-400 text-sm">Patients Treated</span>
                  <span className="font-bold text-lg text-secondary">14/20</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                  <span className="text-slate-400 text-sm">Avg. Rating</span>
                  <span className="font-bold text-lg text-yellow-400">4.9 ★</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Chat Overlay for Patient Queries */}
      <DoctorChatSystem isOpen={showChat} onClose={() => setShowChat(false)} />
    </div>
  );
}