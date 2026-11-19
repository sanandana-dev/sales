import React from 'react';
import { ShoppingBag, DollarSign, TrendingUp, Percent, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

function ChangeBadge({ change, isMargin = false }) {
  if (change === null || change === undefined || isNaN(change)) {
    return (
      <span className="inline-flex items-center text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
        <Minus className="w-3 h-3 mr-0.5" /> 0%
      </span>
    );
  }

  const isPositive = change > 0;
  const isZero = change === 0;

  if (isZero) {
    return (
      <span className="inline-flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
        <Minus className="w-3 h-3 mr-0.5" /> 0%
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
        isPositive
          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className="w-3 h-3 mr-0.5 stroke-[2.5]" />
      ) : (
        <ArrowDownRight className="w-3 h-3 mr-0.5 stroke-[2.5]" />
      )}
      {isPositive ? '+' : ''}{change}{isMargin ? '% pts' : '%'}
    </span>
  );
}

export default function KpiCards({ summary, loading }) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const cards = [
    {
      title: 'Total Sales',
      value: (summary?.totalSales || 0).toLocaleString(),
      subValue: `${(summary?.totalUnits || 0).toLocaleString()} units sold`,
      change: summary?.changes?.salesChangePct,
      icon: ShoppingBag,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(summary?.totalRevenue),
      subValue: `Avg order $${summary?.totalSales ? (summary.totalRevenue / summary.totalSales).toFixed(2) : '0.00'}`,
      change: summary?.changes?.revenueChangePct,
      icon: DollarSign,
      color: 'indigo',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
    },
    {
      title: 'Gross Profit',
      value: formatCurrency(summary?.totalProfit),
      subValue: `COGS: ${formatCurrency((summary?.totalRevenue || 0) - (summary?.totalProfit || 0))}`,
      change: summary?.changes?.profitChangePct,
      icon: TrendingUp,
      color: 'emerald',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Profit Margin',
      value: `${(summary?.profitMargin || 0).toFixed(1)}%`,
      subValue: `Target: 50.0%`,
      change: summary?.changes?.marginChangePct,
      isMargin: true,
      icon: Percent,
      color: 'amber',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c, index) => {
        const IconComponent = c.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {c.title}
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bgColor}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            {loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/2"></div>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {c.value}
                  </div>
                  <ChangeBadge change={c.change} isMargin={c.isMargin} />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>{c.subValue}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">vs prev period</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
