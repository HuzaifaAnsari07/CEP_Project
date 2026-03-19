import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Added for routing
import { 
  ChevronRight, 
  Newspaper, 
  MapPin, 
  Calendar, 
  Clock, 
  Tag, 
  ShieldCheck,
  Facebook,
  Twitter,
  Instagram,
  Mail
} from 'lucide-react';

// --- Reusable Components ---

const Button = ({ children, variant = "primary", className = "" }) => {
  const variants = {
    primary: "bg-primary text-white hover:bg-opacity-90",
    secondary: "bg-secondary text-white hover:bg-opacity-90",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
    ghost: "text-dark hover:bg-slate-100"
  };
  return (
    <motion.button 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

const SectionHeading = ({ title, subtitle }) => (
  <div className="mb-10">
    <h2 className="text-3xl font-bold text-dark">{title}</h2>
    <div className="h-1 w-20 bg-accent mt-2 rounded-full" />
    {subtitle && <p className="text-slate-500 mt-4">{subtitle}</p>}
  </div>
);

// --- Main Page ---

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-poppins text-dark selection:bg-primary selection:text-white">
      
      {/* 1. Navbar (Glassmorphism) */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto backdrop-blur-md bg-white/70 border border-white/20 rounded-2xl px-8 py-3 flex items-center justify-between shadow-lg">
          <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
            <ShieldCheck className="text-secondary" /> HealthCare
          </Link>
          
          <div className="hidden md:flex gap-8 font-medium text-slate-600">
            <a href="#news" className="hover:text-primary transition-colors">News</a>
            <a href="#camps" className="hover:text-primary transition-colors">Camps</a>
            <a href="#offers" className="hover:text-primary transition-colors">Store</a>
            <a href="#schemes" className="hover:text-primary transition-colors">Schemes</a>
          </div>

          <div className="flex gap-4">
            {/* Added Routing to Login and Signup */}
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2000" 
            alt="Hero Background" 
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-dark/80 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl text-white"
          >
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Your Health is our <span className="text-primary">Top Priority</span>
            </h1>
            <p className="text-xl text-slate-200 mb-8 italic">
              "The greatest wealth is health. Start your journey towards a better life today with our expert care."
            </p>
            <Link to="/signup">
                <Button variant="primary" className="text-lg px-10 py-4">Get Started Today</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 3. News & Camps Section */}
      <section id="news" className="py-20 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 pt-32">
        {/* Left: News */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex justify-between items-end mb-6">
            <SectionHeading title="Latest Health News" />
            <Button variant="ghost" className="mb-10">View All</Button>
          </div>
          <div className="space-y-4">
            {[
              { title: "New Breakthrough in Heart Research", date: "Today" },
              { title: "5 Tips to Manage Stress Effectively", date: "Yesterday" },
              { title: "Government Increases Health Budget", date: "2 days ago" }
            ].map((news, i) => (
              <motion.div 
                key={i}
                whileHover={{ x: 10 }}
                className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer"
              >
                <div className="bg-primary/10 p-3 rounded-lg text-primary">
                  <Newspaper size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-dark">{news.title}</h4>
                  <p className="text-xs text-slate-400">{news.date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right: Health Camps */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          id="camps"
        >
          <div className="flex justify-between items-end mb-6">
            <SectionHeading title="Upcoming Camps" />
            <Button variant="ghost" className="mb-10">Explore</Button>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100 group">
            <div className="h-48 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                alt="Camp"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Free Cardiology Check-up</h3>
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-slate-600">
                <div className="flex items-center gap-2"><MapPin size={16} className="text-accent" /> City Hospital</div>
                <div className="flex items-center gap-2"><Calendar size={16} className="text-accent" /> 25th Oct 2024</div>
                <div className="flex items-center gap-2"><Clock size={16} className="text-accent" /> 10:00 AM</div>
              </div>
              <Button variant="secondary" className="w-full">Register Now</Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4. Medical Store Offers */}
      <section id="offers" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading title="Pharmacy Offers" subtitle="Save more on your monthly medical bills" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <motion.div 
                key={item}
                whileHover={{ y: -10 }}
                className="bg-white p-6 rounded-3xl border-2 border-dashed border-primary/20 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-accent text-white px-4 py-1 rounded-bl-2xl text-sm font-bold">
                  20% OFF
                </div>
                <Tag className="text-primary mb-4" size={32} />
                <h4 className="text-xl font-bold mb-2">Apollo Pharmacy</h4>
                <p className="text-slate-500 text-sm mb-4">Valid on all prescribed medicines above ₹500.</p>
                <div className="flex items-center text-primary font-bold cursor-pointer group">
                  Claim Offer <ChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Government Schemes */}
      <section id="schemes" className="py-20 max-w-7xl mx-auto px-6">
        <div className="bg-dark rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="flex-1">
            <h2 className="text-4xl font-bold mb-6">Government Health Insurance</h2>
            <p className="text-slate-400 text-lg mb-8">
              Stay protected with the latest state and national schemes. Awareness is the first step to affordable healthcare.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Apply for Ayushman Bharat</Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-dark">Learn More</Button>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <h3 className="text-secondary font-bold text-2xl">5L+</h3>
              <p className="text-sm">Cover Provided</p>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <h3 className="text-secondary font-bold text-2xl">100%</h3>
              <p className="text-sm">Paperless</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="text-2xl font-bold text-primary flex items-center gap-2 mb-6">
              <ShieldCheck className="text-secondary" /> HealthCare
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Providing modern healthcare solutions for a healthier community. Connect with doctors and stay informed.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="#hero" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#offers" className="hover:text-primary transition-colors">Medical Store</a></li>
              <li><a href="#camps" className="hover:text-primary transition-colors">Health Camps</a></li>
              <li><a href="#schemes" className="hover:text-primary transition-colors">Schemes</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Contact Us</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li className="flex gap-2"><MapPin size={16} /> Panvel, Navi Mumbai</li>
              <li className="flex gap-2"><Mail size={16} /> support@healthcare.com</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Follow Us</h4>
            <div className="flex gap-4">
              <div className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-primary hover:text-white transition-all cursor-pointer"><Facebook size={20}/></div>
              <div className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-primary hover:text-white transition-all cursor-pointer"><Twitter size={20}/></div>
              <div className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-primary hover:text-white transition-all cursor-pointer"><Instagram size={20}/></div>
            </div>
          </div>
        </div>
        <div className="text-center text-slate-400 text-xs border-t border-slate-100 pt-8">
          © 2026 HealthCare Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}