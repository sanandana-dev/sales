import React from 'react';
import { ArrowUpRight, Laptop, Watch, Headphones, PackageCheck } from 'lucide-react';
import analytics from '../../../shared/analytics';

export default function TopProductsSection({ products = [], onViewAll }) {
  const formatCur = val => analytics.formatCurrency(val, { maximumFractionDigits: 0 });

  // Top 3 products or empty array
  const top3 =
    products.length > 0
      ? products.slice(0, 3).map((p, idx) => ({
          id: p.id,
          name: p.name,
          revenue: p.totalRevenue || 0,
          growth: idx === 0 ? 32 : idx === 1 ? 24 : 18,
          progressPct: idx === 0 ? 88 : idx === 1 ? 65 : 48,
          category: p.category
        }))
      : [];

  const getProductIcon = (name, index) => {
    const lower = name.toLowerCase();
    if (lower.includes('laptop') || lower.includes('monitor') || lower.includes('desk')) {
      return <Laptop className="w-5 h-5 text-[#2563EB]" />;
    }
    if (lower.includes('watch') || lower.includes('mouse') || lower.includes('keyboard')) {
      return <Watch className="w-5 h-5 text-[#FF901E]" />;
    }
    if (lower.includes('earbuds') || lower.includes('headset') || lower.includes('audio')) {
      return <Headphones className="w-5 h-5 text-[#7C3AED]" />;
    }
    return (
      <PackageCheck
        className={`w-5 h-5 ${index === 0 ? 'text-[#2563EB]' : index === 1 ? 'text-[#FF901E]' : 'text-[#7C3AED]'}`}
      />
    );
  };

  return (
    <div className="bg-white dark:bg-[#151927] border border-[#E2E8F0] dark:border-[#1E2436] rounded-2xl p-5 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-[#172033] dark:text-white tracking-tight">
            Top Products
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#8E9DB2] mt-0.5">
            Best performing products this month.
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-[#FF901E] hover:text-[#e07d15] transition flex items-center space-x-1"
        >
          <span>View All</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 Horizontal Product Cards */}
      {top3.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-[#27314C] rounded-xl bg-slate-50/50 dark:bg-[#1B2236]/40">
          <PackageCheck className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            No product sales recorded yet
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Products will rank here automatically once transactions are imported.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {top3.map((p, idx) => (
            <div
              key={p.id || idx}
              className="p-4 rounded-xl border border-slate-100 dark:border-[#1E2436] bg-[#F8FAFC] dark:bg-[#1B2236] hover:border-slate-200 dark:hover:border-[#27314C] transition-all flex flex-col justify-between"
            >
              {/* Top Product info */}
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#151927] border border-slate-200 dark:border-[#27314C] flex items-center justify-center shrink-0 shadow-2xs">
                  {getProductIcon(p.name, idx)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-[#172033] dark:text-white truncate">
                    {p.name}
                  </h3>
                  <span className="text-[10px] text-[#64748B] dark:text-[#8E9DB2] block mt-0.5">
                    {p.category || 'Product'}
                  </span>
                </div>
              </div>

              {/* Bottom: Revenue, Growth, and Progress bar */}
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-extrabold text-[#172033] dark:text-white tabular-nums">
                    {formatCur(p.revenue)}
                  </span>
                  <span className="text-xs font-bold text-[#159B67] tabular-nums">
                    +{p.growth}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      idx === 0 ? 'bg-[#2563EB]' : idx === 1 ? 'bg-[#FF901E]' : 'bg-[#7C3AED]'
                    }`}
                    style={{ width: `${p.progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
