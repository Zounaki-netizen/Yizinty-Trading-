import React, { useState, useMemo } from 'react';
import { Trade } from '../types';
import { ChevronLeft, ChevronRight, LayoutList, CalendarDays, Columns, Edit2, Clock, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface Props {
  trades: Trade[];
  onSelectTrade: (trade: Trade) => void;
  onEditTrade?: (trade: Trade) => void;
  onDeleteTrade?: (id: string) => void;
}

type ViewMode = 'day' | 'week' | 'month';

export const JournalView: React.FC<Props> = ({ trades, onSelectTrade, onEditTrade, onDeleteTrade }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Navigation Logic ---
  const navigate = (dir: 'prev' | 'next') => {
      const newDate = new Date(currentDate);
      if (viewMode === 'month') {
          newDate.setMonth(currentDate.getMonth() + (dir === 'next' ? 1 : -1));
      } else if (viewMode === 'week') {
          newDate.setDate(currentDate.getDate() + (dir === 'next' ? 7 : -7));
      } else {
          newDate.setDate(currentDate.getDate() + (dir === 'next' ? 1 : -1));
      }
      setCurrentDate(newDate);
  };

  const formatDateRangeLabel = () => {
      if (viewMode === 'month') {
          return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      } else if (viewMode === 'day') {
          return currentDate.toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long' });
      } else {
          const startOfWeek = new Date(currentDate);
          const day = startOfWeek.getDay();
          const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
          startOfWeek.setDate(diff);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return `${startOfWeek.toLocaleDateString(undefined, {day: 'numeric', month: 'short'})} - ${endOfWeek.toLocaleDateString(undefined, {day: 'numeric', month: 'short'})}`;
      }
  };

  // --- Data Filtering ---
  const filteredData = useMemo(() => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      let relevantTrades: Trade[] = [];

      if (viewMode === 'month') {
          const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
          relevantTrades = trades.filter(t => t.entryDate.startsWith(monthStr));
      } 
      else if (viewMode === 'day') {
          const dayStr = currentDate.toISOString().split('T')[0];
          relevantTrades = trades.filter(t => t.entryDate.startsWith(dayStr));
      }
      else {
          const startOfWeek = new Date(currentDate);
          const day = startOfWeek.getDay();
          const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0,0,0,0);
          
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23,59,59,999);

          relevantTrades = trades.filter(t => {
              const d = new Date(t.entryDate);
              return d >= startOfWeek && d <= endOfWeek;
          });
      }

      return relevantTrades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [currentDate, viewMode, trades]);

  // --- Stats ---
  const stats = useMemo(() => {
      const total = filteredData.length;
      const wins = filteredData.filter(t => t.pnl > 0).length;
      const netPnl = filteredData.reduce((acc, t) => acc + t.pnl, 0);
      const winRate = total > 0 ? (wins / total) * 100 : 0;
      return { total, wins, netPnl, winRate };
  }, [filteredData]);

  // --- Calendar Data ---
  const calendarDays = useMemo(() => {
      if (viewMode !== 'month') return [];
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startDay = firstDay.getDay();
      
      const days = [];
      for(let i=0; i<startDay; i++) days.push(null);
      for(let i=1; i<=daysInMonth; i++) {
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
          const dayTrades = trades.filter(t => t.entryDate.startsWith(dateStr));
          days.push({ day: i, dateStr, trades: dayTrades, pnl: dayTrades.reduce((acc, t) => acc + t.pnl, 0) });
      }
      return days;
  }, [currentDate, viewMode, trades]);

  // --- Week Data ---
  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const days = [];
    for(let i=0; i<7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayTrades = trades.filter(t => t.entryDate.startsWith(dateStr));
        days.push({ date: d, dayName: d.toLocaleDateString('en-US', { weekday: 'short' }), dateNum: d.getDate(), trades: dayTrades, pnl: dayTrades.reduce((acc, t) => acc + t.pnl, 0) });
    }
    return days;
  }, [currentDate, viewMode, trades]);

  // --- Helper: Render Trade Row ---
  const renderTradeRow = (trade: Trade, index: number) => {
    const isWin = trade.pnl > 0;
    const isLong = trade.direction.includes('Long') || trade.direction.includes('Call');

    return (
      <motion.div 
        key={trade.id} 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => onSelectTrade(trade)}
        className="group relative flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-brand-500/20 rounded-xl mb-3 transition-all cursor-pointer overflow-hidden backdrop-blur-sm"
      >
        {/* Vertical Bar Indicator */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isWin ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        <div className="flex items-center gap-4 pl-3">
            <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-white font-bold text-base tracking-tight">{trade.symbol}</span>
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                        isLong 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    )}>
                        {trade.direction}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40 font-medium font-mono">
                    <Clock size={12} />
                    {new Date(trade.entryDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-8">
             <div className="text-right min-w-[100px]">
                 <div className={`text-base font-mono font-bold mb-0.5 ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isWin ? '+' : ''}${trade.pnl.toFixed(2)}
                 </div>
                 <div className="flex items-center justify-end gap-1 text-[10px] text-white/40 uppercase font-bold">
                    <Target size={10} />
                    {trade.setup || 'No Setup'}
                 </div>
             </div>
             
             {/* Edit Action on Hover */}
             {onEditTrade && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onEditTrade(trade); }}
                    className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white/40 hover:text-brand-500 hover:border-brand-500 transition-all md:opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                >
                    <Edit2 size={16} />
                </button>
             )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative w-full min-h-screen font-sans overflow-hidden -mt-4 -mx-4 p-4 md:-mt-8 md:-mx-8 md:p-8">
        {/* Ambient Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
        </div>

        <motion.div 
            className="relative z-10 space-y-6 max-w-[1600px] mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {/* Navigation Bar - Stack on mobile, Row on desktop */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white/[0.02] backdrop-blur-xl p-2 rounded-2xl border border-white/[0.05] shadow-2xl gap-4">
                {/* Left: View Toggle */}
                <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-white/[0.05] w-full md:w-auto">
                    {[
                        { id: 'day', label: 'Day', icon: LayoutList },
                        { id: 'week', label: 'Week', icon: Columns },
                        { id: 'month', label: 'Month', icon: CalendarDays }
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setViewMode(mode.id as ViewMode)}
                            className={cn(
                                "flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all",
                                viewMode === mode.id 
                                    ? "bg-white text-black shadow-lg shadow-white/10" 
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <mode.icon size={14} /> {mode.label}
                        </button>
                    ))}
                </div>

                {/* Center: Date Navigator */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-center px-2 md:px-0">
                    <button onClick={() => navigate('prev')} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-white/90 font-bold text-base tracking-tight text-center capitalize">
                        {formatDateRangeLabel()}
                    </span>
                    <button onClick={() => navigate('next')} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Right: Stats */}
                <div className="flex gap-6 px-4 md:px-6 border-t md:border-t-0 md:border-l border-white/[0.05] w-full md:w-auto justify-between md:justify-end py-2 md:py-0">
                    <div className="text-left md:text-right">
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Period P&L</p>
                        <p className={cn("text-sm font-bold font-mono", stats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                            {stats.netPnl >= 0 ? '+' : ''}${stats.netPnl.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Win Rate</p>
                        <p className="text-sm font-bold text-white font-mono">{stats.winRate.toFixed(0)}%</p>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="min-h-[600px]">
                
                {/* MONTH VIEW */}
                {viewMode === 'month' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden shadow-2xl"
                    >
                        <div className="grid grid-cols-7 border-b border-white/[0.05] bg-white/[0.01]">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                <div key={d} className="text-center text-[10px] font-bold text-white/40 uppercase py-4 tracking-wider">
                                    {d}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 auto-rows-[1fr]">
                            {calendarDays.map((day, idx) => {
                                if (!day) return <div key={`empty-${idx}`} className="min-h-[80px] md:min-h-[140px] border-b border-r border-white/[0.02]" />;
                                const isToday = day.dateStr === new Date().toISOString().split('T')[0];
                                return (
                                    <div 
                                        key={day.dateStr}
                                        onClick={() => { setViewMode('day'); setCurrentDate(new Date(day.dateStr)); }}
                                        className={cn(
                                            "min-h-[80px] md:min-h-[140px] p-1 md:p-3 border-b border-r border-white/[0.02] relative transition-all cursor-pointer group hover:bg-white/[0.03] flex flex-col",
                                            isToday && "bg-brand-500/5"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-[10px] md:text-xs font-mono font-bold transition-colors",
                                            isToday ? "text-brand-500" : "text-white/20 group-hover:text-white/60"
                                        )}>
                                            {day.day}
                                        </span>
                                        
                                        {day.trades.length > 0 && (
                                            <div className="flex flex-col items-center justify-center flex-1 gap-1 md:gap-2">
                                                {/* Mobile: Simple Dot or Small Text */}
                                                <span className={cn(
                                                    "text-xs md:text-lg font-bold font-mono tracking-tight truncate w-full text-center",
                                                    day.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                                                )}>
                                                    <span className="md:hidden">{day.pnl > 0 ? '+$' : '-$'}{Math.abs(day.pnl).toFixed(0)}</span>
                                                    <span className="hidden md:inline">{day.pnl > 0 ? '+' : ''}{day.pnl.toFixed(0)}</span>
                                                </span>
                                                <span className="hidden md:inline-block text-[10px] text-white/40 uppercase font-bold px-2 py-0.5 bg-white/[0.05] rounded-full border border-white/[0.05]">
                                                    {day.trades.length} Trades
                                                </span>
                                                {/* Mobile Dot */}
                                                <span className="md:hidden w-1.5 h-1.5 rounded-full bg-white/40"></span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* WEEK VIEW */}
                {viewMode === 'week' && (
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 h-full">
                        {weekDays.map((day, idx) => {
                            const isToday = day.date.toDateString() === new Date().toDateString();
                            return (
                                <motion.div 
                                    key={day.date.toISOString()} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex flex-col h-full min-h-[100px] md:min-h-auto"
                                >
                                    <div className={cn(
                                        "p-4 rounded-t-2xl border border-white/[0.05] border-b-0 text-center relative overflow-hidden backdrop-blur-xl",
                                        isToday ? "bg-brand-500/10 border-brand-500/30" : "bg-white/[0.02]"
                                    )}>
                                        {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>}
                                        <p className={cn("text-[10px] font-bold uppercase", isToday ? "text-brand-500" : "text-white/40")}>{day.dayName}</p>
                                        <p className="text-xl font-bold text-white mt-1">{day.dateNum}</p>
                                        {day.trades.length > 0 && (
                                            <p className={cn(
                                                "text-xs font-mono font-bold mt-2 px-2 py-1 rounded bg-black/40 inline-block",
                                                day.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                                            )}>
                                                {day.pnl > 0 ? '+' : ''}{day.pnl.toFixed(0)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-1 bg-white/[0.01] border border-white/[0.05] rounded-b-2xl md:rounded-b-2xl rounded-none p-2 space-y-2 min-h-[100px] md:min-h-[400px] backdrop-blur-md">
                                        {day.trades.map(trade => (
                                            <div 
                                                key={trade.id}
                                                onClick={() => onSelectTrade(trade)}
                                                className="bg-white/[0.03] border border-white/[0.05] hover:border-brand-500/30 hover:bg-white/[0.06] rounded-xl p-3 cursor-pointer group relative transition-all"
                                            >
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-xs font-bold text-white/90">{trade.symbol}</span>
                                                    <span className={cn("text-[10px] font-bold", trade.pnl > 0 ? "text-emerald-400" : "text-rose-400")}>
                                                        ${trade.pnl.toFixed(0)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-white/40 font-medium uppercase truncate max-w-[80px]">{trade.setup || 'No Setup'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* DAY VIEW - The List View */}
                {viewMode === 'day' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="backdrop-blur-xl bg-white/[0.01] border border-white/[0.05] rounded-2xl min-h-[600px] p-4 md:p-8 shadow-2xl"
                    >
                        {filteredData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-white/20 border border-dashed border-white/[0.05] rounded-xl bg-white/[0.02]">
                                <LayoutList size={48} className="mb-4 opacity-30" />
                                <p className="text-sm font-medium">No trades recorded for this day.</p>
                            </div>
                        ) : (
                            <div className="max-w-5xl mx-auto">
                                <div className="flex items-end justify-between mb-8 pb-6 border-b border-white/[0.05]">
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-medium text-white/90 tracking-tight mb-1">Daily Performance</h3>
                                        <p className="text-xs md:text-sm text-white/40 font-medium">{filteredData.length} Trades Executed</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            "text-2xl md:text-4xl font-bold font-mono tracking-tight",
                                            stats.netPnl >= 0 ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                                        )}>
                                            {stats.netPnl >= 0 ? '+' : ''}${stats.netPnl.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {filteredData.map((trade, idx) => renderTradeRow(trade, idx))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

            </div>
        </motion.div>
    </div>
  );
};