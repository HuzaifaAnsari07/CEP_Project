import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { auth, db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function UploadRecordModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [recordName, setRecordName] = useState('');
  const [category, setCategory] = useState('Lab Report');
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState('idle');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setRecordName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      setStatus('idle');
    }
  };

  const handleLocalUpload = async () => {
    if (!file || !recordName || !auth.currentUser) return;

    setIsUploading(true);
    
    try {
      if (file.size > 1048487) {
         setIsUploading(false);
         alert("File too large! Please upload a document strictly under 1 MB.");
         return;
      }

      const fileExtension = file.name.split('.').pop().toUpperCase();
      
      // Convert file to Base64 string directly
      const fileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
      });
      
      
      const newRecord = {
        name: recordName,
        date: new Date().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        type: fileExtension === 'PDF' ? 'PDF' : 'JPG',
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
        category: category,
        fileUrl: fileBase64,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, `users/${auth.currentUser.uid}/records`), newRecord);

      onUploadSuccess({ id: docRef.id, ...newRecord });
      setStatus('success');

      setTimeout(() => {
        onClose();
        setFile(null);
        setRecordName('');
        setStatus('idle');
      }, 1500);
    } catch (error) {
      console.error("Error uploading record:", error);
      alert('Failed to upload the record.');
    } finally {
      setIsUploading(false);
    }
  };

  const categories = ['Lab Report', 'Prescription', 'Imaging (X-Ray/MRI)', 'Vaccination', 'Other'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] bg-dark/60 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden"
          >
            {status === 'success' ? (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-12 flex flex-col items-center gap-4">
                <CheckCircle className="text-emerald-500" size={60} strokeWidth={1.5}/>
                <h4 className="font-bold text-lg text-emerald-800">Added to Vault!</h4>
                <p className="text-sm text-slate-500">Record is now ready for AI analysis.</p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-dark">Upload Record</h3>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                </div>

                {!file ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:border-primary/50 transition-all cursor-pointer group relative">
                    <Upload className="text-slate-400 mb-3 group-hover:text-primary transition-colors" size={30} />
                    <p className="text-sm font-semibold text-slate-600">Click to browse file</p>
                    <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="p-3 bg-white rounded-xl text-primary shadow-sm"><FileText size={24}/></div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-dark truncate">{file.name}</p>
                      <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <input type="text" value={recordName} onChange={(e) => setRecordName(e.target.value)} placeholder="Record Name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-sm" />
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-sm appearance-none">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleLocalUpload} disabled={isUploading || !file} className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:bg-slate-100 disabled:text-slate-400">
                  {isUploading ? <Loader2 className="animate-spin" /> : <><Upload size={20} /> Add Record</>}
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}