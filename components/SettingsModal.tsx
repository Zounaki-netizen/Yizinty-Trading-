
import React, { useState } from 'react';
import { X, User, Trash2, Save, LogOut, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onClose: () => void;
  onClearData: () => void;
}

export const SettingsModal: React.FC<Props> = ({ onClose, onClearData }) => {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  
  const handleSave = () => {
    // In a real app, this would update the context/backend
    localStorage.setItem(`yizinity_user_profile_${user?.email}`, JSON.stringify({ ...user, name }));
    window.location.reload(); // Quick reload to reflect changes
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-[#050505] w-full max-w-md rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden relative"
        >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.02]">
                <h3 className="text-lg font-bold text-white">Settings</h3>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Profile Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-brand-500 uppercase tracking-wider">
                        <User size={14} /> Profile
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-white/40 font-medium">Display Name</label>
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl px-4 py-2 text-white text-sm focus:border-brand-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-white/40 font-medium">Email (Read Only)</label>
                        <div className="w-full bg-white/[0.01] border border-white/[0.05] rounded-xl px-4 py-2 text-white/40 text-sm cursor-not-allowed font-mono">
                            {user?.email}
                        </div>
                    </div>
                    <button 
                        onClick={handleSave}
                        className="w-full py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
                    >
                        <Save size={14} /> Save Changes
                    </button>
                </div>

                <div className="h-px bg-white/[0.05]" />

                {/* Danger Zone */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-rose-500 uppercase tracking-wider">
                        <ShieldAlert size={14} /> Danger Zone
                    </div>
                    
                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-3">
                        <div>
                            <h4 className="text-white text-sm font-medium">Reset Account Data</h4>
                            <p className="text-white/40 text-xs mt-1">Permanently delete all trades and accounts for this user.</p>
                        </div>
                        <button 
                            onClick={() => {
                                if(window.confirm("Are you sure? This will wipe all your logged trades.")) {
                                    onClearData();
                                    onClose();
                                }
                            }}
                            className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-bold text-rose-500 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={14} /> Clear All Data
                        </button>
                    </div>
                </div>

                <button 
                    onClick={logout}
                    className="w-full py-3 mt-2 rounded-xl text-sm font-bold text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut size={16} /> Sign Out
                </button>
            </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
