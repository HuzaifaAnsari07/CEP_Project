import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, ArrowUpRight } from 'lucide-react';

const monthlyData = [
  { month: 'Oct', sales: 45000, orders: 120 },
  { month: 'Nov', sales: 52000, orders: 145 },
  { month: 'Dec', sales: 48000, orders: 130 },
  { month: 'Jan', sales: 61000, orders: 170 },
  { month: 'Feb', sales: 55000, orders: 155 },
  { month: 'Mar', sales: 68000, orders: 190 },
];

const categoryData = [
  { name: 'Tablets', value: 45, color: '#3B82F6' },
  { name: 'Syrups', value: 25, color: '#10B981' },
  { name: 'Injections', value: 15, color: '#8B5CF6' },
  { name: 'Others', value: 15, color: '#F59E0B' },
];

export default function SalesAnalytics() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatMiniCard label="Monthly Revenue" value="₹68,400" icon={DollarSign} trend="+12.5%" color="text-blue-600" />
        <StatMiniCard label="Total Orders" value="1,240" icon={ShoppingBag} trend="+8.2%" color="text-emerald-600" />
        <StatMiniCard label="Avg. Order Value" value="₹550" icon={TrendingUp} trend="+2.4%" color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-dark">Revenue Forecast</h3>
              <p className="text-xs text-slate-400">Monthly sales performance</p>
            </div>
          </div>

          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-dark mb-1">Sales by Category</h3>
          <p className="text-xs text-slate-400 mb-4">Top medicine types</p>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={8}
                  dataKey="value"
                  label={({name}) => name} // Name labels directly on chart
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatMiniCard = ({ label, value, icon: Icon, trend, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl bg-slate-50 ${color}`}><Icon size={20} /></div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <h4 className="text-xl font-bold text-dark">{value}</h4>
      </div>
    </div>
    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
      <ArrowUpRight size={12} /> {trend}
    </div>
  </div>
);