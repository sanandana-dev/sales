import React from 'react';
import {
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import analytics from '../../../shared/analytics';

function ChangeBadge({ change, isMargin = false }) {
  if (change === null || change === undefined || isNaN(change)) {
    return (
      <span className="inline-flex items-center text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full tabular-nums">
        <Minus className="w-3 h-3 mr-0.5" aria-hidden="true" />
        <span className="sr-only">No change recorded:</span>
        <span>0%</span>
      </span>
    );
  }

  const isPositive = change > 0;
  const isZero = change === 0;

  if (isZero) {
    return (
      <span className="inline-flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full tabular-nums">
        <Minus className="w-3 h-3 mr-0.5" aria-hidden="true" />
        <span className="sr-only">No change compared to prior period:</span>
        <span>0%</span>
      </span>
    );
  }

  const unit = isMargin ? '% pts' : '%';
  const srText = isPositive
    ? `Increased by ${change}${unit} compared to previous period`
    : `Decreased by ${Math.abs(change)}${unit} compared to previous period`;

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums ${
        isPositive
          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
      }`}
    >
      <span className="sr-only">{srText}</span>
      {isPositive ? (
        <ArrowUpRight className="w-3 h-3 mr-0.5 stroke-[2.5]" aria-hidden="true" />
      ) : (
        <ArrowDownRight className="w-3 h-3 mr-0.5 stroke-[2.5]" aria-hidden="true" />
      )}
      <span aria-hidden="true">
        {isPositive ? '+' : ''}
        {change}
        {unit}
      </span>
    </span>
  );
}

export default function KpiCards({ summary, loading }) {
  const formatCurrency = val => analytics.formatCurrency(val, { maximumFractionDigits: 0 });
  const marginVal = Number((summary?.profitMargin || 0).toFixed(1));
  const profitPer100 = Math.round(marginVal);

  const getMarginStatus = margin => {
    if (margin >= 50) return { color: 'emerald', label: 'Healthy Margin' };
    if (margin >= 30) return { color: 'amber', label: 'Moderate — watch discounts' };
    return { color: 'rose', label: 'Low — costs/discounts hurting profit' };
  };

  const marginStatus = getMarginStatus(marginVal);

  const cards = [
    {
      title: 'Total Sales',
      value: `${(summary?.totalSales || 0).toLocaleString()} Orders`,
      subValue: `${(summary?.totalUnits || 0).toLocaleString()} total items sold`,
      change: summary?.changes?.salesChangePct,
      icon: ShoppingBag,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(summary?.totalRevenue),
      subValue: `Avg order: ₹${summary?.totalSales ? (summary.totalRevenue / summary.totalSales).toFixed(2) : '0.00'}`,
      change: summary?.changes?.revenueChangePct,
      icon: IndianRupee,
      color: 'indigo',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
    },
    {
      title: 'Total Net Profit',
      value: formatCurrency(summary?.totalProfit),
      subValue: `Product Cost: ${formatCurrency((summary?.totalRevenue || 0) - (summary?.totalProfit || 0))}`,
      change: summary?.changes?.profitChangePct,
      icon: TrendingUp,
      color: 'emerald',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Profit Margin %',
      value: `${marginVal}%`,
      subValue: `You kept ₹${profitPer100} out of every ₹100 sold`,
      subValueColor:
        marginVal >= 50
          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
          : marginVal >= 30
            ? 'text-amber-600 dark:text-amber-400 font-medium'
            : 'text-rose-600 dark:text-rose-400 font-medium',
      badgeLabel: marginStatus.label,
      change: summary?.changes?.marginChangePct,
      isMargin: true,
      icon: Percent,
      color: marginStatus.color,
      bgColor:
        marginVal >= 50
          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
          : marginVal >= 30
            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
    }
  ];

  return (
    <section aria-label="Key Performance Indicators" className="mb-6">
      <h2 className="sr-only">Executive KPI Summary</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bgColor}`}
                  aria-hidden="true"
                >
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              {loading ? (
                <div
                  role="status"
                  aria-label={`Loading ${c.title}`}
                  className="space-y-2 animate-pulse"
                >
                  <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/2"></div>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                      {c.value}
                    </div>
                    <ChangeBadge change={c.change} isMargin={c.isMargin} />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between tabular-nums">
                    <span className={c.subValueColor || ''}>{c.subValue}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      vs prev period
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
