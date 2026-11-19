import React, { useState } from 'react';
import { Star, Flame, Gem, Trash2, ArrowRight } from 'lucide-react';
import analytics from '../../../shared/analytics';

export default function ProductMatrixCard({ matrixData, loading }) {
  const [activeTab, setActiveTab] = useState('stars');

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm h-96 flex items-center justify-center animate-pulse">
        <div className="text-xs text-slate-400">Loading product performance matrix...</div>
      </div>
    );
  }

  const formatCur = val => analytics.formatCurrency(val, { maximumFractionDigits: 0 });

  const buckets = [
    {
      id: 'stars',
      label: 'Stars',
      icon: Star,
      count: matrixData?.stars?.length || 0,
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
      action: 'Keep in stock always',
      subtitle: 'High Sales Volume + High Profit Margin — Your #1 money makers',
      items: matrixData?.stars || []
    },
    {
      id: 'crowdPullers',
      label: 'Crowd Pullers',
      icon: Flame,
      count: matrixData?.crowdPullers?.length || 0,
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
      action: 'Bundle with high-profit items',
      subtitle: 'High Sales Volume + Lower Margin — Drives customer traffic',
      items: matrixData?.crowdPullers || []
    },
    {
      id: 'hiddenGems',
      label: 'Hidden Gems',
      icon: Gem,
      count: matrixData?.hiddenGems?.length || 0,
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      action: 'Promote these more',
      subtitle: 'Low Volume + High Margin — Big profit potential if advertised',
      items: matrixData?.hiddenGems || []
    },
    {
      id: 'deadWeight',
      label: 'Dead Weight',
      icon: Trash2,
      count: matrixData?.deadWeight?.length || 0,
      badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
      action: 'Put on clearance sale',
      subtitle: 'Low Volume + Low Margin — Ties up cash and shelf space',
      items: matrixData?.deadWeight || []
    }
  ];

  const currentBucket = buckets.find(b => b.id === activeTab) || buckets[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Product Performance Matrix</span>
            <span className="text-xs font-normal text-slate-400">
              (4-Quadrant Business Classifier)
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated categorisation using volume vs. margin to tell you exactly what action to take
          </p>
        </div>

        {/* Action Callout */}
        <div className={`px-3 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${currentBucket.badgeColor}`}>
          <span>Action:</span>
          <span>{currentBucket.action}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {buckets.map(b => {
          const Icon = b.icon;
          const isActive = activeTab === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setActiveTab(b.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {b.label}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {b.count}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {b.action}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bucket Explanation Banner */}
      <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs flex items-center justify-between">
        <span className="text-slate-600 dark:text-slate-300 font-medium">
          {currentBucket.subtitle}
        </span>
        <span className="text-slate-400 text-[11px]">
          Median Cutoff: {matrixData?.medianUnits || 0} units • {matrixData?.medianMargin || 0}% margin
        </span>
      </div>

      {/* Items List */}
      {currentBucket.items.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400">
          No products currently fall into this bucket for the active period.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium text-right">Units Sold</th>
                <th className="pb-2 font-medium text-right">Revenue</th>
                <th className="pb-2 font-medium text-right">Net Profit</th>
                <th className="pb-2 font-medium text-right">Margin %</th>
                <th className="pb-2 font-medium text-right">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 tabular-nums">
              {currentBucket.items.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 font-semibold text-slate-900 dark:text-white max-w-[220px] truncate">
                    {p.name}
                  </td>
                  <td className="py-2.5 text-slate-500 dark:text-slate-400">{p.category}</td>
                  <td className="py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">
                    {p.unitsSold.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right text-slate-700 dark:text-slate-300">
                    {formatCur(p.totalRevenue)}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCur(p.totalProfit)}
                  </td>
                  <td className="py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                    {p.profitMargin}%
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                      {p.action}
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
