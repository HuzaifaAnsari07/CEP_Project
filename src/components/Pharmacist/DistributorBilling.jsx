import React from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Truck, 
  AlertCircle, 
  Calendar, 
  ExternalLink, 
  CheckCircle,
  Clock
} from 'lucide-react';

const InvoiceRow = ({ invoice }) => {
  const isOverdue = new Date(invoice.dueDate) < new Date();
  
  return (
    <motion.div 
      whileHover={{ x: 5 }}
      className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50 hover:bg-white hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs ${
          isOverdue ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
        }`}>
          {invoice.distributor[0]}
        </div>
        <div>
          <h4 className="font-bold text-sm text-dark">{invoice.distributor}</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Inv: #{invoice.id}</p>
        </div>
      </div>

      <div className="flex items-center gap-10">
        <div className="text-right">
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Amount Due</p>
          <p className="font-bold text-sm text-dark">₹{invoice.amount}</p>
        </div>

        <div className="text-right min-w-[80px]">
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Due Date</p>
          <p className={`text-[11px] font-bold flex items-center justify-end gap-1 ${isOverdue ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
            <Clock size={12} /> {invoice.dueDate}
          </p>
        </div>

        <button className="p-2 bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-primary hover:border-primary transition-all">
          <ExternalLink size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export default function DistributorBilling() {
  const invoices = [
    { id: '8821', distributor: "Medivision Pharma", amount: "42,500", dueDate: "Mar 20, 2026", status: "Pending" },
    { id: '8845', distributor: "Apex Healthcare", amount: "12,200", dueDate: "Mar 15, 2026", status: "Overdue" },
    { id: '8890', distributor: "Global Drug House", amount: "8,900", dueDate: "Mar 25, 2026", status: "Pending" },
  ];

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="text-xl font-bold text-dark flex items-center gap-2">
            <CreditCard className="text-secondary" /> Distributor Ledger
          </h3>
          <p className="text-xs text-slate-400 mt-1">Manage vendor payments and credit cycles</p>
        </div>

        {/* Credit Utilization Bar */}
        <div className="bg-slate-50 p-4 rounded-2xl min-w-[200px]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credit Limit</span>
            <span className="text-xs font-bold text-dark">₹5L / 10L</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="bg-secondary h-full w-1/2" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {invoices.map((inv) => (
          <InvoiceRow key={inv.id} invoice={inv} />
        ))}
      </div>

      {/* Footer Alert */}
      <div className="mt-8 p-5 bg-orange-50 rounded-3xl border border-orange-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-2xl text-orange-500 shadow-sm">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-orange-800">Payment Alert</h4>
            <p className="text-[11px] text-orange-600 font-medium">You have 1 overdue invoice from Apex Healthcare.</p>
          </div>
        </div>
        <button className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all">
          Pay All
        </button>
      </div>
    </div>
  );
}