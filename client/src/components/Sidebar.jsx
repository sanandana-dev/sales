import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Sun,
  Moon,
  Sparkles,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({
  activeNav = 'dashboard',
  onSelectNav,
  onOpenAdvanced,
  onClearData,
  onResetData,
  isMobileOpen = false,
  onCloseMobile
}) {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Sales Analytics', icon: TrendingUp },
    { id: 'products', label: 'Products', icon: Package }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container: Exactly ~175px desktop width, dark navy #151927 */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[175px] bg-[#151927] text-white flex flex-col justify-between py-5 px-3.5 transition-transform duration-200 ease-in-out border-r border-[#1E2436] ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Logo & Nav items */}
        <div>
          {/* Logo Section */}
          <div className="flex items-center space-x-2.5 px-2 mb-7">
            <div className="w-8 h-8 rounded-lg bg-[#FF901E] flex items-center justify-center text-white shadow-md shadow-[#FF901E]/20 shrink-0">
              <Zap className="w-4 h-4 fill-white text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-sm tracking-tight text-white block">SalesPulse</span>
              <span className="text-[10px] text-[#64748B] tracking-normal font-medium block">
                Business Analytics
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav aria-label="Main Navigation" className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectNav?.(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-[#FF901E] text-white shadow-sm shadow-[#FF901E]/30'
                      : 'text-[#8E9DB2] hover:text-white hover:bg-[#1E2436]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Grow Faster promo card + Theme toggle */}
        <div className="space-y-3 pt-3 border-t border-[#1E2436]">
          {/* Grow Faster Promo Card */}
          <div className="p-3 rounded-xl bg-[#1B2236] border border-[#27314C] text-center relative overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-[#FF901E]/20 text-[#FF901E] flex items-center justify-center mx-auto mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-bold text-white leading-tight">Grow Faster</p>
            <p className="text-[10px] text-[#8E9DB2] mb-2 leading-tight">Achieve More.</p>
            <button
              onClick={() => onOpenAdvanced?.()}
              className="w-full py-1.5 px-2 bg-[#FF901E] hover:bg-[#e07d15] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center space-x-1 shadow-sm shadow-[#FF901E]/30"
            >
              <span>Upgrade Plan</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Data Actions */}
          <div className="pt-2 border-t border-[#1E2436] flex items-center justify-between gap-1.5 text-[10px]">
            <button
              onClick={onClearData}
              className="flex-1 py-1 px-1 rounded-lg text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 text-center font-medium transition"
              title="Clear all demo data from database"
            >
              Clear Data
            </button>
            <button
              onClick={onResetData}
              className="flex-1 py-1 px-1 rounded-lg text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 text-center font-medium transition"
              title="Reset to 12-month sample dataset"
            >
              Reset Demo
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-full py-2 px-3 rounded-xl bg-[#1E2436] hover:bg-[#252D42] text-[#8E9DB2] hover:text-white text-xs font-medium flex items-center justify-between transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="flex items-center space-x-2">
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span>{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
