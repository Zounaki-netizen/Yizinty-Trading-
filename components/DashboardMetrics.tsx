import React from 'react';
import { Metrics } from '../types';
import { ArrowUpRight, ArrowDownRight, DollarSign, Crosshair, BarChart2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  metrics: Metrics;
}

const MetricCard = ({ label, value, subValue, isCurrency, isPositive, icon: Icon, index }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative overflow-hidden p-4 md:p-6 rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.04] transition-all duration-300 group"
    >
      {/* Subtle Gradient Overlay */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${
          isPositive ? 'from-emerald-500/5 to-transparent' : 'from-rose-500/5 to-transparent'
      }`} />

      <div className="flex justify-between items-start mb-3 md:mb-4 relative z-10">
        {/* Icon Box */}
        <div className={`p-2 md:p-3 rounded-xl border backdrop-blur-md transition-colors
          ${isPositive 
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' 
            : 'bg-rose-500/10 text-rose-500 border-rose-500/10'
          }`}
        >
          <Icon size={16} className="md:w-5 md:h-5" strokeWidth={2} />
        </div>
        
        {/* Trend Badge */}
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border backdrop-blur-sm
          ${isPositive 
            ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' 
            : 'bg-rose-500/5 text-rose-500 border-rose-500/10'
          }`}
        >
          {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          <span className="hidden md:inline">2.5%</span>
        </span>
      </div>
      
      <div className="relative z-10">
        <p className="text-white/40 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-1 truncate">{label}</p>
        <h3 className="text-lg md:text-2xl font-medium text-white/90 tracking-tight font-sans mb-1 truncate">
            {isCurrency 
                ? (value < 0 ? '-' : '') + '$' + Math.abs(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) 
                : value
            }
        </h3>
        
        {subValue && (
             <p className="text-[10px] md:text-xs font-medium text-white/40 truncate">
                {subValue}
             </p>
        )}
      </div>
    </motion.div>
  );
};

export const DashboardMetrics: React.FC<Props> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
      <MetricCard 
        index={0}
        label="Net P&L" 
        value={metrics.netPnl} 
        isCurrency={true} 
        isPositive={metrics.netPnl >= 0}
        icon={DollarSign}
        subValue="Realized"
      />
      <MetricCard 
        index={1}
        label="Win Rate" 
        value={metrics.winRate + '%'} 
        isCurrency={false} 
        isPositive={metrics.winRate >= 50}
        icon={Crosshair}
        subValue={`${metrics.totalTrades} Trades`}
      />
      <MetricCard 
        index={2}
        label="Profit Factor" 
        value={metrics.profitFactor.toFixed(2)} 
        isCurrency={false} 
        isPositive={metrics.profitFactor >= 1.5}
        icon={BarChart2}
        subValue={`Avg: $${metrics.avgWin.toFixed(0)}`}
      />
      <MetricCard 
        index={3}
        label="Streak" 
        value={metrics.currentStreak} 
        isCurrency={false} 
        isPositive={metrics.currentStreak > 0}
        icon={Zap}
        subValue="Consecutive"
      />
    </div>
  );
};