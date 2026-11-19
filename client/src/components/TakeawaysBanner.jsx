import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';

export default function TakeawaysBanner({ takeaways = [], margin = 0, loading = false }) {
  if (loading) {
    return (
      <div className="mb-6 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm animate-pulse">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const getIcon = type => {
    switch (type) {
      case 'revenue':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'profit':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'star':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'action':
      default:
        return <Lightbulb className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getBg = type => {
    switch (type) {
      case 'revenue':
        return 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-blue-950 dark:text-blue-100';
      case 'profit':
        return 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-100';
      case 'star':
        return 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40 text-purple-950 dark:text-purple-100';
      case 'warning':
        return 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40 text-amber-950 dark:text-amber-100';
      case 'action':
      default:
        return 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40 text-indigo-950 dark:text-indigo-100';
    }
  };

  return (
    <section aria-label="Executive Takeaways" className="mb-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Period Owner Takeaways</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
                  AI Action Digest
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Key insights translated into simple business decisions
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span>Keep Rate:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              ₹{Math.round(margin)} per ₹100
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {takeaways.map((t, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${getBg(t.type)}`}
            >
              <div>
                <div className="flex items-center space-x-1.5 mb-1.5 font-semibold text-xs">
                  {getIcon(t.type)}
                  <span>{t.title}</span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
