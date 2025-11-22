import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartPoint } from '../types';

interface Props {
  data: ChartPoint[]; // Raw daily data passed in
}

type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-3 rounded-lg shadow-2xl z-50">
        <p className="text-white/40 font-mono text-[10px] mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-brand-500 font-bold font-mono text-lg">
          ${payload[0].value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </p>
      </div>
    );
  }
  return null;
};

export const PnLChart: React.FC<Props> = ({ data }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('Daily');

  const processedData = useMemo(() => {
      if (timeframe === 'Daily') return data;

      if (timeframe === 'Weekly') {
          return data.filter((_, index) => index % 5 === 0 || index === data.length - 1);
      }
      if (timeframe === 'Monthly') {
          return data.filter((_, index) => index % 20 === 0 || index === data.length - 1);
      }
      
      return data;
  }, [data, timeframe]);

  return (
    <div className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] p-4 md:p-6 rounded-2xl h-[300px] md:h-[450px] relative overflow-hidden flex flex-col shadow-2xl group transition-all">
      <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
         <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-brand-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
            <h3 className="text-base md:text-lg font-bold text-white/90 tracking-tight">Equity Curve</h3>
         </div>
         <div className="flex gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/[0.05]">
             {['Daily', 'Weekly', 'Monthly'].map((tf) => (
                 <button
                    key={tf}
                    onClick={() => setTimeframe(tf as Timeframe)}
                    className={`px-2 md:px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                        timeframe === tf 
                        ? 'bg-brand-500 text-black shadow-lg shadow-brand-500/20' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                 >
                     {tf}
                 </button>
             ))}
         </div>
      </div>
      
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} strokeOpacity={0.2} />
            <XAxis 
              dataKey="date" 
              stroke="#525252" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
              tickMargin={5}
              tick={{ fill: '#525252' }}
            />
            <YAxis 
              stroke="#525252" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `$${value}`}
              tick={{ fill: '#525252' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area 
              type="monotone" 
              dataKey="cumulativePnl" 
              stroke="#f59e0b" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorPnl)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#fff', stroke: '#f59e0b' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};