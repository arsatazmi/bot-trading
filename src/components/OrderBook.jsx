// src/components/OrderBook.jsx
import React from 'react';
import { formatPrice } from '../utils/formatters.js';

export function OrderBook({ orderBook = {}, symbol = 'BTC/USDT' }) {
  const bids = orderBook.bids || [];
  const asks = orderBook.asks || [];
  const spread = orderBook.spread || 0;

  const maxTotal = Math.max(
    ...bids.map(b => b.total || 0),
    ...asks.map(a => a.total || 0),
    1
  );

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col shadow-2xl text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 mb-2.5">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">Order Book</h3>
        <span className="text-[11px] text-slate-400 font-mono bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.05]">
          Spread: <strong className="text-slate-200 font-bold">{spread}</strong>
        </span>
      </div>

      {/* Columns Header */}
      <div className="grid grid-cols-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold pb-1.5 border-b border-white/[0.04]">
        <div>Harga</div>
        <div className="text-right">Jumlah</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks (Sell Orders) - Red */}
      <div className="flex flex-col-reverse gap-0.5 py-1 font-mono text-[11px]">
        {asks.slice(0, 6).map((ask, idx) => {
          const depthPercent = Math.min(100, ((ask.total || 0) / maxTotal) * 100);
          return (
            <div key={`ask-${idx}`} className="grid grid-cols-3 relative items-center py-0.5 px-1 hover:bg-white/[0.03] rounded">
              <div
                className="absolute inset-y-0 right-0 bg-rose-500/10 pointer-events-none rounded"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="text-rose-400 font-medium z-10">{ask.price}</span>
              <span className="text-right text-slate-300 z-10">{ask.amount}</span>
              <span className="text-right text-slate-400 z-10">{ask.total}</span>
            </div>
          );
        })}
      </div>

      {/* Mid Market Banner */}
      <div className="py-1.5 px-2 my-1 bg-[#101623] rounded-xl border border-white/[0.06] flex items-center justify-between font-mono text-xs">
        <span className="text-slate-400 text-[10px] font-sans uppercase font-medium">Mid Market</span>
        <span className="font-extrabold text-slate-100">
          {bids[0]?.price ? formatPrice(bids[0].price, symbol) : '--'}
        </span>
      </div>

      {/* Bids (Buy Orders) - Green */}
      <div className="flex flex-col gap-0.5 py-1 font-mono text-[11px]">
        {bids.slice(0, 6).map((bid, idx) => {
          const depthPercent = Math.min(100, ((bid.total || 0) / maxTotal) * 100);
          return (
            <div key={`bid-${idx}`} className="grid grid-cols-3 relative items-center py-0.5 px-1 hover:bg-white/[0.03] rounded">
              <div
                className="absolute inset-y-0 right-0 bg-emerald-500/10 pointer-events-none rounded"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="text-emerald-400 font-medium z-10">{bid.price}</span>
              <span className="text-right text-slate-300 z-10">{bid.amount}</span>
              <span className="text-right text-slate-400 z-10">{bid.total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
