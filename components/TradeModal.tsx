import React from 'react';
import { Trade, Outcome, Direction } from '../types';
import { X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface Props {
  trade: Trade | null;
  onClose: () => void;
  onUpdate: (updatedTrade: Trade) => void;
  onEdit: () => void;
}

export const TradeModal: React.FC<Props> = ({ trade, onClose, onUpdate, onEdit }) => {
  if (!trade) return null;

  const isWin = trade.outcome === Outcome.WIN;
  const isLong = trade.direction === Direction.LONG || trade.direction === Direction.CALL;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-4"
      >
        {/* Modal Container */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="relative w-full h-full md:h-[85vh] md:max-w-5xl bg-[#050505] md:rounded-3xl border-t md:border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden"
        >
            {/* Ambient Background */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-500/5 rounded-full mix-blend-normal filter blur-[128px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full mix-blend-normal filter blur-[128px]" />
            </div>

            {/* Header */}
            <div className="px-6 py-6 md:px-8 md:py-6 border-b border-white/[0.05] flex justify-between items-start relative z-10 bg-white/[0.01] backdrop-blur-xl">
                <div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-1.5">
                        <h2 className="text-2xl font-black text-white tracking-tight">{trade.symbol}</h2>
                        
                        {/* Direction Badge */}
                        <span className={cn(
                            "px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border",
                            isLong 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        )}>
                            {trade.direction}
                        </span>

                        {/* P&L Badge - Solid Style as per screenshot */}
                        <span className={cn(
                            "px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide shadow-lg",
                            isWin 
                                ? "bg-emerald-500 text-black" 
                                : "bg-rose-500 text-white"
                        )}>
                            {isWin ? 'PROFIT' : 'LOSS'} ${Math.abs(trade.pnl).toFixed(2)}
                        </span>
                    </div>
                    <p className="text-white/40 text-xs font-mono">
                        {new Date(trade.entryDate).toLocaleString(undefined, { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                    </p>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 h-auto">
                    
                    {/* LEFT COLUMN (Chart + Notes) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        
                        {/* Chart Area */}
                        <div className="flex-1 min-h-[300px] md:min-h-[400px] bg-[#0F1218] rounded-xl border border-white/[0.05] relative group overflow-hidden shadow-inner">
                            {trade.screenshot ? (
                                <img src={trade.screenshot} alt="Chart" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <p className="text-white/20 font-medium text-sm">No chart uploaded</p>
                                </div>
                            )}
                            
                            {/* Replay Button Overlay */}
                            <button className="absolute bottom-4 right-4 bg-[#050505]/90 backdrop-blur border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-white hover:text-black transition-all shadow-xl">
                                <Play size={10} fill="currentColor" /> Replay Trade
                            </button>
                        </div>

                        {/* Execution Notes */}
                        <div className="bg-[#0F1218] p-6 rounded-xl border border-white/[0.05]">
                            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">Execution Notes</h3>
                            <p className="text-white/80 text-sm leading-relaxed font-medium">
                                {trade.notes || "No notes recorded for this trade."}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Stats + Review) */}
                    <div className="flex flex-col gap-6 pb-20 md:pb-0">
                        
                        {/* Stats Card */}
                        <div className="bg-[#0F1218] p-6 rounded-xl border border-white/[0.05]">
                            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-5">Stats</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/40 font-medium">Entry</span>
                                    <span className="text-white font-mono font-bold">${trade.entryPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/40 font-medium">Exit</span>
                                    <span className="text-white font-mono font-bold">${trade.exitPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/40 font-medium">Size</span>
                                    <span className="text-white font-mono font-bold">{trade.size}</span>
                                </div>
                                <div className="h-px bg-white/[0.05] my-2" />
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/40 font-medium">Gross P&L</span>
                                    <span className={cn("font-mono font-bold", isWin ? "text-emerald-400" : "text-rose-400")}>
                                        {trade.pnl > 0 ? '+' : ''}${Math.abs(trade.pnl).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/40 font-medium">Commission</span>
                                    <span className="text-rose-400 font-mono font-bold">-${trade.commission.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Review Card */}
                        <div className="bg-[#0F1218] p-6 rounded-xl border border-white/[0.05] flex-1">
                            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-5">Review</h3>
                            
                            <div className="mb-6">
                                <p className="text-[10px] font-bold text-brand-500 uppercase mb-2">My Setup</p>
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2.5">
                                    <span className="text-blue-300 text-xs font-bold">{trade.setup}</span>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-rose-500 uppercase mb-2">My Mistakes</p>
                                {trade.mistakes.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {trade.mistakes.map(m => (
                                            <div key={m} className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5">
                                                <span className="text-rose-300 text-xs font-bold">{m}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2.5">
                                         <span className="text-white/30 text-xs italic">No mistakes logged</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            
            {/* Optional Footer for Edit Action */}
            <div className="px-6 py-4 md:px-8 border-t border-white/[0.05] flex justify-end bg-[#050505]/50 backdrop-blur-xl relative z-10">
                <button 
                    onClick={() => { onClose(); onEdit(); }}
                    className="text-xs font-bold text-white/40 hover:text-brand-500 transition-colors uppercase tracking-wider"
                >
                    Edit Trade Details
                </button>
            </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};