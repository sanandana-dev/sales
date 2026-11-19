import React from 'react';
import {
  Search,
  Calendar,
  Bell,
  LayoutGrid,
  Menu,
  FileSpreadsheet,
  Plus,
  Trash2,
  RotateCcw
} from 'lucide-react';

export default function TopNavbar({
  rangePreset,
  setRangePreset,
  search,
  setSearch,
  onOpenAddSale,
  onOpenUpload,
  onClearData,
  onResetDemoData,
  isClearing = false,
  isResetting = false,
  onToggleMobileSidebar
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF] dark:bg-[#151927] border-b border-[#E2E8F0] dark:border-[#1E2436] transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Hamburger (mobile) & Search input */}
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search anything..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#1B2236] text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF901E] focus:border-[#FF901E] transition-all"
            />
          </div>
        </div>

        {/* Right: Date filter, Notifications, Grid, Upload & Record Sale */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Date range dropdown */}
          <div className="relative">
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1B2236] text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#FF901E]" />
              <select
                value={rangePreset}
                onChange={e => setRangePreset(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer pr-1 text-xs font-semibold"
              >
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="12m">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          {/* Upload Excel/CSV Button */}
          <button
            onClick={onOpenUpload}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#159B67] bg-[#159B67]/10 hover:bg-[#159B67]/20 border border-[#159B67]/30 transition"
            title="Import Excel or CSV sales data"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          {/* Clear Demo Data Button */}
          <button
            onClick={onClearData}
            disabled={isClearing}
            className="hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/60 transition disabled:opacity-50"
            title="Clear all demo data from database"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isClearing ? 'Clearing...' : 'Clear Data'}</span>
          </button>

          {/* Reset to Sample Data Button */}
          <button
            onClick={onResetDemoData}
            disabled={isResetting}
            className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition disabled:opacity-50"
            title="Reset to 12-month sample dataset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isResetting ? 'Resetting...' : 'Load Demo'}</span>
          </button>

          {/* Record Sale Button (Orange #FF901E) */}
          <button
            onClick={onOpenAddSale}
            className="flex items-center space-x-1 bg-[#FF901E] hover:bg-[#e07d15] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm shadow-[#FF901E]/30 transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline">Record Sale</span>
          </button>

          {/* Notification Icon with dot indicator */}
          <button
            className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF901E] ring-2 ring-white dark:ring-[#151927]" />
          </button>

          {/* Application Grid Icon */}
          <button
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Applications grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
