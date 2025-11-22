
import React, { useState, useRef, useMemo } from 'react';
import { PropAccount, AccountStatus, Trade } from '../types';
import { Plus, Wallet, TrendingUp, DollarSign, X, Upload, Trash2, History, Eye, PenSquare, Clock, Filter, CreditCard, Check, AlertCircle, Calendar, Save } from 'lucide-react';
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
                             <button onClick={() => window.open(account.certificate)} className="w-full text-[10px] text-brand-500 font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:underline">
                                <Upload size={10} /> View Certificate
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
      
      {/* (Other modals would follow similar logic) */}
    </div>
  );
};
