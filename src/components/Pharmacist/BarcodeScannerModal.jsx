import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, PackagePlus, Calendar, Landmark, Camera } from 'lucide-react';
import { db } from "../../firebase/config";
import { collection, addDoc } from "firebase/firestore";

export default function BarcodeScannerModal({ isOpen, onClose }) {
  const [scanResult, setScanResult] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let scanner = null;

    if (isOpen && !scanResult) {
      // Delay to allow modal animation to finish and DOM to settle
      const timer = setTimeout(() => {
        try {
          scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            // Disable basic local file drop to focus on camera
            rememberLastUsedCamera: true,
            supportedScanTypes: [0] // Force Camera only
          });

          scanner.render(onScanSuccess, onScanError);
        } catch (err) {
          console.error("Scanner initialization failed:", err);
        }
      }, 500); // 500ms delay is safer for hardware initialization

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(error => console.error("Failed to clear scanner:", error));
        }
      };
    }
  }, [isOpen, scanResult]);

  function onScanSuccess(decodedText) {
    setScanResult({
      barcode: decodedText,
      name: "Augmentin 625 Duo",
      batch: "BTX992L",
      mfgDate: "2025-10-01",
      expiryDate: "2026-05-15",
      mrp: "223.50",
      company: "GlaxoSmithKline",
      type: "Tablet"
    });
  }

  function onScanError(err) {
    // We don't want to flood the console during active scanning
  }

  const handleAddToStock = async () => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, "inventory"), {
        ...scanResult,
        currentStock: parseInt(quantity),
        addedAt: new Date().toISOString(),
      });
      onClose();
      setScanResult(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const isNearExpiry = (date) => {
    const expiry = new Date(date);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 z-[150] bg-dark/60 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9 }} 
            animate={{ scale: 1 }} 
            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center text-dark">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <PackagePlus className="text-secondary" /> Inventory Inbound
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <X size={20}/>
              </button>
            </div>

            <div className="p-8">
              {!scanResult ? (
                <div className="space-y-4">
                  {/* reader div must be empty for html5-qrcode to work */}
                  <div id="reader" className="rounded-3xl overflow-hidden border-none bg-slate-50 min-h-[300px]"></div>
                  <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <Camera size={14}/> Center the Barcode in the frame
                  </p>
                </div>
              ) : (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
                  {isNearExpiry(scanResult.expiryDate) && (
                    <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600">
                      <AlertCircle size={20} />
                      <p className="text-xs font-bold uppercase tracking-tight">Warning: This batch expires within 3 months!</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Medicine Name" value={scanResult.name} />
                    <DetailItem label="Batch Number" value={scanResult.batch} />
                    <DetailItem label="Expiry Date" value={scanResult.expiryDate} icon={<Calendar size={14}/>} />
                    <DetailItem label="Company" value={scanResult.company} icon={<Landmark size={14}/>} />
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity to Add</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="w-8 h-8 bg-white rounded-lg shadow-sm font-bold text-slate-600">-</button>
                        <span className="font-bold text-xl text-dark">{quantity}</span>
                        <button onClick={() => setQuantity(q => q+1)} className="w-8 h-8 bg-white rounded-lg shadow-sm font-bold text-slate-600">+</button>
                      </div>
                    </div>
                    <div className="text-right text-dark">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price per Unit</p>
                      <p className="text-2xl font-bold">₹{scanResult.mrp}</p>
                    </div>
                  </div>

                  <button 
                    onClick={handleAddToStock}
                    className="w-full py-4 bg-secondary text-white rounded-2xl font-bold shadow-xl shadow-secondary/20 flex items-center justify-center gap-2"
                  >
                    {isSaving ? "Updating Ledger..." : "Confirm & Add to Stock"}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const DetailItem = ({ label, value, icon }) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-dark">
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <div className="flex items-center gap-2 font-bold text-sm truncate">
      {icon} {value}
    </div>
  </div>
);