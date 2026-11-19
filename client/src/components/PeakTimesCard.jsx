import React, { useState } from 'react';
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
import { Clock, Users, Tag } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import analytics from '../../../shared/analytics';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const formatCur = val => analytics.formatCurrency(val, { maximumFractionDigits: 0 });

  return (
    <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/50 backdrop-blur-md text-xs min-w-[150px]">
      <p className="font-bold text-slate-100 mb-1">{data.day || data.label || label}</p>
      <div className="space-y-1">
        <div className="flex justify-between text-blue-400">
          <span>Revenue:</span>
          <span className="font-bold text-white">{formatCur(data.revenue)}</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Orders:</span>
          <span className="font-medium text-white">{data.orders}</span>
        </div>
        {data.avgTicket > 0 && (
          <div className="flex justify-between text-emerald-400 pt-1 border-t border-slate-800">
            <span>Avg Order:</span>
            <span className="font-semibold text-white">${data.avgTicket}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PeakTimesCard({ peakData, loading }) {
  const [viewMode, setViewMode] = useState('days'); // 'days' or 'hours'
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm h-80 flex items-center justify-center animate-pulse">
        <div className="text-xs text-slate-400">Loading peak hours analytics...</div>
      </div>
    );
  }

  const chartData = viewMode === 'days' ? peakData?.dayData || [] : peakData?.hoursData || [];

  const formatYAxis = val => {
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>When Am I Busiest? (Peak Hours & Days)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Staff scheduling & customer foot traffic timing helper
            </p>
          </div>

          {/* Toggle Days vs Hours */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto text-xs">
            <button
              onClick={() => setViewMode('days')}
              className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                viewMode === 'days'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Day of Week
            </button>
            <button
              onClick={() => setViewMode('hours')}
              className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                viewMode === 'hours'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hour of Day
            </button>
          </div>
        </div>

        {/* Actionable Insights Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-start space-x-2 text-xs">
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-indigo-900 dark:text-indigo-200 block">
                Staffing Helper (Peak: {peakData?.busiestDay} ~ {peakData?.busiestHour})
              </span>
              <span className="text-indigo-700 dark:text-indigo-300 text-[11px]">
                {peakData?.staffingTip || 'Schedule extra floor staff during peak volume window.'}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 flex items-start space-x-2 text-xs">
            <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200 block">
                Happy Hour Opportunity (Slowest: {peakData?.slowestDay} ~ {peakData?.slowestHour})
              </span>
              <span className="text-amber-700 dark:text-amber-300 text-[11px]">
                {peakData?.promotionTip ||
                  'Run flash offers or discount specials during slow lulls.'}
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? '#334155' : '#e2e8f0'}
                opacity={0.6}
              />
              <XAxis
                dataKey={viewMode === 'days' ? 'shortDay' : 'label'}
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {chartData.map((entry, index) => {
                  const isPeak =
                    viewMode === 'days'
                      ? entry.day === peakData?.busiestDay
                      : entry.label === peakData?.busiestHour;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isPeak ? '#6366f1' : isDark ? '#3b82f6' : '#60a5fa'}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
