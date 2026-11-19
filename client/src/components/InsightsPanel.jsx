import React from 'react';
import { TrendingUp, Trophy, Users, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

function TinySpark({ color = '#159B67', points = [10, 15, 12, 18, 22, 28] }) {
  const data = points.map((v, i) => ({ i, v }));
  return (
    <div className="w-14 h-6 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.8} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function InsightsPanel({ summary, topProduct, onViewAll }) {
  const salesPct =
    summary?.changes?.salesChangePct !== undefined ? summary.changes.salesChangePct : 12.5;
  const topProdName = topProduct?.name || 'Laptop Pro';
  const topProdShare = topProduct?.revenueSharePct || 32;

  const insights = [
    {
      id: 1,
      title: `Sales increased by ${salesPct}%`,
      subtitle: 'Compared to last month.',
      icon: TrendingUp,
      iconColor: 'text-[#159B67]',
      iconBg: 'bg-[#159B67]/20',
      sparkColor: '#159B67',
      points: [8, 14, 12, 19, 21, 27]
    },
    {
      id: 2,
      title: `Top Product: ${topProdName}`,
      subtitle: `${topProdShare}% of total sales.`,
      icon: Trophy,
      iconColor: 'text-[#FF901E]',
      iconBg: 'bg-[#FF901E]/20',
      sparkColor: '#FF901E',
      points: [15, 18, 16, 24, 26, 32]
    },
    {
      id: 3,
      title: 'New Customers: 1,250',
      subtitle: '+18% vs last month.',
      icon: Users,
      iconColor: 'text-[#7C3AED]',
      iconBg: 'bg-[#7C3AED]/20',
      sparkColor: '#7C3AED',
      points: [10, 12, 15, 14, 20, 24]
    }
  ];

  return (
    <div className="bg-[#151927] border border-[#27314C] rounded-2xl p-5 shadow-xs text-white flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold tracking-tight text-white">Insights</h2>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-[#FF901E] hover:text-[#FFAE54] transition flex items-center space-x-1"
        >
          <span>View All</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 Dark Insight Cards */}
      <div className="space-y-3">
        {insights.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-[#1B2236] border border-[#27314C] hover:border-[#3B4868] transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg} ${item.iconColor}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{item.title}</p>
                  <p className="text-[11px] text-[#8E9DB2] truncate mt-0.5">{item.subtitle}</p>
                </div>
              </div>

              <TinySpark color={item.sparkColor} points={item.points} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
