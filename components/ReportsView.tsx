
import React, { useState, useMemo } from 'react';
import { Trade, PropAccount, AccountStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';
import { DollarSign, Activity, Sparkles, TrendingUp, TrendingDown, CreditCard, Wallet, BrainCircuit } from 'lucide-react';
import { generateStrategyAnalysis } from '../services/geminiService';
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface Props {
  trades: Trade[];
  accounts?: PropAccount[];
}

type DateRange = 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'YTD' | 'LAST_90_DAYS';

export const ReportsView: React.FC<Props> = ({ trades, accounts = [] }) => {
  const [dateRange, setDateRange] = useState<DateRange>('ALL');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- Filtering Logic ---
  const filterDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      
      switch(dateRange) {
          case 'THIS_MONTH':
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          case 'LAST_MONTH':
              const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
          case 'YTD':
              return date.getFullYear() === now.getFullYear();
          case 'LAST_90_DAYS':
              const ninetyDaysAgo = new Date();
              ninetyDaysAgo.setDate(now.getDate() - 90);
              return date >= ninetyDaysAgo;
          default:
              return true;
      }
  };

  const filteredTrades = useMemo(() => trades.filter(t => filterDate(t.entryDate)), [trades, dateRange]);
  const filteredPayouts = useMemo(() => accounts.flatMap(a => a.payouts || []).filter(p => filterDate(p.date)), [accounts, dateRange]);

  // --- Prop Expense Calculation ---
  const propStats = useMemo(() => {
      let totalSpent = 0;
      const totalWithdrawn = filteredPayouts.reduce((acc, p) => acc + p.amount, 0);

      accounts.filter(a => filterDate(a.dateAdded)).forEach(acc => {
          // Initial Costs
          totalSpent += acc.cost;
          if (acc.activationFee) totalSpent += acc.activationFee;

          // Subscription Logic
          if (acc.isSubscription && acc.monthlyFee) {
              const start = new Date(acc.dateAdded);
              let end = new Date();
              if ((acc.status === AccountStatus.FAILED || acc.status === AccountStatus.BREACHED) && acc.dateEnded) {
                  end = new Date(acc.dateEnded);
              }
              const diffTime = Math.abs(end.getTime() - start.getTime());
              const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
              if (diffMonths > 0) totalSpent += (diffMonths * acc.monthlyFee);
          }
      });

      const evals = accounts.filter(a => a.status === AccountStatus.EVAL_PHASE_1 || a.status === AccountStatus.EVAL_PHASE_2).length;
      const funded = accounts.filter(a => a.status === AccountStatus.FUNDED).length;
      
      return { totalSpent, totalWithdrawn, evals, funded };
  }, [accounts, filteredPayouts, dateRange]);

  const setupPerformance = useMemo(() => {
      const groups: {[key: string]: {total: number, wins: number, pnl: number}} = {};
      filteredTrades.forEach(t => {
          const key = t.setup || 'No Setup';
          if (!groups[key]) groups[key] = { total: 0, wins: 0, pnl: 0 };
          groups[key].total++;
          groups[key].pnl += t.pnl;
          if (t.pnl > 0) groups[key].wins++;
      });
      return Object.keys(groups).map(key => ({
              name: key,
              winRate: (groups[key].wins / groups[key].total) * 100,
              count: groups[key].total,
              pnl: groups[key].pnl,
              expectancy: groups[key].pnl / groups[key].total
      })).sort((a, b) => b.pnl - a.pnl);
  }, [filteredTrades]);

  const handleAnalyzeStrategy = async () => {
      setIsAnalyzing(true);
      const result = await generateStrategyAnalysis(filteredTrades, dateRange);
      setAiAnalysis(result);
      setIsAnalyzing(false);
  };

  const statsCards = [
      {
          label: "Total Expenses",
          value: `$${propStats.totalSpent.toLocaleString()}`,
          icon: <CreditCard className="w-5 h-5" />,
          trend: null,
          color: "text-white"
      },
      {
          label: "Total Withdrawn",
          value: `$${propStats.totalWithdrawn.toLocaleString()}`,
          icon: <Wallet className="w-5 h-5" />,
          trend: null,
          color: "text-emerald-400"
      },
      {
          label: "Net ROI",
          value: `${propStats.totalWithdrawn - propStats.totalSpent >= 0 ? '+' : '-'}$${Math.abs(propStats.totalWithdrawn - propStats.totalSpent).toLocaleString()}`,
          icon: <TrendingUp className="w-5 h-5" />,
          trend: null,
          color: propStats.totalWithdrawn - propStats.totalSpent >= 0 ? 'text-brand-400' : 'text-rose-400'
      },
      {
          label: "Active Funded",
          value: propStats.funded.toString(),
          sub: "Accounts",
          icon: <Activity className="w-5 h-5" />,
          trend: null,
          color: "text-white"
      }
  ];

  return (
    <div className="relative w-full min-h-screen font-sans overflow-hidden -mt-8 -mx-8 p-8">
        {/* Ambient Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
            <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-yellow-500/5 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
        </div>

        <motion.div 
            className="relative z-10 space-y-10 max-w-[1600px] mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                    <motion.h1 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-4xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-1"
                    >
                        Performance Analytics
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm text-white/40"
                    >
                        Deep dive into your strategy execution and financial results
                    </motion.p>
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/[0.02] p-1 rounded-xl border border-white/[0.05] flex gap-1 backdrop-blur-md"
                >
                    {(['ALL', 'THIS_MONTH', 'LAST_MONTH', 'YTD'] as DateRange[]).map(range => (
                        <button
                            key={range}
                            onClick={() => { setDateRange(range); setAiAnalysis(null); }}
                            className={cn(
                                "px-4 py-2 text-xs font-medium rounded-lg transition-all relative",
                                dateRange === range 
                                    ? "bg-white text-black shadow-lg shadow-white/10" 
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {range.replace('_', ' ')}
                        </button>
                    ))}
                </motion.div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        className="group relative backdrop-blur-2xl bg-white/[0.02] p-6 rounded-2xl border border-white/[0.05] hover:bg-white/[0.04] transition-colors overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity scale-150 transform origin-top-right">
                            {stat.icon}
                        </div>
                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="p-2.5 bg-white/[0.05] rounded-xl text-white/70 group-hover:text-white group-hover:bg-white/10 transition-all">
                                {stat.icon}
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</p>
                            <h3 className={cn("text-2xl font-medium tracking-tight", stat.color)}>
                                {stat.value} {stat.sub && <span className="text-sm text-white/40 font-normal ml-1">{stat.sub}</span>}
                            </h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Strategy Performance Section */}
            <motion.div 
                className="w-full backdrop-blur-2xl bg-white/[0.02] rounded-3xl border border-white/[0.05] shadow-2xl overflow-hidden"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="p-8 border-b border-white/[0.05] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h3 className="text-xl font-medium text-white/90">Setup Performance</h3>
                        <p className="text-sm text-white/40 mt-1">Profitability breakdown by trading model</p>
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAnalyzeStrategy} 
                        disabled={isAnalyzing}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                            isAnalyzing 
                                ? "bg-white/[0.05] text-white/40 cursor-not-allowed" 
                                : "bg-brand-500 text-black hover:bg-brand-400 shadow-lg shadow-brand-500/20"
                        )}
                    >
                        {isAnalyzing ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>
                                <span>Analyzing...</span>
                            </div>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                <span>Generate AI Insight</span>
                            </>
                        )}
                    </motion.button>
                </div>

                {aiAnalysis && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="px-8 pt-6 pb-2"
                    >
                        <div className="bg-brand-500/5 border border-brand-500/10 p-6 rounded-2xl">
                            <div className="flex items-center gap-2 text-brand-500 mb-3 text-xs font-bold uppercase tracking-wider">
                                <BrainCircuit size={14}/> AI Strategy Insight
                            </div>
                            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
                        </div>
                    </motion.div>
                )}

                <div className="overflow-x-auto p-2">
                    <table className="w-full text-left border-collapse">
                        <thead className="text-xs font-medium text-white/40 uppercase">
                            <tr>
                                <th className="py-4 pl-6 font-medium">Setup Model</th>
                                <th className="py-4 font-medium">Count</th>
                                <th className="py-4 font-medium">Win Rate</th>
                                <th className="py-4 text-right font-medium">Net P&L</th>
                                <th className="py-4 text-right pr-6 font-medium">Exp. Value</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {setupPerformance.map((setup, idx) => (
                                <motion.tr 
                                    key={setup.name} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                    className="hover:bg-white/[0.03] transition-colors group border-b border-white/[0.02] last:border-0"
                                >
                                    <td className="py-5 pl-6 text-white/90 font-medium text-base">
                                        {setup.name}
                                    </td>
                                    <td className="py-5 text-white/60 font-mono">{setup.count}</td>
                                    <td className="py-5 w-1/3 pr-8">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono font-medium w-8 text-white/60">{setup.winRate.toFixed(0)}%</span>
                                            <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${setup.winRate}%` }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                    className="h-full bg-brand-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" 
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className={cn(
                                        "py-5 text-right font-mono font-medium text-base",
                                        setup.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    )}>
                                        ${setup.pnl.toLocaleString()}
                                    </td>
                                    <td className="py-5 text-right font-mono text-white/60 pr-6">
                                        ${setup.expectancy.toFixed(0)}
                                    </td>
                                </motion.tr>
                            ))}
                            {setupPerformance.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-white/30 italic">
                                        No trades recorded for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    </div>
  );
};
