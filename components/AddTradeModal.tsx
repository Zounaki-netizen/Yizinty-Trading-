import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Save, Plus, Copy, Calculator, Calendar, Clock, DollarSign, Tag, AlertCircle, CheckCircle2, Wallet } from 'lucide-react';
import { Trade, Direction, TradeStatus, Outcome, Session, PropAccount } from '../types';
import { SETUP_TYPES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface Props {
  initialData?: Trade;
  accounts: PropAccount[];
  onClose: () => void;
  onSave: (trades: Trade[]) => void;
}

export const AddTradeModal: React.FC<Props> = ({ initialData, accounts, onClose, onSave }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- Account Selection (Multi-Select) ---
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(
      initialData && initialData.accountId 
        ? [initialData.accountId] 
        : (accounts.length > 0 ? [accounts[0].id] : [])
  );

  // --- Row 1: Date, Symbol, L/S, Session ---
  const [entryDate, setEntryDate] = useState(
      initialData ? new Date(initialData.entryDate).toISOString().split('T')[0] : '2025-11-21'
  );
  const [symbol, setSymbol] = useState(initialData?.symbol || '');
  const [direction, setDirection] = useState<Direction>(initialData?.direction || Direction.LONG);
  const [session, setSession] = useState<Session>(initialData?.session || Session.NY_AM);

  // --- Row 2: Times ---
  const [entryTime, setEntryTime] = useState(
      initialData 
      ? new Date(initialData.entryDate).toISOString().split('T')[1].substring(0,5)
      : '09:30'
  );
  const [exitTime, setExitTime] = useState(
      initialData
      ? new Date(initialData.exitDate).toISOString().split('T')[1].substring(0,5)
      : '10:00'
  );

  // --- Row 3: Metrics ---
  const [riskPercentage, setRiskPercentage] = useState<string>(initialData?.riskPercentage?.toString() || '1');
  const [commission, setCommission] = useState<string>(initialData?.commission?.toString() || '0');
  const [pnl, setPnl] = useState<string>(initialData?.pnl?.toString() || ''); 
  const [rMultiple, setRMultiple] = useState<string>(initialData?.rMultiple?.toString() || ''); 

  // --- Row 4: Setups, Mistakes (Free Text) ---
  const [setup, setSetup] = useState(initialData?.setup || '');
  const [mistakes, setMistakes] = useState<string[]>(initialData?.mistakes || []);
  const [mistakeInput, setMistakeInput] = useState('');

  // --- Screenshot & Hidden Execution Data ---
  const [screenshot, setScreenshot] = useState<string | undefined>(initialData?.screenshot);
  const [entryPrice, setEntryPrice] = useState<string>(initialData?.entryPrice?.toString() || '');
  const [exitPrice, setExitPrice] = useState<string>(initialData?.exitPrice?.toString() || '');
  const [size, setSize] = useState<string>(initialData?.size?.toString() || '');
  
  const isMultiAccount = selectedAccountIds.length > 1;
  const isEditMode = !!initialData;

  // --- Helper: Toggle Account ---
  const toggleAccount = (id: string) => {
    // If editing, lock account selection
    if (isEditMode) return;

    if (selectedAccountIds.includes(id)) {
        if (selectedAccountIds.length === 1) return; // Prevent deselecting last one
        setSelectedAccountIds(prev => prev.filter(accId => accId !== id));
    } else {
        setSelectedAccountIds(prev => [...prev, id]);
    }
  };

  // --- Helper: Image Upload ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMistake = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && mistakeInput.trim()) {
        if (!mistakes.includes(mistakeInput.trim())) {
            setMistakes([...mistakes, mistakeInput.trim()]);
        }
        setMistakeInput('');
    }
  };

  const removeMistake = (tag: string) => {
      setMistakes(mistakes.filter(m => m !== tag));
  };

  // --- Calculation Logic ---
  useEffect(() => {
    // Single account manual calculation if prices exist
    if (!isMultiAccount && entryPrice && exitPrice && size && !isEditMode) { // Don't overwrite PnL in edit mode unless explicit
        const e = parseFloat(entryPrice);
        const x = parseFloat(exitPrice);
        const s = parseFloat(size);
        let calculated = 0;
        if (!isNaN(e) && !isNaN(x) && !isNaN(s)) {
             if (direction === Direction.LONG || direction === Direction.CALL) {
                calculated = (x - e) * s;
            } else {
                calculated = (e - x) * s;
            }
            setPnl(calculated.toFixed(2));
        }
    }
  }, [entryPrice, exitPrice, size, direction, isMultiAccount, isEditMode]);

  const handleSave = () => {
    if (!symbol) {
      alert("Please enter a Symbol");
      return;
    }

    const tradesToSave: Trade[] = [];
    // Use existing ID if editing, else generate new base
    const baseTradeId = initialData ? initialData.id : Math.random().toString(36).substr(2, 9);
    
    // Parse common values
    const riskPctVal = parseFloat(riskPercentage) || 0;
    const rMultiVal = parseFloat(rMultiple) || 0;

    selectedAccountIds.forEach((accId, index) => {
        const account = accounts.find(a => a.id === accId);
        if (!account) return;

        let finalPnl = 0;
        let finalOutcome = Outcome.BREAK_EVEN;

        if (isMultiAccount) {
            const riskAmount = account.accountSize * (riskPctVal / 100);
            finalPnl = riskAmount * rMultiVal;
        } else {
            finalPnl = parseFloat(pnl) || 0;
        }

        finalOutcome = finalPnl > 0 ? Outcome.WIN : finalPnl < 0 ? Outcome.LOSS : Outcome.BREAK_EVEN;

        const newTrade: Trade = {
            // If editing single trade, keep ID. If multi-save, append index
            id: isEditMode ? baseTradeId : `${baseTradeId}-${index}`,
            accountId: accId,
            symbol: symbol.toUpperCase(),
            direction,
            session,
            entryDate: `${entryDate}T${entryTime}:00Z`,
            exitDate: `${entryDate}T${exitTime}:00Z`,
            status: TradeStatus.CLOSED,
            outcome: finalOutcome,
            
            // Metrics
            pnl: finalPnl,
            commission: parseFloat(commission) || 0,
            riskPercentage: riskPctVal,
            rMultiple: isMultiAccount ? rMultiVal : (parseFloat(rMultiple) || 0),

            // Execution
            entryPrice: parseFloat(entryPrice) || 0,
            exitPrice: parseFloat(exitPrice) || 0,
            size: parseFloat(size) || 0,
            
            // Notes
            setup: setup || 'Discretionary',
            mistakes: mistakes,
            notes: isMultiAccount ? `[Trade Copier] Executed on ${selectedAccountIds.length} accounts.` : (initialData?.notes || ''), 
            screenshot: screenshot
        };
        tradesToSave.push(newTrade);
    });

    onSave(tradesToSave);
    onClose();
  };

  return (
    <AnimatePresence>
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 overflow-hidden"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-[#050505]/95 w-full max-w-4xl rounded-t-3xl md:rounded-3xl border-t md:border border-white/[0.08] flex flex-col shadow-2xl overflow-hidden h-[90vh] md:max-h-[90vh] relative backdrop-blur-xl"
      >
        {/* Ambient Background inside modal */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full mix-blend-normal filter blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full mix-blend-normal filter blur-[100px]" />
        </div>

        {/* Header */}
        <div className="px-6 py-5 md:px-8 md:py-6 border-b border-white/[0.05] flex justify-between items-center relative z-10">
          <div>
              <h2 className="text-lg md:text-xl font-medium text-white flex items-center gap-3 tracking-tight">
                <div className={cn(
                    "p-2 rounded-xl border border-white/[0.05] shadow-inner",
                    isMultiAccount ? "bg-brand-500 text-black" : "bg-white/[0.05] text-brand-500"
                )}>
                    {isMultiAccount ? <Copy size={18} /> : (isEditMode ? <Calculator size={18} /> : <Plus size={18} />)}
                </div>
                <span className="truncate max-w-[200px] md:max-w-none">
                    {isEditMode ? 'Edit Trade' : (isMultiAccount ? 'Trade Copier' : 'Log Trade')}
                </span>
              </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10 custom-scrollbar">
          <div className="space-y-6 md:space-y-8 pb-20">

            {/* Account Selection */}
            <div className="bg-white/[0.02] border border-white/[0.05] p-4 md:p-6 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-bold text-brand-500 uppercase flex items-center gap-2 tracking-wider">
                        <Wallet size={12} /> Select Accounts
                    </label>
                    {isMultiAccount && (
                        <span className="text-[10px] text-black font-bold bg-brand-500 px-2 py-1 rounded-md shadow-lg shadow-brand-500/20">
                            COPIER ACTIVE
                        </span>
                    )}
                </div>
                
                <div className="flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible gap-3 pb-2 md:pb-0 -mx-2 px-2 md:mx-0 md:px-0 custom-scrollbar">
                    {accounts.map(acc => {
                        const isSelected = selectedAccountIds.includes(acc.id);
                        return (
                            <button
                                key={acc.id}
                                onClick={() => toggleAccount(acc.id)}
                                disabled={isEditMode}
                                className={cn(
                                    "px-4 py-3 rounded-xl text-xs font-medium border transition-all flex flex-col items-start min-w-[140px] flex-shrink-0 relative overflow-hidden group",
                                    isSelected 
                                        ? "bg-brand-500/10 text-brand-500 border-brand-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
                                        : "bg-white/[0.03] text-white/40 border-white/[0.05] hover:bg-white/[0.05] hover:text-white/60",
                                    isEditMode && !isSelected && "opacity-30 cursor-not-allowed"
                                )}
                            >
                                {isSelected && <div className="absolute top-0 left-0 w-full h-full bg-brand-500/5 animate-pulse" />}
                                <span className="relative z-10 font-bold text-sm mb-1">{acc.firmName}</span>
                                <span className={cn("relative z-10 text-[10px] font-mono", isSelected ? "text-brand-500/80" : "text-white/30")}>
                                    ${(acc.accountSize / 1000).toFixed(0)}k
                                </span>
                                {isSelected && <CheckCircle2 size={14} className="absolute top-3 right-3 text-brand-500" />}
                            </button>
                        );
                    })}
                </div>
                
                {/* Risk Calculator Preview */}
                <div className="mt-4 pt-4 border-t border-white/[0.05] flex flex-wrap gap-4 md:gap-6">
                    {selectedAccountIds.map(id => {
                        const acc = accounts.find(a => a.id === id);
                        if(!acc) return null;
                        const riskAmount = acc.accountSize * ((parseFloat(riskPercentage) || 0) / 100);
                        return (
                            <div key={id} className="flex items-center gap-2 text-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                                <span className="text-white/40 font-medium">{acc.firmName}:</span>
                                <span className="text-white/90 font-mono font-bold">1% = ${riskAmount.toFixed(0)}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
            
            {/* Row 1: Basic Info */}
            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-6 md:col-span-3 space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Date</label>
                    <div className="relative group">
                        <Calendar size={14} className="absolute left-3 top-3.5 text-white/30 group-focus-within:text-brand-500 transition-colors" />
                        <input 
                            type="date" 
                            value={entryDate}
                            onChange={e => setEntryDate(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 pl-9 text-white text-sm focus:border-brand-500/50 focus:bg-white/[0.05] outline-none transition-all font-medium"
                        />
                    </div>
                </div>
                <div className="col-span-6 md:col-span-3 space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Symbol</label>
                    <input 
                        type="text" 
                        value={symbol}
                        onChange={e => setSymbol(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-brand-500/50 focus:bg-white/[0.05] outline-none transition-all uppercase tracking-wide placeholder:text-white/10"
                        placeholder="e.g. EURUSD"
                        autoFocus
                    />
                </div>
                <div className="col-span-6 md:col-span-3 space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">L/S</label>
                    <div className="relative">
                        <select 
                            value={direction}
                            onChange={e => setDirection(e.target.value as Direction)}
                            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 text-white text-sm focus:border-brand-500/50 focus:bg-white/[0.05] outline-none transition-all appearance-none font-medium cursor-pointer"
                        >
                            {Object.values(Direction).map(d => <option key={d} value={d} className="bg-[#09090b]">{d}</option>)}
                        </select>
                        <div className="absolute right-4 top-3.5 pointer-events-none">
                            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white/30"></div>
                        </div>
                    </div>
                </div>
                <div className="col-span-6 md:col-span-3 space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Session</label>
                    <div className="relative">
                        <select 
                            value={session}
                            onChange={e => setSession(e.target.value as Session)}
                            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 text-white text-sm focus:border-brand-500/50 focus:bg-white/[0.05] outline-none transition-all appearance-none font-medium cursor-pointer"
                        >
                            {Object.values(Session).map(s => <option key={s} value={s} className="bg-[#09090b]">{s}</option>)}
                        </select>
                        <div className="absolute right-4 top-3.5 pointer-events-none">
                            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white/30"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Times */}
            <div className="grid grid-cols-12 gap-4 md:gap-6">
                 <div className="col-span-6 md:col-span-3 space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Entry Time</label>
                    <div className="relative group">
                        <Clock size={14} className="absolute left-3 top-3.5 text-white/30 group-focus-within:text-brand-500 transition-colors" />
                        <input 
                            type="time" 
                            value={entryTime}
                            onChange={e => setEntryTime(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 pl-9 text-white text-sm focus:border-brand-500/50 focus:bg-white/[0.05] outline-none transition-all font-mono"
                        />
                    </div>
                 </div>
                 <div className="col-span-6 md:col-span-3 space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Exit Time</label>
                    <div className="relative group">
                        <Clock size={14} className="absolute left-3 top-3.5 text-white/30 group-focus-within:text-brand-500 transition-colors" />
                        <input 
                            type="time" 
                            value={exitTime}
                            onChange={e => setExitTime(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 pl-9 text-white text-sm focus:border-brand-500/50 focus:bg-white/[0.05] outline-none transition-all font-mono"
                        />
                    </div>
                 </div>
                 <div className="col-span-6 md:col-span-3 space-y-2">
                     <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Entry Price</label>
                     <input type="number" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 text-white text-sm focus:border-brand-500/50 outline-none transition-all font-mono placeholder:text-white/10" placeholder="0.00" />
                 </div>
                 <div className="col-span-6 md:col-span-3 space-y-2">
                     <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Size</label>
                     <input type="number" value={size} onChange={e => setSize(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 text-white text-sm focus:border-brand-500/50 outline-none transition-all font-mono placeholder:text-white/10" placeholder="Qty" />
                 </div>
            </div>

            {/* Row 3: Key Metrics */}
            <div className="bg-brand-500/[0.02] p-4 md:p-6 rounded-2xl border border-brand-500/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500/20 to-transparent" />
                
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <Calculator size={14} className="text-brand-500" />
                    <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">
                        Performance Metrics
                    </p>
                </div>

                <div className="grid grid-cols-12 gap-4 md:gap-6">
                    <div className="col-span-6 md:col-span-3 space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">% Risk</label>
                        <div className="relative group">
                            <input 
                                type="number" 
                                value={riskPercentage}
                                onChange={e => setRiskPercentage(e.target.value)}
                                className="w-full bg-black/20 border border-brand-500/20 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-brand-500 outline-none transition-all"
                                placeholder="1.0"
                            />
                            <span className="absolute right-4 top-3 text-white/20 text-xs font-bold">%</span>
                        </div>
                    </div>
                    
                    <div className="col-span-6 md:col-span-3 space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">R-Outcome</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={rMultiple}
                                onChange={e => setRMultiple(e.target.value)}
                                className="w-full bg-black/20 border border-brand-500/20 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-brand-500 outline-none transition-all"
                                placeholder="2.0"
                            />
                            <span className="absolute right-4 top-3 text-white/20 text-xs font-bold">R</span>
                        </div>
                    </div>

                    {!isMultiAccount && (
                        <div className="col-span-6 md:col-span-3 space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">P/L ($)</label>
                            <div className="relative group">
                                <DollarSign size={14} className="absolute left-3 top-3.5 text-white/20 group-focus-within:text-brand-500 transition-colors" />
                                <input 
                                    type="number" 
                                    value={pnl}
                                    onChange={e => setPnl(e.target.value)}
                                    className={cn(
                                        "w-full bg-black/20 border border-brand-500/20 rounded-xl px-4 py-3 pl-9 font-mono font-bold text-sm focus:border-brand-500 outline-none transition-all",
                                        parseFloat(pnl) > 0 ? 'text-emerald-400' : (parseFloat(pnl) < 0 ? 'text-rose-400' : 'text-white')
                                    )}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className="col-span-6 md:col-span-3 space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Commission</label>
                        <div className="relative group">
                             <DollarSign size={14} className="absolute left-3 top-3.5 text-white/20 group-focus-within:text-brand-500 transition-colors" />
                            <input 
                                type="number" 
                                value={commission}
                                onChange={e => setCommission(e.target.value)}
                                className="w-full bg-black/20 border border-brand-500/20 rounded-xl px-4 py-3 pl-9 text-white font-mono text-sm focus:border-brand-500 outline-none transition-all"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 4: Tags (Free Text) */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Setup Model</label>
                    <input
                        list="setups"
                        value={setup}
                        onChange={e => setSetup(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 text-white text-sm focus:border-brand-500/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/10"
                        placeholder="Type or select setup..."
                    />
                    <datalist id="setups">
                        {SETUP_TYPES.map(s => <option key={s} value={s} />)}
                    </datalist>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Mistakes / Tags</label>
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-2 flex flex-wrap items-center gap-2 focus-within:border-brand-500/50 focus-within:bg-white/[0.05] transition-all min-h-[50px]">
                        <Tag size={14} className="ml-2 text-white/20 flex-shrink-0" />
                        {mistakes.map(m => (
                            <span key={m} className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 animate-fade-in">
                                {m}
                                <button onClick={() => removeMistake(m)} className="hover:text-white/90 transition-colors"><X size={12} /></button>
                            </span>
                        ))}
                        <input 
                            value={mistakeInput}
                            onChange={e => setMistakeInput(e.target.value)}
                            onKeyDown={handleAddMistake}
                            className="flex-1 bg-transparent border-none outline-none text-white text-sm h-8 min-w-[140px] placeholder:text-white/10"
                            placeholder={mistakes.length === 0 ? "Type tag + Enter..." : ""}
                        />
                    </div>
                </div>
            </div>

            {/* Screenshot Area */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Screenshot</label>
                <div 
                    className="h-32 md:h-40 bg-white/[0.02] border border-dashed border-white/[0.1] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-500/50 hover:bg-white/[0.03] transition-all relative overflow-hidden group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {screenshot ? (
                        <>
                            <img src={screenshot} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity filter blur-[1px] group-hover:blur-0" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-95 group-hover:scale-100">
                                <span className="bg-black/80 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 border border-white/10 backdrop-blur-md shadow-xl">
                                    <Upload size={14}/> Change Image
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/[0.05] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <ImageIcon className="text-white/40" size={24} />
                            </div>
                            <span className="text-white/40 text-xs font-medium">Click or Paste Screenshot</span>
                        </>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                    />
                </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 md:px-8 md:py-6 border-t border-white/[0.05] bg-[#050505]/50 backdrop-blur-xl flex justify-between items-center relative z-20">
             <div className="flex items-center gap-2 text-xs text-white/40 hidden md:flex">
                <AlertCircle size={14} />
                {isMultiAccount ? `${selectedAccountIds.length} trades will be created.` : 'Single entry mode.'}
             </div>
             <button 
                onClick={handleSave}
                className="w-full md:w-auto bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-black font-bold py-3.5 md:py-3 px-10 rounded-xl shadow-lg shadow-brand-500/20 transition-all hover:shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <Save size={18} />
                {isEditMode ? 'UPDATE' : (isMultiAccount ? 'EXECUTE COPY' : 'SAVE TRADE')}
            </button>
        </div>
      </motion.div>
    </motion.div>
    </AnimatePresence>
  );
};