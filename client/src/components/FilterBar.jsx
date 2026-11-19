import React from 'react';
import { Calendar, Filter, RotateCcw, RefreshCw } from 'lucide-react';

export default function FilterBar({
  rangePreset,
  setRangePreset,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  category,
  setCategory,
  categories = [],
  onRefresh,
  isRefreshing,
  onReset
}) {
  const presets = [
    { id: 'all', label: 'All Time' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last 90 Days' },
    { id: '12m', label: 'Last 12 Months' },
    { id: 'custom', label: 'Custom' }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-6 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date presets & custom picker */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            Time Range:
          </div>
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-x-1">
            {presets.map(p => {
              const active = rangePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setRangePreset(p.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    active
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Inputs if 'custom' selected */}
          {rangePreset === 'custom' && (
            <div className="flex items-center space-x-2 pl-2">
              <input
                type="date"
                value={startDate || ''}
                onChange={e => setStartDate(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate || ''}
                onChange={e => setEndDate(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Right filters: Category & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="text-xs font-medium bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {(rangePreset !== 'all' || category !== 'All') && (
            <button
              onClick={onReset}
              className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 px-3 py-2 rounded-xl transition disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
