import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, User, Phone, Video, MoreVertical, CheckCheck } from 'lucide-react';

export default function ConsultationChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'doctor', text: "Hello Husefa, I'm Dr. Jenkins. How can I help you today?", time: '10:00 AM' }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: 'patient',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setInput('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-dark/60 backdrop-blur-md flex justify-end"
        >
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col"
          >
            {/* 1. Chat Header */}
            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                    <User size={24} className="text-secondary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary border-2 border-white rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-dark">Dr. Sarah Jenkins</h3>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Active Now</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><Phone size={20}/></button>
                <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><Video size={20}/></button>
                <button onClick={onClose} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"><X size={20}/></button>
              </div>
            </div>

            {/* 2. Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.sender === 'patient' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-5 py-3 rounded-[1.5rem] text-sm font-medium shadow-sm ${
                      msg.sender === 'patient' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white text-dark border border-slate-100 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[10px] text-slate-400 font-bold">{msg.time}</span>
                      {msg.sender === 'patient' && <CheckCheck size={12} className="text-primary" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 3. Input Area */}
            <div className="p-6 bg-white border-t border-slate-100">
              <form onSubmit={sendMessage} className="flex items-center gap-3 bg-slate-50 p-2 rounded-[1.5rem] border border-slate-100 focus-within:border-primary/50 transition-all">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your health concern..." 
                  className="flex-1 bg-transparent px-4 py-2 outline-none text-sm font-medium" 
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  <Send size={18} />
                </motion.button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}