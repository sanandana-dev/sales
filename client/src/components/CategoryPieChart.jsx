import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { PieChart as PieIcon } from 'lucide-react';

const CATEGORY_COLORS = {
  'Electronics': '#3b82f6',     // Blue
  'Office': '#10b981',          // Emerald
  'Apparel': '#8b5cf6',         // Purple
  'Home & Kitchen': '#f59e0b',  // Amber
};

const FALLBACK_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const formatCur = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/50 backdrop-blur-md text-xs min-w-[160px]">
      <p className="font-bold text-slate-100 mb-1">{data.category}</p>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-400">Revenue:</span>
          <span className="font-bold text-blue-400">{formatCur(data.revenue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Share of Total:</span>
          <span className="font-semibold text-emerald-400">{data.revenueSharePct}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Profit Margin:</span>
          <span className="font-semibold text-amber-300">{data.profitMargin}%</span>
        </div>
        <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
          <span>Units Sold:</span>
          <span className="text-slate-200">{data.unitsSold}</span>
        </div>
      </div>
    </div>
  );
}

export default function CategoryPieChart({ categories = [], loading }) {
  const { theme } = useTheme();

  const getColor = (category, index) => {
    return CATEGORY_COLORS[category] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  };

  const totalRev = categories.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const formatCur = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors flex flex-col justify-between">
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-purple-500" />
            Revenue by Category
          </h2>
          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/40">
            {categories.length} Segments
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Share of total business revenue across departments
        </p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
          No category data available.
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Donut Chart with center label */}
          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={categories}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {categories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getColor(entry.category, index)}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Total</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{formatCur(totalRev)}</span>
            </div>
          </div>

          {/* Clean custom legend list */}
          <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {categories.map((cat, idx) => {
              const color = getColor(cat.category, idx);
              return (
                <div key={cat.category} className="flex items-center justify-between text-xs p-1 rounded-lg">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    ></span>
                    <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                      {cat.category}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 ml-1">
                    {cat.revenueSharePct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
