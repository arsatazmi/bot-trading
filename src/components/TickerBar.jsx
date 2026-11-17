// src/components/TickerBar.jsx
import React, { useEffect, useState, useRef } from 'react';
import { formatPrice, formatPercent } from '../utils/formatters.js';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export function TickerBar({ 
  symbols = {}, 
  activeSymbol, 
  onSelectSymbol, 
  activeTickerData,
  allSnapshots = {}
}) {
  const [priceFlash, setPriceFlash] = useState(null); // 'up' | 'down' | null
  const prevPriceRef = useRef(null);

  const currentPrice = activeTickerData?.price || activeTickerData?.currentPrice || 0;

  useEffect(() => {
    if (prevPriceRef.current !== null && currentPrice !== prevPriceRef.current) {
      if (currentPrice > prevPriceRef.current) {
        setPriceFlash('up');
      } else if (currentPrice < prevPriceRef.current) {
        setPriceFlash('down');
      }
      const timer = setTimeout(() => setPriceFlash(null), 600);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = currentPrice;
  }, [currentPrice]);

  const change24h = activeTickerData?.change24h || 0;
  const isPositive = change24h >= 0;

  return (
    <div className="bg-[#121721] border-b border-[#1f293d] px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-4 max-w-[1920px] mx-auto">
        {/* Symbol Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {Object.entries(symbols).map(([symKey, symConfig]) => {
            const isSelected = symKey === activeSymbol;
            const snapshot = allSnapshots[symKey];
            const symPrice = snapshot?.currentPrice || symConfig.basePrice;
            const symChange = snapshot?.change24h || 0;
            const symIsPositive = symChange >= 0;

            return (
              <button
                key={symKey}
                onClick={() => onSelectSymbol(symKey)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/50 text-white shadow-sm'
                    : 'bg-[#161c28]/80 border-[#1f293d] text-slate-400 hover:text-slate-200 hover:bg-[#1a2232]'
                }`}
              >
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-200">{symKey}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                      {symConfig.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-slate-300">
                      {formatPrice(symPrice, symKey)}
                    </span>
                    <span className={`text-[11px] font-mono ${symIsPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatPercent(symChange)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Stats for Active Symbol */}
        <div className="flex items-center gap-6 divide-x divide-[#1f293d] overflow-x-auto text-xs py-0.5">
          {/* Active Price */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Harga Pasar</span>
              <span
                className={`text-xl font-bold font-mono transition-colors duration-200 ${
                  priceFlash === 'up'
                    ? 'text-emerald-400 bg-emerald-500/10 px-1 rounded'
                    : priceFlash === 'down'
                    ? 'text-rose-400 bg-rose-500/10 px-1 rounded'
                    : isPositive
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {formatPrice(currentPrice, activeSymbol)}
              </span>
            </div>

            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
              isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            }`}>
              {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {formatPercent(change24h)}
            </div>
          </div>

          {/* 24h High */}
          <div className="pl-5 flex flex-col">
            <span className="text-[11px] text-slate-400">24h Tertinggi</span>
            <span className="font-mono font-medium text-slate-200">
              {formatPrice(activeTickerData?.high24h || 0, activeSymbol)}
            </span>
          </div>

          {/* 24h Low */}
          <div className="pl-5 flex flex-col">
            <span className="text-[11px] text-slate-400">24h Terendah</span>
            <span className="font-mono font-medium text-slate-200">
              {formatPrice(activeTickerData?.low24h || 0, activeSymbol)}
            </span>
          </div>

          {/* 24h Volume */}
          <div className="pl-5 flex flex-col">
            <span className="text-[11px] text-slate-400">24h Volume</span>
            <span className="font-mono font-medium text-slate-200">
              {(activeTickerData?.volume24h || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
