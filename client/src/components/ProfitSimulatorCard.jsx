import React, { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import analytics from '../../../shared/analytics';

export default function ProfitSimulatorCard({ products = [], summary }) {
  const [selectedProductId, setSelectedProductId] = useState('all');
  const [priceChangePct, setPriceChangePct] = useState(0); // -30% to +30%
  const [costChangePct, setCostChangePct] = useState(0); // -30% to +30%

  const selectedProduct =
    selectedProductId === 'all'
      ? null
      : products.find(p => String(p.id) === String(selectedProductId));

  // Base values
  const baseRevenue = selectedProduct
    ? selectedProduct.totalRevenue || selectedProduct.sellingPrice * 50
    : summary?.totalRevenue || 100000;
  const baseProfit = selectedProduct
    ? selectedProduct.totalProfit || (selectedProduct.sellingPrice - selectedProduct.costPrice) * 50
    : summary?.totalProfit || 50000;
  const baseCost = baseRevenue - baseProfit;
  const baseMargin = analytics.calculateProfitMargin(baseRevenue, baseProfit);

  // Simulated values
  const simulatedRevenue = Math.max(0, baseRevenue * (1 + priceChangePct / 100));
  const simulatedCost = Math.max(0, baseCost * (1 + costChangePct / 100));
  const simulatedProfit = Math.max(0, simulatedRevenue - simulatedCost);
  const simulatedMargin = analytics.calculateProfitMargin(simulatedRevenue, simulatedProfit);

  const profitDiff = simulatedProfit - baseProfit;
  const isProfitUp = profitDiff >= 0;

  // Break-even units note
  let breakEvenText = '';
  if (priceChangePct < 0 && simulatedMargin > 0) {
    const requiredVolumeIncrease = Number(((baseProfit / simulatedProfit - 1) * 100).toFixed(1));
    breakEvenText = `To match current profit after a ${Math.abs(priceChangePct)}% discount, you must sell ${requiredVolumeIncrease}% more units.`;
  } else if (priceChangePct > 0) {
    breakEvenText = `With a ${priceChangePct}% price increase, you make ₹${Math.abs(Math.round(profitDiff)).toLocaleString()} more profit even if sales volume stays flat!`;
  } else if (costChangePct > 0) {
    breakEvenText = `Supplier cost increase of ${costChangePct}% eats into margins. Consider negotiating bulk rates or a small price adjustment.`;
  } else {
    breakEvenText =
      'Move sliders to test the impact of supplier price hikes, clearance discounts, or markups.';
  }

  const formatCur = val => analytics.formatCurrency(val, { maximumFractionDigits: 0 });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-500" />
            <span>&quot;What-If&quot; Profit Simulator</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Test price discounts and supplier cost shifts before changing sticker prices
          </p>
        </div>

        {/* Product selector */}
        <select
          value={selectedProductId}
          onChange={e => setSelectedProductId(e.target.value)}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Entire Store (All Products)</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} (${p.sellingPrice || p.unitPrice})
            </option>
          ))}
        </select>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Price Slider */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Selling Price / Discount Shift
            </span>
            <span
              className={`font-bold tabular-nums px-2 py-0.5 rounded-md ${
                priceChangePct > 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : priceChangePct < 0
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {priceChangePct > 0 ? `+${priceChangePct}%` : `${priceChangePct}%`}
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="30"
            step="1"
            value={priceChangePct}
            onChange={e => setPriceChangePct(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>-30% Clearance Discount</span>
            <span>0% Current</span>
            <span>+30% Premium Markup</span>
          </div>
        </div>

        {/* Cost Slider */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Supplier / Inventory Cost Shift
            </span>
            <span
              className={`font-bold tabular-nums px-2 py-0.5 rounded-md ${
                costChangePct < 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : costChangePct > 0
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {costChangePct > 0 ? `+${costChangePct}%` : `${costChangePct}%`}
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="30"
            step="1"
            value={costChangePct}
            onChange={e => setCostChangePct(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>-30% Bulk Discount</span>
            <span>0% Current</span>
            <span>+30% Inflation Spike</span>
          </div>
        </div>
      </div>

      {/* Simulated Outcomes Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-900 text-white rounded-xl shadow-inner">
        <div>
          <span className="text-[11px] text-slate-400 block mb-0.5">Projected Net Margin</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold">{simulatedMargin}%</span>
            <span className="text-xs text-slate-400">was {baseMargin}%</span>
          </div>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 block mb-0.5">Net Profit Impact</span>
          <div className="flex items-baseline space-x-2">
            <span
              className={`text-xl font-bold flex items-center ${
                isProfitUp ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isProfitUp ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {isProfitUp ? '+' : ''}
              {formatCur(profitDiff)}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 block mb-0.5">Simulated Total Profit</span>
          <span className="text-xl font-bold text-slate-200">{formatCur(simulatedProfit)}</span>
        </div>
      </div>

      {/* Break-Even Guidance Box */}
      <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
        <span className="font-medium">{breakEvenText}</span>
        {(priceChangePct !== 0 || costChangePct !== 0) && (
          <button
            onClick={() => {
              setPriceChangePct(0);
              setCostChangePct(0);
            }}
            className="text-[11px] font-semibold underline text-emerald-700 dark:text-emerald-400 ml-2"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
