import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function UpgradeBanner({ onUpgradeClick }) {
  return (
    <div className="bg-[#151927] border border-[#27314C] rounded-2xl p-5 text-white shadow-xs relative overflow-hidden flex flex-col justify-between">
      {/* Background Glow */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#FF901E]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div>
        <div className="w-8 h-8 rounded-lg bg-[#FF901E]/20 text-[#FF901E] flex items-center justify-center mb-2.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <h2 className="text-base font-bold tracking-tight leading-snug">
          Upgrade to
          <br />
          <span className="text-[#FF901E]">Unlock Advanced Analytics</span>
        </h2>
        <p className="text-xs text-[#8E9DB2] mt-1.5 leading-relaxed">
          Get deeper insights, inventory velocity alerts, and grow faster.
        </p>
      </div>

      {/* Graphic & Button Area */}
      <div className="mt-4 pt-3 border-t border-[#1E2436] flex items-center justify-between">
        {/* 3D Ascending Bars Mini Graphic with Growth Arrow */}
        <div className="flex items-end space-x-1.5 shrink-0">
          <div className="w-2.5 h-4 bg-[#2563EB]/60 rounded-t" />
          <div className="w-2.5 h-6 bg-[#7C3AED]/70 rounded-t" />
          <div className="w-2.5 h-9 bg-[#FF901E] rounded-t shadow-xs shadow-[#FF901E]/40" />
          <div className="w-2.5 h-12 bg-[#159B67] rounded-t shadow-xs shadow-[#159B67]/40" />
        </div>

        {/* Upgrade Button */}
        <button
          onClick={onUpgradeClick}
          className="px-4 py-2 bg-[#FF901E] hover:bg-[#e07d15] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#FF901E]/30 transition-all flex items-center space-x-1"
        >
          <span>Upgrade Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
