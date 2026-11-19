import React from 'react';
import {
  ShoppingCart,
  IndianRupee,
  BarChart2,
  Percent,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import analytics from '../../../shared/analytics';

// Mini Sparkline component using Recharts
function MiniSparkline({ data = [], color = '#FF901E', hasOrders = true }) {
  // Flat line if no active orders; otherwise slice trend data
  const chartData =
    !hasOrders || data.length === 0
      ? [{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }]
      : data.length >= 4
        ? data
            .slice(-7)
            .map((d, i) => ({ v: d.revenue || d.profit || d.salesCount || (i + 1) * 10 }))
        : [{ v: 12 }, { v: 19 }, { v: 15 }, { v: 24 }, { v: 22 }, { v: 31 }, { v: 38 }];

  return (
    <div className="w-16 h-8 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.8}
            dot={false}
            fill={`url(#grad-${color})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Circular Donut Progress Ring for Profit Margin
function CircularProgress({ percentage = 58.6, size = 38, strokeWidth = 3.5, color = '#159B67' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-100 dark:stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-[9px] font-extrabold text-slate-700 dark:text-slate-200">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}

export default function KPICardsRow({ summary, trendData = [], loading }) {
  const formatCur = val => analytics.formatCurrency(val, { maximumFractionDigits: 0 });

  const hasOrders = Boolean(summary && summary.totalSales > 0);
  const totalSalesVal = summary
    ? `${(summary.totalSales || 0).toLocaleString()} Orders`
    : '0 Orders';
  const totalRevVal = summary ? formatCur(summary.totalRevenue || 0) : '₹0';
  const totalProfitVal = summary ? formatCur(summary.totalProfit || 0) : '₹0';
  const marginVal = Number((summary?.profitMargin || 0).toFixed(1));

  const salesGrowth =
    hasOrders && summary?.changes?.salesChangePct !== undefined
      ? summary.changes.salesChangePct
      : 0;
  const revGrowth =
    hasOrders && summary?.changes?.revenueChangePct !== undefined
      ? summary.changes.revenueChangePct
      : 0;
  const profitGrowth =
    hasOrders && summary?.changes?.profitChangePct !== undefined
      ? summary.changes.profitChangePct
      : 0;
  const marginGrowth =
    hasOrders && summary?.changes?.marginChangePct !== undefined
      ? summary.changes.marginChangePct
      : 0;

  const cards = [
    {
      title: 'Total Sales',
      value: totalSalesVal,
      growth: salesGrowth,
      accentColor: '#FF901E',
      icon: ShoppingCart,
      iconBg: 'bg-[#FF901E]/10 text-[#FF901E]',
      chartType: 'sparkline'
    },
    {
      title: 'Total Revenue',
      value: totalRevVal,
      growth: revGrowth,
      accentColor: '#2563EB',
      icon: IndianRupee,
      iconBg: 'bg-[#2563EB]/10 text-[#2563EB]',
      chartType: 'sparkline'
    },
    {
      title: 'Total Net Profit',
      value: totalProfitVal,
      growth: profitGrowth,
      accentColor: '#7C3AED',
      icon: BarChart2,
      iconBg: 'bg-[#7C3AED]/10 text-[#7C3AED]',
      chartType: 'sparkline'
    },
    {
      title: 'Profit Margin',
      value: `${marginVal}%`,
      growth: marginGrowth,
      accentColor: '#159B67',
      icon: Percent,
      iconBg: 'bg-[#159B67]/10 text-[#159B67]',
      chartType: 'circle'
    }
  ];

  return (
    <section aria-label="Key Performance Indicators" className="mb-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {cards.map((c, i) => {
          const Icon = c.icon;
          const isPositive = c.growth >= 0;

          return (
            <div
              key={i}
              className="bg-white dark:bg-[#151927] border border-[#E2E8F0] dark:border-[#1E2436] rounded-2xl p-4 shadow-xs hover:shadow-sm transition-all duration-150 flex flex-col justify-between"
            >
              {/* Top row: Title and Icon */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B] dark:text-[#8E9DB2]">
                  {c.title}
                </span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Middle row: Large Value & Mini visualization */}
              <div className="flex items-center justify-between gap-2 my-1">
                <span className="text-xl font-bold tracking-tight text-[#172033] dark:text-white tabular-nums">
                  {loading ? '...' : c.value}
                </span>

                {c.chartType === 'circle' ? (
                  <CircularProgress percentage={marginVal} color={c.accentColor} />
                ) : (
                  <MiniSparkline data={trendData} color={c.accentColor} hasOrders={hasOrders} />
                )}
              </div>

              {/* Bottom row: Growth badge + Subtitle */}
              <div className="flex items-center space-x-1.5 text-[11px] text-[#64748B] dark:text-[#8E9DB2] pt-1">
                <span
                  className={`inline-flex items-center font-bold px-1.5 py-0.2 rounded text-[10px] ${
                    isPositive ? 'text-[#159B67] bg-[#159B67]/10' : 'text-[#E11D48] bg-[#E11D48]/10'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-3 h-3 stroke-[2.5] mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 stroke-[2.5] mr-0.5" />
                  )}
                  {isPositive ? '+' : ''}
                  {c.growth}%
                </span>
                <span className="text-[10px]">vs previous period</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
