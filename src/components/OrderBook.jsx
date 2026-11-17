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
    <div className="bg-[#121721] rounded-xl border border-[#1f293d] p-3 flex flex-col shadow-lg text-xs">
      <div className="flex items-center justify-between border-b border-[#1f293d] pb-2 mb-2">
        <span className="font-bold text-slate-200">Order Book</span>
        <span className="text-[11px] text-slate-400 font-mono">
          Spread: <span className="text-slate-200">{spread}</span>
        </span>
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 text-[10px] text-slate-500 font-medium pb-1.5 border-b border-[#1f293d]/50">
        <div>Harga</div>
        <div className="text-right">Jumlah</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks (Sell Orders) - Red */}
      <div className="flex flex-col-reverse gap-0.5 py-1 font-mono text-[11px]">
        {asks.slice(0, 6).map((ask, idx) => {
          const depthPercent = Math.min(100, ((ask.total || 0) / maxTotal) * 100);
          return (
            <div key={`ask-${idx}`} className="grid grid-cols-3 relative items-center py-0.5 px-1 hover:bg-[#1a2232] rounded">
              <div
                className="absolute inset-y-0 right-0 bg-rose-500/10 pointer-events-none rounded"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="text-rose-400 z-10">{ask.price}</span>
              <span className="text-right text-slate-300 z-10">{ask.amount}</span>
              <span className="text-right text-slate-500 z-10">{ask.total}</span>
            </div>
          );
        })}
      </div>

      {/* Mid market divider */}
      <div className="py-1 px-1 my-0.5 bg-[#161c28] rounded border border-[#1f293d] flex items-center justify-between font-mono text-[11px]">
        <span className="text-slate-400 text-[10px]">Market Mid</span>
        <span className="font-bold text-slate-200">
          {bids[0]?.price ? formatPrice(bids[0].price, symbol) : '--'}
        </span>
      </div>

      {/* Bids (Buy Orders) - Green */}
      <div className="flex flex-col gap-0.5 py-1 font-mono text-[11px]">
        {bids.slice(0, 6).map((bid, idx) => {
          const depthPercent = Math.min(100, ((bid.total || 0) / maxTotal) * 100);
          return (
            <div key={`bid-${idx}`} className="grid grid-cols-3 relative items-center py-0.5 px-1 hover:bg-[#1a2232] rounded">
              <div
                className="absolute inset-y-0 right-0 bg-emerald-500/10 pointer-events-none rounded"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="text-emerald-400 z-10">{bid.price}</span>
              <span className="text-right text-slate-300 z-10">{bid.amount}</span>
              <span className="text-right text-slate-500 z-10">{bid.total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
