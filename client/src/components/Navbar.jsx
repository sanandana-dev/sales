import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Plus, BarChart3, FileSpreadsheet, RotateCcw } from 'lucide-react';

export default function Navbar({
  onOpenAddSale,
  onOpenUpload,
  onResetData,
  totalProducts = 0,
  isResetting = false
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20"
            aria-hidden="true"
          >
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                SalesPulse
              </span>
              <span
                className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                aria-label={`Database status: Live, containing ${totalProducts} products`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"
                  aria-hidden="true"
                ></span>
                Live DB ({totalProducts} Products)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Small Business Sales & Margin Intelligence
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Reset Demo Data Button */}
          <button
            onClick={onResetData}
            disabled={isResetting}
            className="min-h-[44px] hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
            title="Reset to clean 12-month sample dataset"
            aria-label="Reset to sample dataset"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo</span>
          </button>

          {/* Import Excel / CSV Button */}
          <button
            onClick={onOpenUpload}
            className="min-h-[44px] flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 transition shadow-xs"
            aria-label="Upload Excel or CSV spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden xs:inline">Upload Excel/CSV</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center justify-center"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700" aria-hidden="true" />
            )}
          </button>

          {/* Add Sale Button */}
          <button
            onClick={onOpenAddSale}
            className="min-h-[44px] flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            aria-label="Record a new sale transaction"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            <span>Record Sale</span>
          </button>
        </div>
      </div>
    </header>
  );
}
