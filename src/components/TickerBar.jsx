// src/components/TickerBar.jsx
import React, { useEffect, useState, useRef } from 'react';
import { formatPrice, formatPercent } from '../utils/formatters.js';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function TickerBar({ 
  symbols = {}, 
  activeSymbol, 
  onSelectSymbol, 
  activeTickerData,
  allSnapshots = {}
}) {
  const [priceFlash, setPriceFlash] = useState(null);
  const prevPriceRef = useRef(null);

  const currentPrice = activeTickerData?.price || activeTickerData?.currentPrice || 0;

  useEffect(() => {
    if (prevPriceRef.current !== null && currentPrice !== prevPriceRef.current) {
      if (currentPrice > prevPriceRef.current) {
        setPriceFlash('up');
      } else if (currentPrice < prevPriceRef.current) {
        setPriceFlash('down');
      }
      const timer = setTimeout(() => setPriceFlash(null), 500);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = currentPrice;
  }, [currentPrice]);

  const change24h = activeTickerData?.change24h || 0;
  const isPositive = change24h >= 0;

  return (
    <div className="border-b border-white/[0.06] bg-[#0b0f19]/70 backdrop-blur-md px-4 lg:px-6 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-[1920px] mx-auto">
        {/* Asset Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {Object.entries(symbols).map(([symKey, symConfig]) => {
            const isSelected = symKey === activeSymbol;
            const snapshot = allSnapshots[symKey];
            const symPrice = snapshot?.currentPrice || symConfig.basePrice;
            const symChange = snapshot?.change24h || 0;
            const symPositive = symChange >= 0;

            return (
              <button
                key={symKey}
                onClick={() => onSelectSymbol(symKey)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-sm'
                    : 'bg-[#101623]/60 border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-[#151c2c]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {symKey}
                  </span>
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-white/[0.05] text-slate-400">
                    {symConfig.type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="text-slate-200">
                    {formatPrice(symPrice, symKey)}
                  </span>
                  <span className={`text-[10px] font-semibold ${symPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatPercent(symChange)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Asset Stats Strip */}
        <div className="flex items-center gap-5 text-xs overflow-x-auto">
          {/* Real-time Market Price */}
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Harga:</span>
            <span
              className={`text-lg font-extrabold font-mono transition-all duration-300 ${
                priceFlash === 'up'
                  ? 'text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md'
                  : priceFlash === 'down'
                  ? 'text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md'
                  : isPositive
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {formatPrice(currentPrice, activeSymbol)}
            </span>

            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold font-mono ${
              isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPercent(change24h)}
            </div>
          </div>

          <div className="h-4 w-px bg-white/[0.08] hidden sm:block" />

          {/* 24h High */}
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase">24h High</span>
            <span className="font-mono font-medium text-slate-200 text-xs">
              {formatPrice(activeTickerData?.high24h || 0, activeSymbol)}
            </span>
          </div>

          {/* 24h Low */}
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase">24h Low</span>
            <span className="font-mono font-medium text-slate-200 text-xs">
              {formatPrice(activeTickerData?.low24h || 0, activeSymbol)}
            </span>
          </div>

          {/* 24h Volume */}
          <div className="hidden md:flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase">24h Volume</span>
            <span className="font-mono font-medium text-slate-200 text-xs">
              {(activeTickerData?.volume24h || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
