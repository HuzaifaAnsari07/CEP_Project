import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  MoreVertical, 
  ExternalLink, 
  Trash2, 
  Search,
  FileImage,
  Filter
} from 'lucide-react';
import UploadRecordModal from './UploadRecordModal';
import { auth, db } from '../../firebase/config';
import { collection, query, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function MedicalRecords() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [records, setRecords] = useState([]);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, u => setUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/records`), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const fetchedRecords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(fetchedRecords);
    });
    return () => unsub();
  }, [user]);

  // Handle Deletion
  const deleteRecord = async (id) => {
    if (!user) return;
    try {
      if (window.confirm("Are you sure you want to delete this record?")) {
        await deleteDoc(doc(db, `users/${user.uid}/records`, id));
      }
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-dark flex items-center gap-2">
            <FileText className="text-primary" /> Medical Records
          </h3>
          <p className="text-xs text-slate-400 mt-1">Manage your digital health vault</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search files..." 
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:border-primary w-40 lg:w-56"
            />
          </div>
          <button className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-primary hover:text-white transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Records Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((record) => (
          <motion.div 
            key={record.id}
            whileHover={{ y: -5 }}
            className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-white transition-all group relative"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${record.type === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                {record.type === 'PDF' ? <FileText size={24} /> : <FileImage size={24} />}
              </div>
              <button className="text-slate-300 hover:text-dark">
                <MoreVertical size={16} />
              </button>
            </div>

            <div>
              <h4 className="font-bold text-dark text-sm truncate pr-4">{record.name}</h4>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">{record.date}</p>
                <span className="text-[10px] px-2 py-1 bg-white border border-slate-100 rounded-md text-slate-500 font-bold">
                  {record.size}
                </span>
              </div>
            </div>

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-primary/90 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
              <button 
                onClick={() => {
                  if (record.fileUrl) {
                    const newWindow = window.open();
                    if (newWindow) {
                        newWindow.document.write(`<iframe src="${record.fileUrl}" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%; position:absolute;" allowfullscreen></iframe>`);
                        newWindow.document.title = record.name;
                    } else {
                        const a = document.createElement('a');
                        a.href = record.fileUrl;
                        a.download = record.name;
                        a.click();
                    }
                  } else {
                    alert('Static dummy file - only new uploads can be opened.');
                  }
                }}
                className="p-2 bg-white/20 text-white rounded-full hover:bg-white hover:text-primary transition-all"
              >
                <ExternalLink size={18} />
              </button>
              <button 
                onClick={() => deleteRecord(record.id)}
                className="p-2 bg-white/20 text-white rounded-full hover:bg-red-500 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}

        {/* Upload Placeholder Card */}
        <motion.div 
          whileHover={{ scale: 0.98 }}
          onClick={() => setShowUploadModal(true)}
          className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group min-h-[160px]"
        >
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all mb-2">
            <Upload size={20} />
          </div>
          <p className="text-xs font-bold text-slate-500 group-hover:text-primary uppercase tracking-wider">Upload New</p>
        </motion.div>
      </div>

      {/* The Modal */}
      <UploadRecordModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
        onUploadSuccess={() => {}} 
      />
    </div>
  );
}