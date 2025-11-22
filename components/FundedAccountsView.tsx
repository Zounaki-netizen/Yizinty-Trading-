
import React, { useState, useRef, useMemo } from 'react';
import { PropAccount, AccountStatus, Trade } from '../types';
import { Plus, Wallet, TrendingUp, DollarSign, X, Upload, Trash2, History, Eye, PenSquare, Clock, Filter, CreditCard, Check, AlertCircle, Calendar, Save, Award, ArrowRight, Download } from 'lucide-react';
import { FIRM_LOGOS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface Props {
  accounts: PropAccount[];
  trades?: Trade[];
  onAddAccount: (account: PropAccount) => void;
  onUpdateAccount: (account: PropAccount) => void;
  onDeleteAccount: (id: string) => void;
}

type DateFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';

export const FundedAccountsView: React.FC<Props> = ({ accounts, trades = [], onAddAccount, onUpdateAccount, onDeleteAccount }) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');

  // --- Filtering Logic ---
  const checkDate = (dateStr: string) => {
      const d = new Date(dateStr);
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (dateFilter === 'TODAY') {
          return d >= startOfDay;
      }
      if (dateFilter === 'WEEK') {
          const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          return d >= firstDayOfWeek;
      }
      if (dateFilter === 'MONTH') {
          return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
      }
      if (dateFilter === 'YEAR') {
          return d.getFullYear() === new Date().getFullYear();
      }
      return true;
  };

  // Dynamically calculate stats based on filter
  const filteredStats = useMemo(() => {
      const allPayouts = accounts.flatMap(a => a.payouts || []);
      const filteredPayouts = allPayouts.filter(p => checkDate(p.date));
      const totalPayoutsVal = filteredPayouts.reduce((acc, p) => acc + p.amount, 0);

      const accountsInPeriod = accounts.filter(a => checkDate(a.dateAdded));
      const totalSpentVal = accountsInPeriod.reduce((acc, a) => acc + a.cost, 0);
      
      const roiVal = totalSpentVal > 0 ? ((totalPayoutsVal - totalSpentVal) / totalSpentVal) * 100 : 0;

      return { totalSpentVal, totalPayoutsVal, roiVal, payoutCount: filteredPayouts.length };
  }, [accounts, dateFilter]);


  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Form State
  const [firmName, setFirmName] = useState('');
  const [accountSize, setAccountSize] = useState('');
  const [cost, setCost] = useState('');
  const [targetProfit, setTargetProfit] = useState('');
  const [status, setStatus] = useState<AccountStatus>(AccountStatus.EVAL_PHASE_1);
  const [dateAdded, setDateAdded] = useState(new Date().toISOString().split('T')[0]);
  const [isSubscription, setIsSubscription] = useState(false);
  const [monthlyFee, setMonthlyFee] = useState('');
  const [activationFee, setActivationFee] = useState('');

  // Edit State
  const [editFirmName, setEditFirmName] = useState('');
  const [editAccountSize, setEditAccountSize] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editTargetProfit, setEditTargetProfit] = useState('');
  const [editIsSubscription, setEditIsSubscription] = useState(false);
  const [editMonthlyFee, setEditMonthlyFee] = useState('');
  const [editActivationFee, setEditActivationFee] = useState('');
  const [editDateAdded, setEditDateAdded] = useState('');
  const [editDateFunded, setEditDateFunded] = useState('');
  const [editDateEnded, setEditDateEnded] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutDate, setPayoutDate] = useState('');

  // Handlers
  const handleSave = () => {
    if(!firmName) return;
    const newAcc: PropAccount = {
        id: Math.random().toString(36).substr(2, 9),
        firmName,
        accountSize: parseFloat(accountSize) || 0,
        cost: parseFloat(cost) || 0,
        targetProfit: parseFloat(targetProfit) || 0,
        isSubscription,
        monthlyFee: isSubscription ? (parseFloat(monthlyFee) || 0) : 0,
        activationFee: parseFloat(activationFee) || 0,
        totalPayouts: 0,
        payoutCount: 0,
        payouts: [],
        status,
        dateAdded: new Date(dateAdded).toISOString(),
        dateFunded: status === AccountStatus.FUNDED ? new Date(dateAdded).toISOString() : undefined
    };
    onAddAccount(newAcc);
    setIsAddModalOpen(false);
    resetAddForm();
  };

  const resetAddForm = () => {
      setFirmName(''); setAccountSize(''); setCost(''); setTargetProfit(''); 
      setStatus(AccountStatus.EVAL_PHASE_1); setIsSubscription(false); 
      setMonthlyFee(''); setActivationFee('');
      setDateAdded(new Date().toISOString().split('T')[0]);
  };

  const openPayoutModal = (id: string) => {
    setSelectedAccountId(id);
    setIsPayoutModalOpen(true);
    setPayoutDate(new Date().toISOString().split('T')[0]);
    setPayoutAmount('');
  };

  const openDetailsModal = (id: string) => {
      setSelectedAccountId(id);
      setIsDetailsModalOpen(true);
  };

  const openEditModal = (id: string) => {
      const acc = accounts.find(a => a.id === id);
      if (!acc) return;
      setSelectedAccountId(id);
      setEditFirmName(acc.firmName);
      setEditAccountSize(acc.accountSize.toString());
      setEditCost(acc.cost.toString());
      setEditTargetProfit(acc.targetProfit ? acc.targetProfit.toString() : '');
      setEditIsSubscription(acc.isSubscription);
      setEditMonthlyFee(acc.monthlyFee ? acc.monthlyFee.toString() : '');
      setEditActivationFee(acc.activationFee ? acc.activationFee.toString() : '');
      setEditDateAdded(acc.dateAdded ? acc.dateAdded.split('T')[0] : '');
      setEditDateFunded(acc.dateFunded ? acc.dateFunded.split('T')[0] : '');
      setEditDateEnded(acc.dateEnded ? acc.dateEnded.split('T')[0] : '');
      setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
      if (!selectedAccountId) return;
      const acc = accounts.find(a => a.id === selectedAccountId);
      if (acc) {
          onUpdateAccount({
              ...acc,
              firmName: editFirmName,
              accountSize: parseFloat(editAccountSize) || 0,
              cost: parseFloat(editCost) || 0,
              targetProfit: parseFloat(editTargetProfit) || 0,
              isSubscription: editIsSubscription,
              monthlyFee: parseFloat(editMonthlyFee) || 0,
              activationFee: parseFloat(editActivationFee) || 0,
              dateAdded: editDateAdded ? new Date(editDateAdded).toISOString() : acc.dateAdded,
              dateFunded: editDateFunded ? new Date(editDateFunded).toISOString() : undefined,
              dateEnded: editDateEnded ? new Date(editDateEnded).toISOString() : undefined,
          });
          setIsEditModalOpen(false);
      }
  };

  const handleSavePayout = () => {
    if (!selectedAccountId || !payoutAmount) return;
    const acc = accounts.find(a => a.id === selectedAccountId);
    if (acc) {
        const amount = parseFloat(payoutAmount);
        const updated: PropAccount = {
            ...acc,
            totalPayouts: acc.totalPayouts + amount,
            payoutCount: acc.payoutCount + 1,
            payouts: [...(acc.payouts || []), {
                id: Math.random().toString(36),
                amount: amount,
                date: payoutDate,
                note: 'Manual Payout Log'
            }]
        };
        onUpdateAccount(updated);
        setIsPayoutModalOpen(false);
    }
  };

  const handleDeleteClick = (id: string) => {
      if (window.confirm("Are you sure you want to delete this account? This cannot be undone.")) {
          onDeleteAccount(id);
      }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
      const acc = accounts.find(a => a.id === id);
      if (acc) {
          const updateData: any = { ...acc, status: newStatus as AccountStatus };
          if (newStatus === AccountStatus.FAILED || newStatus === AccountStatus.BREACHED) {
              if (!acc.dateEnded) updateData.dateEnded = new Date().toISOString();
          } 
          else if (newStatus === AccountStatus.FUNDED) {
              if (!acc.dateFunded) updateData.dateFunded = new Date().toISOString();
              updateData.dateEnded = undefined;
          }
          else {
              updateData.dateEnded = undefined;
          }
          onUpdateAccount(updateData);
      }
  };

  const handleCertificateUpload = (accountId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const acc = accounts.find(a => a.id === accountId);
        if (acc) onUpdateAccount({ ...acc, certificate: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusColor = (status: AccountStatus) => {
      switch(status) {
          case AccountStatus.FUNDED: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
          case AccountStatus.FAILED: 
          case AccountStatus.BREACHED: return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
          default: return 'text-brand-500 bg-brand-500/10 border-brand-500/20';
      }
  };
  
  const getFirmLogo = (name: string) => {
      const lowerName = name.toLowerCase();
      const key = Object.keys(FIRM_LOGOS).find(k => lowerName.includes(k));
      return key ? FIRM_LOGOS[key] : null;
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="relative w-full min-h-screen font-sans overflow-hidden -mt-8 -mx-8 p-8">
       {/* Ambient Background */}
       <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
        </div>

      <motion.div 
        className="relative z-10 space-y-8 max-w-[1600px] mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Filter Bar */}
        <div className="flex items-center justify-between bg-white/[0.02] backdrop-blur-xl p-2 rounded-2xl border border-white/[0.05] shadow-2xl">
            <div className="flex items-center gap-2 pl-4">
                <Filter size={14} className="text-brand-500" />
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Filter Data:</span>
            </div>
            <div className="flex gap-1">
                {(['ALL', 'TODAY', 'WEEK', 'MONTH', 'YEAR'] as DateFilter[]).map(filter => (
                    <button
                        key={filter}
                        onClick={() => setDateFilter(filter)}
                        className={cn(
                            "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                            dateFilter === filter 
                                ? "bg-white text-black shadow-lg" 
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { label: dateFilter === 'ALL' ? 'Total Invested' : 'Invested (Period)', value: `$${filteredStats.totalSpentVal.toLocaleString()}`, icon: <CreditCard size={20} />, color: "text-white" },
                { label: dateFilter === 'ALL' ? 'Total Payouts' : 'Payouts (Period)', value: `$${filteredStats.totalPayoutsVal.toLocaleString()}`, sub: `${filteredStats.payoutCount} Withdrawals`, icon: <DollarSign size={20} />, color: "text-emerald-400" },
                { label: "Net ROI", value: `${filteredStats.roiVal.toFixed(1)}%`, sub: filteredStats.roiVal > 0 ? 'Profitable' : 'Investment', icon: <TrendingUp size={20} />, color: filteredStats.roiVal >= 0 ? "text-brand-400" : "text-rose-400" }
            ].map((stat, idx) => (
                <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] p-6 rounded-2xl hover:bg-white/[0.04] transition-colors group"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                            <h3 className={cn("text-2xl font-medium tracking-tight", stat.color)}>{stat.value}</h3>
                            {stat.sub && <p className="text-xs text-white/40 mt-1">{stat.sub}</p>}
                        </div>
                        <div className="p-3 bg-white/[0.05] rounded-xl border border-white/[0.05] text-white/70 group-hover:text-white transition-colors">
                            {stat.icon}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>

        {/* Accounts Header */}
        <div className="flex justify-between items-center">
             <h3 className="text-xl font-medium text-white/90 tracking-tight">Your Accounts</h3>
             <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-brand-500 hover:bg-brand-400 text-black px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all hover:scale-105"
             >
                <Plus size={16} /> ADD FUNDED ACC
             </button>
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account, idx) => {
                const logoUrl = getFirmLogo(account.firmName);
                return (
                <motion.div 
                    key={account.id} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-6 hover:border-brand-500/30 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[420px]"
                >
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                {logoUrl ? (
                                    <img src={logoUrl} alt={account.firmName} className="w-12 h-12 rounded-xl object-cover bg-white shadow-lg" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold border border-brand-500/20">
                                        {account.firmName.substring(0,2).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xl font-bold text-white/90 cursor-pointer hover:text-brand-500 transition-colors" onClick={() => openDetailsModal(account.id)}>
                                            {account.firmName}
                                        </h4>
                                        <button onClick={() => openEditModal(account.id)} className="text-white/20 hover:text-brand-500 transition-colors">
                                            <PenSquare size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-white/50 text-xs font-medium font-mono">${account.accountSize.toLocaleString()}</span>
                                        {account.isSubscription && <span className="text-[10px] font-bold text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">SUB</span>}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Clean Glass Dropdown */}
                            <div className="relative">
                                <select 
                                    value={account.status}
                                    onChange={(e) => handleStatusChange(account.id, e.target.value)}
                                    className={cn(
                                        "appearance-none text-[10px] font-bold uppercase border rounded-lg px-3 py-1.5 outline-none cursor-pointer bg-transparent transition-all hover:opacity-80",
                                        getStatusColor(account.status)
                                    )}
                                >
                                    {Object.values(AccountStatus).map(s => <option key={s} value={s} className="bg-neutral-900 text-slate-300">{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-sm border-b border-white/[0.05] pb-3">
                                <span className="text-white/40">Initial Cost</span>
                                <span className="text-white/80 font-mono font-medium">${account.cost}</span>
                            </div>
                            {account.isSubscription && (
                                <div className="flex justify-between text-sm border-b border-white/[0.05] pb-3">
                                    <span className="text-white/40">Monthly Fee</span>
                                    <span className="text-white/80 font-mono font-medium">${account.monthlyFee}/mo</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm border-b border-white/[0.05] pb-3">
                                <span className="text-white/40">Total Payouts</span>
                                <div className="flex items-center gap-3">
                                    <span className={cn("font-mono font-bold text-lg", account.totalPayouts > 0 ? "text-emerald-400" : "text-white/20")}>
                                        ${account.totalPayouts.toLocaleString()}
                                    </span>
                                    <button 
                                        onClick={() => openPayoutModal(account.id)} 
                                        className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg hover:bg-emerald-500 hover:text-black transition-all"
                                        title="Log Payout"
                                    >
                                        <Plus size={12} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Timeline Data */}
                        <div className="flex flex-col gap-2 text-[10px] text-white/40 font-mono bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                            <div className="flex justify-between">
                                <span className="flex items-center gap-1.5"><Clock size={10}/> Purchased</span>
                                <span className="text-white/60">{new Date(account.dateAdded).toLocaleDateString()}</span>
                            </div>
                            {account.dateFunded && (
                                <div className="flex justify-between">
                                    <span className="flex items-center gap-1.5 text-emerald-500"><Clock size={10}/> Passed</span>
                                    <span className="text-emerald-400">{new Date(account.dateFunded).toLocaleDateString()}</span>
                                </div>
                            )}
                            {account.dateEnded && (
                                <div className="flex justify-between">
                                    <span className="flex items-center gap-1.5 text-rose-500"><Clock size={10}/> Ended</span>
                                    <span className="text-rose-400">{new Date(account.dateEnded).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                        <button 
                            onClick={() => openDetailsModal(account.id)} 
                            className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.05] text-white/80 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            <Eye size={14} /> View Details
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(account.id)} 
                            className="px-4 bg-white/[0.02] border border-white/[0.05] hover:border-rose-500/50 text-white/20 hover:text-rose-500 rounded-xl transition-all"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                    {/* Certificate Teaser */}
                    <div className="mt-4 pt-4 border-t border-white/[0.05]">
                        {account.certificate ? (
                             <button onClick={() => openDetailsModal(account.id)} className="w-full text-[10px] text-brand-500 font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:underline">
                                <Award size={10} /> View Certificate
                             </button>
                        ) : (
                            <button onClick={() => fileInputRefs.current[account.id]?.click()} className="w-full text-[10px] text-white/20 font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:text-white transition-colors">
                                <Upload size={10} /> Upload Certificate
                            </button>
                        )}
                         <input type="file" ref={el => fileInputRefs.current[account.id] = el} onChange={(e) => handleCertificateUpload(account.id, e)} accept="image/*" className="hidden" />
                    </div>
                </motion.div>
            );})}
        </div>
      </motion.div>

      {/* --- PAYOUT MODAL --- */}
      <AnimatePresence>
        {isPayoutModalOpen && selectedAccount && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#050505]/95 w-full max-w-md rounded-3xl border border-white/[0.1] p-6 shadow-2xl relative overflow-hidden"
                >
                    {/* Ambient Light */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full mix-blend-normal filter blur-[60px] pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Log Withdrawal</h3>
                                <p className="text-white/40 text-xs mt-1">Record a payout for {selectedAccount.firmName}</p>
                            </div>
                            <button onClick={() => setIsPayoutModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-white/40 uppercase mb-2 tracking-wider">Amount ($)</label>
                                <div className="relative group">
                                    <DollarSign size={16} className="absolute left-3 top-3.5 text-emerald-500" />
                                    <input 
                                        type="number" 
                                        autoFocus
                                        className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-emerald-500 focus:bg-white/[0.05] transition-all font-mono font-bold text-lg" 
                                        placeholder="0.00" 
                                        value={payoutAmount} 
                                        onChange={e => setPayoutAmount(e.target.value)} 
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-bold text-white/40 uppercase mb-2 tracking-wider">Date Received</label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-3.5 text-white/20" />
                                    <input 
                                        type="date" 
                                        className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-brand-500 transition-all text-sm font-medium" 
                                        value={payoutDate} 
                                        onChange={e => setPayoutDate(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleSavePayout} 
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                            >
                                <Check size={18} strokeWidth={3} /> Confirm Payout
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>


      {/* --- DETAILS MODAL --- */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedAccount && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#050505] w-full max-w-5xl rounded-3xl border border-white/[0.1] shadow-2xl relative overflow-hidden flex flex-col h-[90vh]"
                >
                    {/* Header Section */}
                    <div className="px-8 py-6 border-b border-white/[0.05] bg-white/[0.02] flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            {getFirmLogo(selectedAccount.firmName) ? (
                                <img src={getFirmLogo(selectedAccount.firmName)} alt="logo" className="w-12 h-12 rounded-xl bg-white shadow-md object-cover" />
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 font-bold">
                                    {selectedAccount.firmName.substring(0,2).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h2 className="text-2xl font-bold text-white">{selectedAccount.firmName}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded border", getStatusColor(selectedAccount.status))}>
                                        {selectedAccount.status}
                                    </span>
                                    <span className="text-white/40 text-xs font-mono">${selectedAccount.accountSize.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 custom-scrollbar">
                        {/* LEFT COLUMN: Stats & History */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* ROI Card */}
                            <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px]" />
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Net Performance</p>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <h3 className={cn("text-3xl font-mono font-bold tracking-tight", selectedAccount.totalPayouts - selectedAccount.cost > 0 ? "text-emerald-400" : "text-white")}>
                                        {selectedAccount.totalPayouts - selectedAccount.cost > 0 ? '+' : ''}
                                        ${(selectedAccount.totalPayouts - selectedAccount.cost).toLocaleString()}
                                    </h3>
                                </div>
                                <p className="text-xs text-white/40 flex items-center gap-1">
                                    Total Profit vs Costs
                                </p>
                            </div>

                             {/* Breakdown */}
                             <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/40">Total Payouts</span>
                                    <span className="text-emerald-400 font-mono font-bold">+${selectedAccount.totalPayouts.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/40">Account Cost</span>
                                    <span className="text-rose-400 font-mono font-bold">-${selectedAccount.cost.toLocaleString()}</span>
                                </div>
                                {selectedAccount.isSubscription && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/40">Monthly Fee</span>
                                        <span className="text-rose-400 font-mono font-bold">-${selectedAccount.monthlyFee}/mo</span>
                                    </div>
                                )}
                            </div>

                            {/* Payout History List */}
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden flex-1 flex flex-col">
                                <div className="p-4 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.01]">
                                    <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
                                        <History size={14} /> Payout History
                                    </h4>
                                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">{selectedAccount.payouts?.length || 0}</span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                                    {selectedAccount.payouts && selectedAccount.payouts.length > 0 ? (
                                        selectedAccount.payouts.map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-3 hover:bg-white/[0.03] rounded-lg transition-colors border border-transparent hover:border-white/[0.05] group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                                        <DollarSign size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-mono font-bold text-sm">${p.amount.toLocaleString()}</p>
                                                        <p className="text-[10px] text-white/40">{new Date(p.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                     {/* Could add edit/delete payout here later */}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-white/20 text-xs italic">
                                            No withdrawals recorded yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Certificate Viewer */}
                        <div className="lg:col-span-2 flex flex-col h-full bg-[#0A0A0B] border border-white/[0.05] rounded-2xl overflow-hidden relative group">
                            {selectedAccount.certificate ? (
                                <>
                                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                                        <button 
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = selectedAccount.certificate!;
                                                link.download = `Certificate_${selectedAccount.firmName}.png`;
                                                link.click();
                                            }}
                                            className="bg-black/60 hover:bg-black/80 backdrop-blur text-white p-2 rounded-lg border border-white/10 transition-colors"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <button 
                                            onClick={() => fileInputRefs.current[selectedAccount.id]?.click()}
                                            className="bg-black/60 hover:bg-black/80 backdrop-blur text-white p-2 rounded-lg border border-white/10 transition-colors"
                                        >
                                            <PenSquare size={18} />
                                        </button>
                                    </div>
                                    <div className="w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none absolute inset-0 z-0" />
                                    <img 
                                        src={selectedAccount.certificate} 
                                        alt="Certificate" 
                                        className="w-full h-full object-contain p-4 md:p-8 relative z-0" 
                                    />
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-20 h-20 bg-white/[0.02] border border-dashed border-white/[0.1] rounded-full flex items-center justify-center mb-4">
                                        <Award size={32} className="text-white/20" />
                                    </div>
                                    <h4 className="text-white font-bold text-lg mb-2">No Certificate Uploaded</h4>
                                    <p className="text-white/40 text-sm max-w-xs mb-6">Upload your funded certificate or payout proof to keep a visual record of your success.</p>
                                    <button 
                                        onClick={() => fileInputRefs.current[selectedAccount.id]?.click()}
                                        className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2"
                                    >
                                        <Upload size={16} /> Upload Image
                                    </button>
                                </div>
                            )}
                            <input type="file" ref={el => fileInputRefs.current[selectedAccount.id] = el} onChange={(e) => handleCertificateUpload(selectedAccount.id, e)} accept="image/*" className="hidden" />
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* ADD ACCOUNT MODAL - PREMIUM GLASS DESIGN */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#050505]/90 w-full max-w-2xl rounded-3xl border border-white/[0.1] p-8 shadow-2xl max-h-[95vh] overflow-y-auto relative"
              >
                  {/* Ambient Light */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full mix-blend-normal filter blur-[80px] pointer-events-none" />

                  <div className="flex justify-between items-center mb-8 relative z-10">
                      <div>
                          <h3 className="text-2xl font-bold text-white tracking-tight">Add Prop Account</h3>
                          <p className="text-white/40 text-sm mt-1">Track costs, subscriptions, and progress.</p>
                      </div>
                      <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="space-y-6 relative z-10">
                      {/* Row 1 */}
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="block text-[10px] font-bold text-white/40 uppercase mb-2 tracking-wider">Firm Name</label>
                              <div className="relative group">
                                <Wallet className="absolute left-3 top-3.5 text-white/20 group-focus-within:text-brand-500 transition-colors" size={16} />
                                <input 
                                    className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-brand-500 focus:bg-white/[0.05] transition-all font-medium placeholder:text-white/10" 
                                    placeholder="e.g. FTMO" 
                                    value={firmName} 
                                    onChange={e => setFirmName(e.target.value)} 
                                />
                              </div>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-white/40 uppercase mb-2 tracking-wider">Account Size</label>
                              <div className="relative group">
                                <DollarSign className="absolute left-3 top-3.5 text-white/20 group-focus-within:text-brand-500 transition-colors" size={16} />
                                <input 
                                    type="number" 
                                    className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-brand-500 focus:bg-white/[0.05] transition-all font-medium font-mono placeholder:text-white/10" 
                                    placeholder="100000" 
                                    value={accountSize} 
                                    onChange={e => setAccountSize(e.target.value)} 
                                />
                              </div>
                          </div>
                      </div>

                      {/* Row 2: Status & Purchase Date */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                             <label className="block text-[10px] font-bold text-white/40 uppercase mb-2 tracking-wider">Starting Status</label>
                             <select 
                                value={status}
                                onChange={e => setStatus(e.target.value as AccountStatus)}
                                className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl px-4 py-3 text-white outline-none focus:border-brand-500 focus:bg-white/[0.05] transition-all font-medium appearance-none cursor-pointer"
                             >
                                {Object.values(AccountStatus).map(s => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
                             </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase mb-2 tracking-wider">Purchase Date</label>
                            <div className="relative group">
                                <Calendar className="absolute left-3 top-3.5 text-white/20 group-focus-within:text-brand-500 transition-colors" size={16} />
                                <input 
                                    type="date" 
                                    className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-brand-500 focus:bg-white/[0.05] transition-all font-medium text-sm" 
                                    value={dateAdded} 
                                    onChange={e => setDateAdded(e.target.value)} 
                                />
                            </div>
                        </div>
                      </div>

                      {/* Expenses Section */}
                      <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl">
                          <div className="flex items-center gap-2 mb-4">
                              <CreditCard size={16} className="text-brand-500" />
                              <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest">Expense Configuration</h4>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6 mb-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-2 tracking-wider">Initial Fee / Cost ($)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-black/20 border border-white/[0.1] rounded-xl px-4 py-3 text-white outline-none focus:border-brand-500 transition-all font-mono" 
                                        placeholder="500" 
                                        value={cost} 
                                        onChange={e => setCost(e.target.value)} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-2 tracking-wider">Future Activation Fee ($)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-black/20 border border-white/[0.1] rounded-xl px-4 py-3 text-white outline-none focus:border-brand-500 transition-all font-mono" 
                                        placeholder="Optional (e.g. 140)" 
                                        value={activationFee} 
                                        onChange={e => setActivationFee(e.target.value)} 
                                    />
                                </div>
                          </div>

                          {/* Subscription Toggle */}
                          <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/[0.05]">
                              <div 
                                onClick={() => setIsSubscription(!isSubscription)}
                                className={cn(
                                    "w-12 h-6 rounded-full relative transition-colors cursor-pointer",
                                    isSubscription ? "bg-brand-500" : "bg-white/10"
                                )}
                              >
                                  <div className={cn(
                                      "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-md",
                                      isSubscription ? "translate-x-6" : "translate-x-0"
                                  )} />
                              </div>
                              <div className="flex-1">
                                  <p className="text-sm font-bold text-white">Monthly Subscription?</p>
                                  <p className="text-[10px] text-white/40">Enable if this account has recurring billing.</p>
                              </div>
                          </div>

                          <AnimatePresence>
                            {isSubscription && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4"
                                >
                                     <label className="block text-[10px] font-bold text-brand-500 uppercase mb-2 tracking-wider">Monthly Recurring Fee ($)</label>
                                     <input 
                                        type="number" 
                                        className="w-full bg-brand-500/10 border border-brand-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-brand-500 transition-all font-mono font-bold" 
                                        placeholder="150" 
                                        value={monthlyFee} 
                                        onChange={e => setMonthlyFee(e.target.value)} 
                                    />
                                    <p className="text-[10px] text-white/30 mt-2 flex items-center gap-1">
                                        <AlertCircle size={10} />
                                        Expenses stop accumulating if account fails.
                                    </p>
                                </motion.div>
                            )}
                          </AnimatePresence>
                      </div>
                      
                      <div className="pt-4">
                        <button 
                            onClick={handleSave} 
                            className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-black font-bold py-4 rounded-xl shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> Create Account
                        </button>
                      </div>
                  </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Edit Modal Placeholder - could duplicate add modal logic later */}
      <AnimatePresence>
          {isEditModalOpen && selectedAccount && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#050505]/90 w-full max-w-2xl rounded-3xl border border-white/[0.1] p-8 shadow-2xl"
                  >
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-white">Edit Account</h3>
                          <button onClick={() => setIsEditModalOpen(false)}><X size={24} className="text-white/40 hover:text-white"/></button>
                      </div>
                      
                      <div className="space-y-4">
                           <div>
                              <label className="block text-[10px] text-white/40 uppercase font-bold mb-1">Firm Name</label>
                              <input className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white" value={editFirmName} onChange={e => setEditFirmName(e.target.value)} />
                           </div>
                           <div>
                              <label className="block text-[10px] text-white/40 uppercase font-bold mb-1">Status</label>
                              <select 
                                value={selectedAccount.status} 
                                onChange={(e) => handleStatusChange(selectedAccount.id, e.target.value)}
                                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white"
                              >
                                 {Object.values(AccountStatus).map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                              </select>
                           </div>
                            <div>
                              <label className="block text-[10px] text-white/40 uppercase font-bold mb-1">Initial Cost</label>
                              <input type="number" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white" value={editCost} onChange={e => setEditCost(e.target.value)} />
                           </div>
                           
                           <button onClick={handleSaveEdit} className="w-full bg-brand-500 text-black font-bold py-3 rounded-xl mt-4">Update Account</button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};
