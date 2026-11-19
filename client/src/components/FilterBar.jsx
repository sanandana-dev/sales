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
    <nav
      aria-label="Dashboard filters"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-6 transition-colors"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date presets & custom picker */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            <span>Time Range:</span>
          </div>

          <div
            role="group"
            aria-label="Select date range preset"
            className="inline-flex flex-wrap p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl gap-1"
          >
            {presets.map(p => {
              const active = rangePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setRangePreset(p.id)}
                  aria-pressed={active}
                  className={`min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${
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

          {/* Custom Date Inputs */}
          {rangePreset === 'custom' && (
            <div className="flex items-center space-x-2 pl-2 flex-wrap sm:flex-nowrap gap-1">
              <label htmlFor="filter-start-date" className="sr-only">
                Start Date
              </label>
              <input
                id="filter-start-date"
                type="date"
                value={startDate || ''}
                onChange={e => setStartDate(e.target.value)}
                aria-label="Start date"
                className="min-h-[36px] text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              <span className="text-xs text-slate-400" aria-hidden="true">
                to
              </span>
              <label htmlFor="filter-end-date" className="sr-only">
                End Date
              </label>
              <input
                id="filter-end-date"
                type="date"
                value={endDate || ''}
                onChange={e => setEndDate(e.target.value)}
                aria-label="End date"
                className="min-h-[36px] text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Right filters: Category & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown with explicit label */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <label htmlFor="category-filter-select" className="sr-only">
              Filter by Category
            </label>
            <select
              id="category-filter-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
              aria-label="Filter dashboard by product category"
              className="min-h-[38px] text-xs font-medium bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 pr-8 focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
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
              className="min-h-[38px] flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Reset all filters"
              aria-label="Reset all filters to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="min-h-[38px] flex items-center space-x-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 px-3.5 py-2 rounded-xl transition disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Refresh dashboard data"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`}
              aria-hidden="true"
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
