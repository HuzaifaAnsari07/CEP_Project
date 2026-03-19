import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Clipboard } from 'lucide-react';

export default function DoctorChatSystem({ isOpen, onClose }) {
  const incomingChats = [
    { id: 1, name: "Husefa Ansari", lastMsg: "I've been feeling dizzy since morning...", age: 21, blood: "O+" },
    { id: 2, name: "Rahul Sharma", lastMsg: "Should I continue the meds?", age: 45, blood: "B-" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-dark/40 backdrop-blur-sm flex justify-end"
        >
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="w-full max-w-xl bg-white h-full shadow-2xl flex overflow-hidden"
          >
            {/* List of Patients asking queries */}
            <div className="w-1/3 border-r border-slate-100 bg-slate-50/50">
               <div className="p-6 border-b border-slate-100 font-bold text-dark">Queries</div>
               {incomingChats.map(chat => (
                 <button key={chat.id} className="w-full p-4 flex gap-3 items-center hover:bg-white transition-all text-left border-b border-slate-50">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">{chat.name[0]}</div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold text-xs text-dark truncate">{chat.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{chat.lastMsg}</p>
                    </div>
                 </button>
               ))}
            </div>

            {/* Chat Interface */}
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-bold text-dark">Husefa Ansari</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold tracking-widest">AGE: 21</span>
                    <span className="text-[9px] bg-primary/10 px-2 py-0.5 rounded text-primary font-bold tracking-widest">BLOOD: O+</span>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"><X size={20}/></button>
              </div>

              <div className="flex-1 p-6 bg-slate-50/30 overflow-y-auto">
                 {/* Chat bubbles here */}
              </div>

              <div className="p-6 border-t border-slate-100 bg-white">
                <div className="flex gap-2">
                  <input type="text" placeholder="Reply to Husefa..." className="flex-1 bg-slate-100 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  <button className="bg-primary text-white p-3 rounded-xl shadow-lg shadow-primary/20"><Send size={20}/></button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}