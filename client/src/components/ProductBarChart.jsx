import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { Award, Trophy } from 'lucide-react';

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const formatCur = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/50 backdrop-blur-md text-xs min-w-[170px]">
      <p className="font-bold text-slate-100 mb-1">{data.name}</p>
      <p className="text-[11px] text-slate-400 mb-2">Category: {data.category}</p>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-blue-400 font-medium">Revenue:</span>
          <span className="font-bold">{formatCur(data.totalRevenue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-emerald-400 font-medium">Profit:</span>
          <span className="font-bold">{formatCur(data.totalProfit)}</span>
        </div>
        <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
          <span>Units Sold:</span>
          <span className="font-medium text-white">{data.unitsSold}</span>
        </div>
        <div className="flex justify-between text-amber-300">
          <span>Profit Margin:</span>
          <span className="font-semibold">{data.profitMargin}%</span>
        </div>
      </div>
    </div>
  );
}

export default function ProductBarChart({ products = [], loading }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Get top 5 by revenue
  const top5 = [...products]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)
    .map(p => ({
      ...p,
      // Short name for axis readability
      shortName: p.name.length > 18 ? p.name.slice(0, 16) + '...' : p.name
    }));

  const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

  const formatYAxis = (val) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors flex flex-col justify-between">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Top 5 Products by Revenue
          </h2>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/40">
            Leaders
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Highest performing inventory generating majority of gross receipts
        </p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : top5.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
          No product data available.
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top5}
              layout="vertical"
              margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke={isDark ? '#334155' : '#e2e8f0'}
                opacity={0.6}
              />
              <XAxis
                type="number"
                tickFormatter={formatYAxis}
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                tick={{ fill: isDark ? '#cbd5e1' : '#334155', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalRevenue" radius={[0, 6, 6, 0]} barSize={18}>
                {top5.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
