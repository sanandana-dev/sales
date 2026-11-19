import React, { useState } from 'react';
import { X, Sparkles, Clock, Calculator, PackageX, Table } from 'lucide-react';
import ProductMatrixCard from './ProductMatrixCard';
import PeakTimesCard from './PeakTimesCard';
import ProfitSimulatorCard from './ProfitSimulatorCard';
import SlowMovingStockCard from './SlowMovingStockCard';
import ProductTable from './ProductTable';

export default function AdvancedAnalyticsDrawer({
  isOpen,
  onClose,
  initialTab = 'matrix',
  matrixData,
  peakData,
  slowMovingData,
  productsPerformance,
  summary,
  loading
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  const tabs = [
    { id: 'matrix', label: 'Product Matrix (4-Buckets)', icon: Sparkles },
    { id: 'peak', label: 'Peak Days & Hours', icon: Clock },
    { id: 'simulator', label: 'Profit Simulator', icon: Calculator },
    { id: 'stock', label: 'Cash Stuck on Shelves', icon: PackageX },
    { id: 'table', label: 'All Products Table', icon: Table }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-end"
    >
      <div className="bg-white dark:bg-[#151927] border-l border-slate-200 dark:border-[#1E2436] w-full max-w-4xl min-h-screen p-6 shadow-2xl flex flex-col justify-between text-slate-900 dark:text-slate-100 transition-colors animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#1E2436] mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF901E]" />
                Advanced Business Intelligence Suite
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Deep-dive diagnostic tools, staffing optimization, and profit simulation
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E2436]"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-[#1E2436] pb-3">
            {tabs.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#FF901E] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#1B2236] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#252D42]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'matrix' && (
              <ProductMatrixCard matrixData={matrixData} loading={loading} />
            )}

            {activeTab === 'peak' && <PeakTimesCard peakData={peakData} loading={loading} />}

            {activeTab === 'simulator' && (
              <ProfitSimulatorCard products={productsPerformance} summary={summary} />
            )}

            {activeTab === 'stock' && (
              <SlowMovingStockCard slowMovingData={slowMovingData} loading={loading} />
            )}

            {activeTab === 'table' && (
              <ProductTable products={productsPerformance} loading={loading} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 dark:border-[#1E2436] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-[#1B2236] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-[#252D42] transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
