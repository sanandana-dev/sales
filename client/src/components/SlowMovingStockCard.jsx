import React from 'react';
import { PackageX, ShieldAlert } from 'lucide-react';
import analytics from '../../../shared/analytics';

export default function SlowMovingStockCard({ slowMovingData, loading }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm h-80 flex items-center justify-center animate-pulse">
        <div className="text-xs text-slate-400">Auditing inventory velocity...</div>
      </div>
    );
  }

  const formatCur = val => analytics.formatCurrency(val, { maximumFractionDigits: 0 });
  const totalStuck = slowMovingData?.totalCashStuck || 0;
  const products = slowMovingData?.slowProducts || [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PackageX className="w-4 h-4 text-rose-500" />
              <span>Slow-Moving Stock (&quot;Cash Stuck on Shelves&quot;)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Identifies stagnant inventory tying up cash flow in the last 30 days
            </p>
          </div>

          <div className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-xs font-bold text-rose-700 dark:text-rose-300">
            Total Stuck: {formatCur(totalStuck)}
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-2.5 mb-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>
            {slowMovingData?.recommendation ||
              'Consider bundling these slow sellers with high-velocity Stars to unlock cash.'}
          </span>
        </div>

        {/* Table of slow items */}
        {products.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Great news! No critically stagnant inventory identified in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="pb-1.5 font-medium">Stagnant Product</th>
                  <th className="pb-1.5 font-medium text-center">Unsold Stock</th>
                  <th className="pb-1.5 font-medium text-right">Cash Tied Up</th>
                  <th className="pb-1.5 font-medium text-right">Last Sale</th>
                  <th className="pb-1.5 font-medium text-right">Recommended Fix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 tabular-nums">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-2 font-semibold text-slate-900 dark:text-white max-w-[180px] truncate">
                      {p.name}
                    </td>
                    <td className="py-2 text-center text-slate-600 dark:text-slate-300 font-medium">
                      {p.stockQuantity} units
                    </td>
                    <td className="py-2 text-right font-bold text-rose-600 dark:text-rose-400">
                      {formatCur(p.cashTiedUp)}
                    </td>
                    <td className="py-2 text-right text-slate-500 dark:text-slate-400">
                      {typeof p.daysSinceLastSale === 'number'
                        ? `${p.daysSinceLastSale}d ago`
                        : 'No sales'}
                    </td>
                    <td className="py-2 text-right">
                      <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
                        15% Off Promo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
