
import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DashboardMetrics } from './components/DashboardMetrics';
import { PnLChart } from './components/Charts';
import { JournalView } from './components/JournalView';
import { TradeModal } from './components/TradeModal';
import { AddTradeModal } from './components/AddTradeModal';
import { FundedAccountsView } from './components/FundedAccountsView';
import { ICTEngineView } from './components/ICTEngineView';
import { ReportsView } from './components/ReportsView';
import { MOCK_TRADES, MOCK_CHART_DATA, MOCK_ACCOUNTS, FIRM_LOGOS } from './constants';
import { Trade, Metrics, ChartPoint, Outcome, PropAccount, AccountStatus } from './types';
import { Filter, Target, Wallet, BarChart3, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { SettingsModal } from './components/SettingsModal';

type DashboardFilter = 'TODAY' | 'LAST_WEEK' | 'LAST_MONTH' | 'ALL';

const AuthenticatedApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilter>('ALL');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // --- DATA ISOLATION LOGIC ---
  // Generate storage keys specific to the logged-in user
  const tradesStorageKey = user ? `yizinity_trades_${user.email}` : 'yizinity_trades_demo';
  const accountsStorageKey = user ? `yizinity_accounts_${user.email}` : 'yizinity_accounts_demo';

  // --- Trades State ---
  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
        const saved = localStorage.getItem(tradesStorageKey);
        // CRITICAL: If new user (no saved data), start EMPTY. Do not show MOCK data.
        // Only use mocks if it's explicitly a demo user or undefined (shouldn't happen with Auth)
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  // --- Accounts State ---
  const [accounts, setAccounts] = useState<PropAccount[]>(() => {
      try {
          const saved = localStorage.getItem(accountsStorageKey);
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          return [];
      }
  });

  // Update state when user changes (e.g. logout/login)
  useEffect(() => {
      const savedTrades = localStorage.getItem(tradesStorageKey);
      setTrades(savedTrades ? JSON.parse(savedTrades) : []);

      const savedAccounts = localStorage.getItem(accountsStorageKey);
      setAccounts(savedAccounts ? JSON.parse(savedAccounts) : []);
  }, [tradesStorageKey, accountsStorageKey]);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem(tradesStorageKey, JSON.stringify(trades));
  }, [trades, tradesStorageKey]);

  useEffect(() => {
      localStorage.setItem(accountsStorageKey, JSON.stringify(accounts));
  }, [accounts, accountsStorageKey]);

  const handleClearData = () => {
      setTrades([]);
      setAccounts([]);
      localStorage.removeItem(tradesStorageKey);
      localStorage.removeItem(accountsStorageKey);
  };

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null); // State for editing
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- Filter Trades for Dashboard Metrics ---
  const filteredTrades = useMemo(() => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      return trades.filter(t => {
          const tDate = new Date(t.entryDate);
          switch(dashboardFilter) {
              case 'TODAY':
                  return tDate >= startOfDay;
              case 'LAST_WEEK':
                   const lastWeek = new Date(now);
                   lastWeek.setDate(now.getDate() - 7);
                   return tDate >= lastWeek;
              case 'LAST_MONTH':
                  return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
              default:
                  return true;
          }
      });
  }, [trades, dashboardFilter]);

  // Calculate Metrics dynamically based on FILTERED trades
  const metrics = useMemo((): Metrics => {
    let totalTrades = filteredTrades.length;
    let wins = filteredTrades.filter(t => t.pnl > 0).length;
    let losses = filteredTrades.filter(t => t.pnl <= 0).length; 
    let netPnl = filteredTrades.reduce((acc, t) => acc + t.pnl, 0);
    
    let grossProfit = filteredTrades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
    let grossLoss = Math.abs(filteredTrades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));

    let profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
    let avgWin = wins > 0 ? grossProfit / wins : 0;
    let avgLoss = losses > 0 ? grossLoss / losses : 0;

    // Current streak (Always calculated on ALL trades sorted by date)
    let currentStreak = 0;
    const allSortedTrades = [...trades].sort((a, b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime());
    for (let trade of allSortedTrades) {
        if (trade.pnl > 0) currentStreak++;
        else break;
    }

    let bestDay = Math.max(...filteredTrades.map(t => t.pnl), 0);
    let worstDay = Math.min(...filteredTrades.map(t => t.pnl), 0);

    return {
      totalTrades,
      winRate: totalTrades > 0 ? parseFloat(((wins / totalTrades) * 100).toFixed(1)) : 0,
      netPnl, 
      profitFactor,
      avgWin,
      avgLoss,
      bestDay,
      worstDay,
      currentStreak
    };
  }, [filteredTrades, trades]);

  const chartData = useMemo((): ChartPoint[] => {
    const sorted = [...filteredTrades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
    let cumulative = 0;
    const data: ChartPoint[] = [];
    const groupedByDay: {[key: string]: number} = {};
    
    sorted.forEach(trade => {
        const date = new Date(trade.entryDate).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
        groupedByDay[date] = (groupedByDay[date] || 0) + trade.pnl;
    });

    Object.keys(groupedByDay).forEach(date => {
        cumulative += groupedByDay[date];
        data.push({
            date,
            pnl: groupedByDay[date],
            cumulativePnl: cumulative
        });
    });

    if (data.length === 0) return [];
    return data;
  }, [filteredTrades]);


  const handleSaveTrade = (newTrades: Trade[]) => {
    if (newTrades.length === 1) {
        const exists = trades.some(t => t.id === newTrades[0].id);
        if (exists) {
            setTrades(prev => prev.map(t => t.id === newTrades[0].id ? newTrades[0] : t));
            return;
        }
    }
    setTrades(prev => [...newTrades, ...prev]);
  };

  const handleEditTrade = (trade: Trade) => {
      setTradeToEdit(trade);
      setIsAddModalOpen(true);
  };

  const handleUpdateTradeFromModal = (updatedTrade: Trade) => {
    setTrades(prev => prev.map(t => t.id === updatedTrade.id ? updatedTrade : t));
    setSelectedTrade(updatedTrade);
  };

  const handleDeleteTrade = (id: string) => {
      if(window.confirm("Are you sure you want to delete this trade?")) {
          setTrades(prev => prev.filter(t => t.id !== id));
          setSelectedTrade(null);
      }
  };

  const handleAddAccount = (newAccount: PropAccount) => {
      setAccounts(prev => [...prev, newAccount]);
  };

  const handleUpdateAccount = (updatedAccount: PropAccount) => {
      setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a));
  };

  const handleDeleteAccount = (id: string) => {
      setAccounts(prev => prev.filter(a => a.id !== id));
  };

  // --- Accurate Prop Expense Calculation ---
  const propStats = useMemo(() => {
      let totalCost = 0;
      const totalPayouts = accounts.reduce((acc, a) => acc + a.totalPayouts, 0);

      accounts.forEach(acc => {
          totalCost += acc.cost;
          if (acc.activationFee && acc.dateFunded) {
              totalCost += acc.activationFee;
          }
          if (acc.isSubscription && acc.monthlyFee) {
              const startDate = new Date(acc.dateAdded);
              let endDate = new Date();
              if ((acc.status === AccountStatus.FAILED || acc.status === AccountStatus.BREACHED) && acc.dateEnded) {
                  endDate = new Date(acc.dateEnded);
              } else if (acc.dateFunded) {
                  if (acc.dateEnded) endDate = new Date(acc.dateEnded);
              }
              const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
              const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
              if (diffMonths > 0) {
                  totalCost += (diffMonths * acc.monthlyFee);
              }
          }
      });

      return { totalCost, totalPayouts };
  }, [accounts]);

  const activeEvals = useMemo(() => {
      return accounts.filter(a => 
          a.status === AccountStatus.EVAL_PHASE_1 || 
          a.status === AccountStatus.EVAL_PHASE_2
      ).map(acc => {
          const accTrades = trades.filter(t => t.accountId === acc.id);
          const currentPnl = accTrades.reduce((sum, t) => sum + t.pnl, 0);
          
          let targetPnl = 0;
          if (acc.targetProfit && acc.targetProfit > 0) {
              targetPnl = acc.targetProfit;
          } else {
              const targetPct = acc.status === AccountStatus.EVAL_PHASE_1 ? 0.10 : 0.05;
              targetPnl = acc.accountSize * targetPct;
          }
          const progress = Math.min(Math.max((currentPnl / targetPnl) * 100, 0), 100); 
          return { ...acc, currentPnl, targetPnl, progress };
      });
  }, [accounts, trades]);
  
  const getFirmLogo = (name: string) => {
      const lowerName = name.toLowerCase();
      const key = Object.keys(FIRM_LOGOS).find(k => lowerName.includes(k));
      return key ? FIRM_LOGOS[key] : null;
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onAddTrade={() => {
          setTradeToEdit(null);
          setIsAddModalOpen(true);
      }}
      onOpenSettings={() => setIsSettingsOpen(true)}
    >
      {activeTab === 'dashboard' && (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
          {/* Empty State Welcome for New Users */}
          {trades.length === 0 && accounts.length === 0 ? (
               <div className="relative w-full min-h-[65vh] flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/[0.05] bg-[#0A0A0B] p-8">
                  {/* Ambient Background Elements */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full mix-blend-normal filter blur-[120px] animate-pulse pointer-events-none" />
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none"></div>
                  <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                  <div className="relative z-10 flex flex-col items-center text-center max-w-3xl">
                      
                      {/* Logo Animation */}
                      <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="mb-10 relative"
                      >
                          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-brand-500 to-orange-600 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.2)] border border-white/10 relative overflow-hidden group">
                               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                               <span className="font-black text-5xl text-black italic tracking-tighter">YZ</span>
                          </div>
                          
                          {/* Floating Icons */}
                           <motion.div 
                              animate={{ y: [0, -10, 0] }} 
                              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                              className="absolute -top-6 -right-8 bg-[#1A1A1A] border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md"
                          >
                              <Target size={20} className="text-emerald-500" />
                          </motion.div>
                          <motion.div 
                              animate={{ y: [0, 10, 0] }} 
                              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                              className="absolute -bottom-4 -left-10 bg-[#1A1A1A] border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md"
                          >
                              <BarChart3 size={20} className="text-brand-500" />
                          </motion.div>
                      </motion.div>

                      <motion.h1 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6"
                      >
                          Welcome to the <br />
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-orange-400 to-brand-200">Elite Circle, {user?.name}</span>
                      </motion.h1>

                      <motion.p 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-lg text-white/40 font-medium mb-12 max-w-xl leading-relaxed"
                      >
                          Your professional trading journal is ready. Connect your funded accounts or log your first trade to unlock Yizinity's AI-powered analytics engine.
                      </motion.p>

                      <motion.div 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto"
                      >
                           <button 
                              onClick={() => setIsAddModalOpen(true)} 
                              className="group relative px-8 py-4 bg-brand-500 text-black rounded-xl font-bold text-sm overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center justify-center gap-3"
                          >
                              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                              <Plus size={20} strokeWidth={3} className="relative z-10" />
                              <span className="relative z-10 tracking-wide">LOG FIRST TRADE</span>
                           </button>

                           <button 
                              onClick={() => setActiveTab('funded')} 
                              className="group px-8 py-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white rounded-xl font-bold text-sm transition-all hover:border-brand-500/50 flex items-center justify-center gap-3 backdrop-blur-sm"
                          >
                              <Wallet size={20} className="text-white/40 group-hover:text-white transition-colors" />
                              <span className="tracking-wide">ADD ACCOUNT</span>
                          </button>
                      </motion.div>
                  </div>
               </div>
          ) : (
            <>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white/90">Dashboard</h2>
                    <div className="flex gap-2 bg-white/[0.02] p-1 rounded-lg border border-white/[0.05]">
                        {(['TODAY', 'LAST_WEEK', 'LAST_MONTH', 'ALL'] as DashboardFilter[]).map(filter => (
                            <button
                                key={filter}
                                onClick={() => setDashboardFilter(filter)}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${
                                    dashboardFilter === filter 
                                    ? 'bg-brand-500 text-black' 
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {filter.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <DashboardMetrics metrics={metrics} />
                
                {activeEvals.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeEvals.map((acc, idx) => {
                            const logo = getFirmLogo(acc.firmName);
                            return (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 + 0.3 }}
                                key={acc.id} 
                                className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] p-6 rounded-2xl relative group overflow-hidden hover:bg-white/[0.04] transition-all"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        {logo ? (
                                            <img src={logo} alt={acc.firmName} className="w-8 h-8 rounded-lg bg-white object-cover shadow-md" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                                                <Target size={16} />
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="text-sm font-bold text-white/90">{acc.firmName}</h4>
                                            <p className="text-[10px] text-white/40 font-bold uppercase">{acc.status === AccountStatus.EVAL_PHASE_1 ? 'Phase 1' : 'Phase 2'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-white/40">${(acc.accountSize/1000).toFixed(0)}k</span>
                                    </div>
                                </div>
                                
                                <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 mb-3">
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                                        style={{ width: `${acc.progress}%` }}
                                    ></div>
                                </div>
                                
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-white/40 font-bold uppercase mb-0.5">Current P&L</p>
                                        <p className={`text-sm font-mono font-bold ${acc.currentPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            ${acc.currentPnl.toFixed(0)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-white/40 font-bold uppercase mb-0.5">Target</p>
                                        <p className="text-sm font-mono font-bold text-white/80">
                                            ${acc.targetPnl.toFixed(0)} <span className="text-brand-500 text-xs">({acc.progress.toFixed(1)}%)</span>
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );})}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    <motion.div className="lg:col-span-2">
                        {chartData.length > 0 ? (
                             <PnLChart data={chartData} />
                        ) : (
                            <div className="h-[450px] backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-center text-white/20 flex-col gap-4">
                                <BarChart3 size={40} />
                                <p className="text-sm font-medium">Not enough data to display chart</p>
                            </div>
                        )}
                    </motion.div>
                    <motion.div className="h-full">
                        <div className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] p-8 rounded-2xl relative overflow-hidden h-full flex flex-col justify-between shadow-2xl group">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-1 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    <h3 className="text-lg font-bold text-white/90 tracking-tight">Prop Firm Overview</h3>
                                </div>
                                <div className="space-y-8 relative z-10">
                                    <div>
                                        <p className="text-white/40 text-[10px] uppercase font-bold mb-1 flex items-center gap-2">Total Expenses</p>
                                        <h4 className="text-3xl font-bold text-white tracking-tighter font-mono">${propStats.totalCost.toLocaleString()}</h4>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-[10px] uppercase font-bold mb-1">Total Payouts</p>
                                        <h4 className="text-3xl font-bold text-emerald-500 tracking-tighter font-mono shadow-emerald-500/20 drop-shadow-lg">${propStats.totalPayouts.toLocaleString()}</h4>
                                    </div>
                                </div>
                            </div>
                            <div className="relative z-10 mt-8 pt-8 border-t border-white/[0.05]">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-white/40 text-[10px] uppercase font-bold mb-1">Net Profit</p>
                                        <p className={`text-2xl font-bold font-mono tracking-tight ${propStats.totalPayouts - propStats.totalCost >= 0 ? 'text-brand-500' : 'text-rose-500'}`}>
                                            {propStats.totalPayouts - propStats.totalCost >= 0 ? '+' : ''}${(propStats.totalPayouts - propStats.totalCost).toLocaleString()}
                                        </p>
                                    </div>
                                    <button onClick={() => setActiveTab('funded')} className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors border border-white/5 flex items-center gap-2">
                                        <Wallet size={14} /> Manage
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white/90">Recent Activity</h3>
                        <button onClick={() => setActiveTab('journal')} className="text-brand-500 text-sm hover:underline font-bold">View Journal</button>
                    </div>
                    <JournalView 
                        trades={trades.slice(0, 5)} 
                        onSelectTrade={setSelectedTrade} 
                        onEditTrade={handleEditTrade}
                        onDeleteTrade={handleDeleteTrade}
                    />
                </div>
            </>
          )}
        </motion.div>
      )}

      {activeTab === 'journal' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <JournalView 
            trades={trades} 
            onSelectTrade={setSelectedTrade} 
            onEditTrade={handleEditTrade}
            onDeleteTrade={handleDeleteTrade}
          />
        </motion.div>
      )}

      {activeTab === 'funded' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <FundedAccountsView 
                accounts={accounts}
                trades={trades} 
                onAddAccount={handleAddAccount}
                onUpdateAccount={handleUpdateAccount}
                onDeleteAccount={handleDeleteAccount}
              />
          </motion.div>
      )}

      {activeTab === 'ict-engine' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ICTEngineView trades={trades} accounts={accounts} />
          </motion.div>
      )}

      {activeTab === 'reports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ReportsView trades={trades} accounts={accounts} />
          </motion.div>
      )}

      {/* VIEW Modal */}
      {selectedTrade && (
        <TradeModal 
          trade={selectedTrade} 
          onClose={() => setSelectedTrade(null)} 
          onUpdate={handleUpdateTradeFromModal}
          onEdit={() => {
              setTradeToEdit(selectedTrade);
              setIsAddModalOpen(true);
          }}
        />
      )}

      {/* ADD / EDIT Modal */}
      {isAddModalOpen && (
        <AddTradeModal 
          initialData={tradeToEdit || undefined}
          accounts={accounts}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveTrade}
        />
      )}

      {/* SETTINGS Modal */}
      {isSettingsOpen && (
        <SettingsModal 
            onClose={() => setIsSettingsOpen(false)}
            onClearData={handleClearData}
        />
      )}

    </Layout>
  );
}

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  if (!isAuthenticated) {
    return authView === 'login' 
      ? <LoginPage onSwitchToSignup={() => setAuthView('signup')} /> 
      : <SignUpPage onSwitchToLogin={() => setAuthView('login')} />;
  }

  return <AuthenticatedApp />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
