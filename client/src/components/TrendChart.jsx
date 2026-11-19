import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const formatCur = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700/50 backdrop-blur-md text-xs min-w-[180px]">
      <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
        <span>{data.label || label}</span>
        <span className="text-[11px] text-slate-400 font-normal">{data.salesCount} orders</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-blue-400">
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
            Revenue:
          </span>
          <span className="font-bold text-white">{formatCur(data.revenue)}</span>
        </div>
        <div className="flex items-center justify-between text-emerald-400">
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
            Gross Profit:
          </span>
          <span className="font-bold text-white">{formatCur(data.profit)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
          <span>Profit Margin:</span>
          <span className="font-semibold text-amber-300">{data.profitMargin}%</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Units Sold:</span>
          <span className="font-medium text-slate-200">{data.unitsSold}</span>
        </div>
      </div>
    </div>
  );
}

export default function TrendChart({ data = [], range, setRange, loading }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const formatYAxis = (val) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Revenue & Profit Trend
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historical sales trajectory and profitability over time
          </p>
        </div>

        {/* Weekly / Monthly toggle */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setRange('monthly')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              range === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setRange('weekly')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              range === 'weekly'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-72 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-sm">
          <p>No sales records found for this period.</p>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? '#334155' : '#e2e8f0'}
                opacity={0.6}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Gross Profit"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
