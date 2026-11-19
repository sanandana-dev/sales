import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import analytics from '../../../shared/analytics';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const formatCur = val => analytics.formatCurrency(val, { maximumFractionDigits: 0 });

  return (
    <div className="bg-[#151927]/95 text-white p-3 rounded-xl shadow-xl border border-[#27314C] backdrop-blur-md text-xs min-w-[170px]">
      <div className="font-semibold text-slate-200 border-b border-[#27314C] pb-1.5 mb-2 flex items-center justify-between">
        <span>{data.label || label}</span>
        <span className="text-[10px] text-slate-400 font-normal">
          {data.salesCount || 0} orders
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center text-[#FF901E] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#FF901E] mr-1.5" />
            Revenue:
          </span>
          <span className="font-bold text-white tabular-nums">{formatCur(data.revenue)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center text-[#60A5FA] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] mr-1.5" />
            Profit:
          </span>
          <span className="font-bold text-white tabular-nums">{formatCur(data.profit)}</span>
        </div>
        {data.profitMargin !== undefined && (
          <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-[#27314C] text-[11px]">
            <span>Profit Margin:</span>
            <span className="font-semibold text-[#159B67]">{data.profitMargin}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MainRevenueProfitChart({
  trendData = [],
  range = 'monthly',
  setRange,
  loading = false
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const hasData = Boolean(
    trendData && trendData.length > 0 && trendData.some(d => (d.revenue || 0) > 0)
  );
  const displayData = hasData ? trendData : [];

  const formatYAxis = val => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  return (
    <div className="bg-white dark:bg-[#151927] border border-[#E2E8F0] dark:border-[#1E2436] rounded-2xl p-5 shadow-xs transition-colors flex flex-col justify-between">
      {/* Top Header: Title & Time Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-[#172033] dark:text-white tracking-tight">
            Revenue & Profit Trend
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#8E9DB2] mt-0.5">
            Track your business performance over time.
          </p>
        </div>

        {/* Time filters: Monthly, Weekly, Yearly */}
        <div className="inline-flex p-1 bg-[#F1F5F9] dark:bg-[#1B2236] rounded-xl self-start sm:self-auto text-xs">
          {['monthly', 'weekly', 'yearly'].map(interval => (
            <button
              key={interval}
              onClick={() => setRange(interval)}
              className={`px-3 py-1 font-semibold capitalize rounded-lg transition-all ${
                range === interval
                  ? 'bg-[#FF901E] text-white shadow-xs'
                  : 'text-[#64748B] dark:text-[#8E9DB2] hover:text-[#172033] dark:hover:text-white'
              }`}
            >
              {interval}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Legend indicators */}
      <div className="flex items-center space-x-4 mb-3 text-xs">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF901E]" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Revenue</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#152B4A] dark:bg-[#60A5FA]" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Profit</span>
        </div>
      </div>

      {/* Main Chart Canvas */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF901E]" />
        </div>
      ) : !hasData ? (
        <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-[#27314C] rounded-xl bg-slate-50/50 dark:bg-[#1B2236]/40">
          <div className="w-10 h-10 rounded-full bg-[#FF901E]/10 text-[#FF901E] flex items-center justify-center mb-2.5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No sales recorded for this period
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Import an Excel or CSV file, or click &quot;Record Sale&quot; to begin tracking revenue
            and profit trends.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF901E" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FF901E" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#152B4A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#152B4A" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? '#27314C' : '#F1F5F9'}
                opacity={0.9}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: isDark ? '#8E9DB2' : '#64748B', fontSize: 11 }}
                axisLine={{ stroke: isDark ? '#27314C' : '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fill: isDark ? '#8E9DB2' : '#64748B', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Revenue Series: Orange #FF901E */}
              <Area type="monotone" dataKey="revenue" fill="url(#colorRevenue)" stroke="none" />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#FF901E"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#FF901E', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                activeDot={{ r: 5, fill: '#FF901E', stroke: '#FFFFFF', strokeWidth: 2 }}
              />

              {/* Profit Series: Dark Navy #152B4A / #3B82F6 in dark mode */}
              <Area type="monotone" dataKey="profit" fill="url(#colorProfit)" stroke="none" />
              <Line
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke={isDark ? '#60A5FA' : '#152B4A'}
                strokeWidth={2.5}
                dot={{
                  r: 3.5,
                  fill: isDark ? '#60A5FA' : '#152B4A',
                  strokeWidth: 1.5,
                  stroke: '#FFFFFF'
                }}
                activeDot={{
                  r: 5,
                  fill: isDark ? '#60A5FA' : '#152B4A',
                  stroke: '#FFFFFF',
                  strokeWidth: 2
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
