import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  Users,
  Phone,
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  Plus,
  Pill,
  X,
  Loader2,
  Save,
  Trash2,
  Edit3,
} from "lucide-react";

const PatientCard = ({ patient, onDelete, onEdit }) => {
  const calculateDaysRemaining = (refillDate) => {
    const today = new Date();
    const end = new Date(refillDate);
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysRemaining(patient.nextRefillDate);
  const isUrgent = daysLeft <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
    >
      {/* Header Section: Wrapped in a container with overflow protection */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner border border-slate-100 overflow-hidden shrink-0">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.name}`}
              alt="Avatar"
            />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-dark text-sm truncate">
              {patient.name}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
              {patient.condition}
            </p>
          </div>
        </div>

        {/* Status Badge: Added shrink-0 to prevent it from moving out of bounds */}
        <div
          className={`shrink-0 px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
            isUrgent
              ? "bg-red-50 text-red-600 animate-pulse"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {isUrgent ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          <span>{isUrgent ? "Refill Alert" : "Compliant"}</span>
        </div>
      </div>

      <div className="mb-4 p-3 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3">
        <div className="p-2 bg-white rounded-xl text-primary shadow-sm">
          <Pill size={14} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
            Active Prescription
          </p>
          <p className="text-xs font-bold text-dark truncate">
            {patient.meds}{" "}
            <span className="text-primary opacity-60 ml-1">
              • {patient.dosage}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-slate-50 rounded-2xl">
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
            Last Purchase
          </p>
          <p className="text-xs font-bold text-dark">{patient.lastPurchase}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-2xl">
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
            Ends In
          </p>
          <p
            className={`text-xs font-bold ${isUrgent ? "text-red-500" : "text-dark"}`}
          >
            {daysLeft} Days
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
        <button className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm">
          <Phone size={14} />
        </button>
        <button className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-dark hover:text-white transition-all shadow-sm">
          <CalendarClock size={14} />
        </button>

        <div className="flex items-center gap-2 mx-1 border-l border-r border-slate-100 px-2">
          <button
            onClick={() => onEdit(patient)}
            className="p-2.5 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => onDelete(patient.id)}
            className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <button className="ml-auto text-[11px] font-bold text-slate-400 flex items-center gap-1 hover:text-primary transition-colors py-2 px-1">
          History <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};

export default function PatientCompliance() {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    condition: "",
    meds: "",
    dosage: "",
    duration: 30,
  });

  const dummyPatients = [
    {
      id: "dummy1",
      name: "Aarav Mehta",
      condition: "Diabetes",
      meds: "Metformin",
      dosage: "500mg BD",
      lastPurchase: "Mar 10, 2026",
      nextRefillDate: "2026-03-20",
      isDummy: true,
    },
    {
      id: "dummy2",
      name: "Ishani Paul",
      condition: "Asthma",
      meds: "Foracort",
      dosage: "2 Puffs OD",
      lastPurchase: "Mar 15, 2026",
      nextRefillDate: "2026-03-22",
      isDummy: true,
    },
  ];

  useEffect(() => {
    const q = query(
      collection(db, "regular_patients"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPatients(data.length > 0 ? data : dummyPatients);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSavePatient = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const today = new Date();
    const refillDate = new Date();
    refillDate.setDate(today.getDate() + parseInt(formData.duration));

    try {
      if (editId) {
        await updateDoc(doc(db, "regular_patients", editId), {
          ...formData,
          nextRefillDate: refillDate.toISOString(),
        });
      } else {
        await addDoc(collection(db, "regular_patients"), {
          ...formData,
          lastPurchase: today.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          nextRefillDate: refillDate.toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to remove this patient from tracking?",
      )
    ) {
      try {
        await deleteDoc(doc(db, "regular_patients", id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEdit = (patient) => {
    setEditId(patient.id);
    setFormData({
      name: patient.name,
      condition: patient.condition,
      meds: patient.meds,
      dosage: patient.dosage,
      duration: 30,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData({
      name: "",
      condition: "",
      meds: "",
      dosage: "",
      duration: 30,
    });
  };

  return (
    <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-dark flex items-center gap-2">
            <UserCheck className="text-secondary" /> Compliance Tracker
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Manage regular patients & refills
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-10 h-10 bg-secondary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-secondary/20 hover:scale-105 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="animate-spin text-secondary" />
          </div>
        ) : (
          patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>

      <button className="w-full mt-6 py-4 border-2 border-dashed border-slate-200 rounded-3xl text-xs font-bold text-slate-400 hover:border-secondary hover:text-secondary transition-all uppercase tracking-widest">
        View All {patients.length} Enrolled Patients
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-dark/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative"
            >
              <button
                onClick={closeModal}
                className="absolute top-8 right-8 text-slate-400 hover:text-dark"
              >
                <X size={20} />
              </button>
              <h3 className="text-2xl font-bold text-dark mb-1">
                {editId ? "Edit Patient" : "Enroll Patient"}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">
                Patient Compliance Management
              </p>

              <form onSubmit={handleSavePatient} className="space-y-4">
                <input
                  required
                  type="text"
                  placeholder="Patient Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-secondary text-sm font-medium"
                />
                <input
                  required
                  type="text"
                  placeholder="Chronic Condition"
                  value={formData.condition}
                  onChange={(e) =>
                    setFormData({ ...formData, condition: e.target.value })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-secondary text-sm font-medium"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    required
                    type="text"
                    placeholder="Medicine"
                    value={formData.meds}
                    onChange={(e) =>
                      setFormData({ ...formData, meds: e.target.value })
                    }
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-secondary text-sm font-medium"
                  />
                  <input
                    required
                    type="text"
                    placeholder="Dosage"
                    value={formData.dosage}
                    onChange={(e) =>
                      setFormData({ ...formData, dosage: e.target.value })
                    }
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-secondary text-sm font-medium"
                  />
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-wider">
                    Days of Supply (Reset Cycle)
                  </label>
                  <input
                    required
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    className="w-full bg-transparent outline-none font-bold text-dark"
                  />
                </div>

                <button
                  disabled={isSaving}
                  type="submit"
                  className="w-full py-4 bg-secondary text-white rounded-2xl font-bold shadow-xl shadow-secondary/20 flex items-center justify-center gap-2 transition-all"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Save size={18} />{" "}
                      {editId ? "Update Records" : "Save & Start Tracking"}
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
