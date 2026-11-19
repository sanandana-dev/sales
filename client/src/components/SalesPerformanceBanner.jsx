import React from 'react';
import { ArrowUpRight, TrendingUp } from 'lucide-react';

export default function SalesPerformanceBanner({ growthPct = 12 }) {
  return (
    <section
      aria-label="Sales Performance Highlight"
      className="mb-5 rounded-2xl bg-gradient-to-r from-[#151927] via-[#1B2236] to-[#151927] border border-[#27314C] p-6 text-white relative overflow-hidden shadow-sm"
    >
      {/* Background Decorative Curves */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none">
          <path
            d="M0 150 C 200 180, 400 50, 800 120"
            stroke="#FF901E"
            strokeWidth="2.5"
            strokeDasharray="4 4"
          />
          <path d="M0 180 C 300 210, 500 90, 800 160" stroke="#2563EB" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Text */}
        <div className="max-w-md">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#FF901E]/15 border border-[#FF901E]/30 text-[#FF901E] text-[11px] font-bold mb-2">
            <TrendingUp className="w-3 h-3" />
            <span>Monthly Performance Pulse</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Your Sales{' '}
            <span className="text-[#FF901E] inline-flex items-center gap-1">
              On the Rise!
              <ArrowUpRight className="w-6 h-6 stroke-[3]" />
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9DB2] mt-1.5 leading-relaxed font-normal">
            Performance is up by{' '}
            <span className="text-emerald-400 font-semibold">{growthPct}%</span> compared to last
            month.
          </p>
        </div>

        {/* Right: Clean 3D-style ascending bar chart illustration */}
        <div className="flex items-end space-x-3.5 shrink-0 self-center md:self-auto py-1 pr-4">
          {/* Bar 1 */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="w-7 h-12 rounded-t-lg bg-gradient-to-t from-[#2563EB]/40 to-[#2563EB]/80 border-t border-x border-[#3B82F6]/60 shadow-lg relative group">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-[#60A5FA] rounded-t-lg" />
            </div>
            <span className="text-[10px] text-[#64748B] font-medium">W1</span>
          </div>

          {/* Bar 2 */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="w-7 h-18 rounded-t-lg bg-gradient-to-t from-[#7C3AED]/40 to-[#7C3AED]/80 border-t border-x border-[#8B5CF6]/60 shadow-lg relative">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-[#A78BFA] rounded-t-lg" />
            </div>
            <span className="text-[10px] text-[#64748B] font-medium">W2</span>
          </div>

          {/* Bar 3 */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="w-7 h-24 rounded-t-lg bg-gradient-to-t from-[#FF901E]/50 to-[#FF901E] border-t border-x border-[#FBA338] shadow-lg shadow-[#FF901E]/30 relative animate-pulse">
              <div className="absolute inset-x-0 top-0 h-2 bg-[#FFD188] rounded-t-lg" />
            </div>
            <span className="text-[10px] text-[#FF901E] font-bold">W3</span>
          </div>

          {/* Bar 4 */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="w-7 h-32 rounded-t-lg bg-gradient-to-t from-[#159B67]/50 to-[#159B67] border-t border-x border-[#34D399] shadow-xl relative">
              <div className="absolute inset-x-0 top-0 h-2 bg-[#6EE7B7] rounded-t-lg" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#159B67] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                +{growthPct}%
              </div>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">W4</span>
          </div>
        </div>
      </div>
    </section>
  );
}
