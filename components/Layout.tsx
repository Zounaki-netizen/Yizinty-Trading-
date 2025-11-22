import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  Settings, 
  LogOut,
  Plus,
  Zap,
  Wallet,
  BrainCircuit,
  User,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddTrade: () => void;
  onOpenSettings: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onAddTrade, onOpenSettings }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'journal', label: 'Daily Journal', icon: <BookOpen size={18} /> },
    { id: 'funded', label: 'My Funded', icon: <Wallet size={18} /> },
    { id: 'ict-engine', label: 'ICT Engine', icon: <BrainCircuit size={18} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> },
  ];

  const SidebarContent = () => (
    <>
        <div className="p-6 flex items-center justify-center md:justify-start">
           <h1 
            className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-200 uppercase italic filter drop-shadow-lg cursor-pointer" 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
           >
             YIZINITY
           </h1>
        </div>

        <nav className="flex-1 px-4 space-y-6 mt-2 md:mt-4">
          <div>
             <p className="text-[10px] font-bold text-white/40 uppercase mb-4 px-2 tracking-widest">Main Menu</p>
             <div className="space-y-1">
             {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg transition-all text-sm font-medium relative group overflow-hidden",
                    activeTab === item.id 
                      ? "text-brand-500 bg-brand-500/10 border border-brand-500/20" 
                      : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </span>
                  {activeTab === item.id && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-brand-500/5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                  )}
                </button>
              ))}
             </div>
          </div>
          
          <div>
             <button 
                onClick={() => { onAddTrade(); setIsMobileMenuOpen(false); }}
                className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-black py-3.5 md:py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-500/20 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Plus size={16} strokeWidth={3} className="relative z-10" />
                <span className="relative z-10">ADD TRADE</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-white/[0.05] bg-black/20 mt-auto md:mt-0">
          <div 
            onClick={() => { onOpenSettings(); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 mb-4 px-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5 group"
          >
             <div className="w-9 h-9 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-brand-500 to-orange-600 border border-white/10 shadow-inner flex items-center justify-center text-black">
                <User size={14} strokeWidth={3} />
             </div>
             <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-white/90 truncate group-hover:text-brand-500 transition-colors">{user?.name || 'Trader'}</p>
                 <p className="text-[10px] text-white/50 truncate font-mono">PRO PLAN</p>
             </div>
             <Settings size={14} className="text-white/40 group-hover:text-white transition-colors" />
          </div>
           <button 
             onClick={logout}
             className="w-full flex items-center gap-2 px-3 py-2 text-white/40 hover:text-rose-400 text-xs font-medium transition-all rounded-lg hover:bg-rose-500/5"
           >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
    </>
  );

  return (
    <div className="relative flex h-screen bg-[#050505] text-slate-300 font-sans overflow-hidden selection:bg-brand-500/30">
      
      {/* Global Ambient Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-600/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/[0.05] bg-black/20 backdrop-blur-xl relative z-20">
         <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#050505]/90 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(true)} className="text-white/80 hover:text-brand-500 transition-colors">
                <Menu size={24} />
             </button>
             <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-200 uppercase italic">YZ</span>
          </div>
          <div className="flex items-center gap-3">
              <div className="px-2 py-1 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold flex items-center gap-1">
                 <Zap size={10} fill="currentColor" /> OPEN
              </div>
              {/* Settings Shortcut */}
              <button onClick={onOpenSettings} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <User size={14} className="text-white/60" />
              </button>
          </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
             />
             <motion.aside 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="md:hidden fixed top-0 left-0 bottom-0 w-[85%] max-w-[300px] bg-[#050505] border-r border-white/[0.1] z-50 flex flex-col shadow-2xl"
             >
                 <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="absolute top-6 right-6 text-white/40 hover:text-white p-2"
                 >
                    <X size={22} />
                 </button>
                 <SidebarContent />
             </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 scroll-smooth pt-16 md:pt-0 bg-[#050505]">
        
        {/* Desktop Topbar */}
        <div className="hidden md:flex sticky top-0 z-30 backdrop-blur-xl bg-black/20 border-b border-white/[0.05] px-8 py-4 justify-between items-center">
           <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-white/90 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h2>
           </div>
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-white/[0.03] px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/[0.05] shadow-sm">
                <Zap size={12} className="text-brand-500 fill-brand-500" />
                <span className="text-white/50">MARKET STATUS:</span>
                <span className="text-emerald-500">OPEN</span>
             </div>
           </div>
        </div>

        <div className="p-4 md:p-8 pb-24 md:pb-20 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};