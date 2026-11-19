// src/components/ActivePositions.jsx
import React from 'react';
import { formatPrice, formatCurrency, formatPercent } from '../utils/formatters.js';
import { X, Layers } from 'lucide-react';

export function ActivePositions({ positions = [], onClosePosition }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
            Posisi Terbuka ({positions.length})
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Real-time Floating Mark PnL</span>
      </div>

      {positions.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
          <Layers className="h-7 w-7 text-slate-600 mb-2.5 opacity-60" />
          <span className="font-semibold text-slate-400">Tidak ada posisi terbuka saat ini.</span>
          <span className="text-[11px] text-slate-500 mt-1">Bot akan membuka order otomatis saat parameter strategi tercapai.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400 text-[11px]">
                <th className="pb-2 font-semibold">Aset</th>
                <th className="pb-2 font-semibold">Strategi</th>
                <th className="pb-2 font-semibold">Jumlah / Nominal</th>
                <th className="pb-2 font-semibold">Harga Masuk</th>
                <th className="pb-2 font-semibold">Harga Sekarang</th>
                <th className="pb-2 font-semibold">Target TP / SL</th>
                <th className="pb-2 font-semibold">Floating PnL</th>
                <th className="pb-2 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {positions.map(pos => {
                const isProfit = (pos.unrealizedPnL || 0) >= 0;
                return (
                  <tr key={pos.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Symbol & Side */}
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-sans text-white text-xs">{pos.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-sans font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                          {pos.side}
                        </span>
                      </div>
                    </td>

                    {/* Strategy */}
                    <td className="py-3 font-sans text-slate-400 text-[11px]">
                      {pos.strategy || 'Auto'}
                    </td>

                    {/* Amount & Cost */}
                    <td className="py-3 text-slate-300">
                      <div className="font-bold">{pos.amount}</div>
                      <div className="text-[10px] text-slate-400">${pos.cost}</div>
                    </td>

                    {/* Entry Price */}
                    <td className="py-3 text-slate-300">
                      {formatPrice(pos.entryPrice, pos.symbol)}
                    </td>

                    {/* Current Price */}
                    <td className="py-3 text-white font-bold">
                      {formatPrice(pos.currentPrice, pos.symbol)}
                    </td>

                    {/* TP & SL */}
                    <td className="py-3 text-[11px]">
                      <div className="text-emerald-400 font-medium">TP: {pos.takeProfit ? formatPrice(pos.takeProfit, pos.symbol) : '--'}</div>
                      <div className="text-rose-400 font-medium">SL: {pos.stopLoss ? formatPrice(pos.stopLoss, pos.symbol) : '--'}</div>
                    </td>

                    {/* Unrealized PnL */}
                    <td className="py-3">
                      <div className={`font-bold text-xs ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}{formatCurrency(pos.unrealizedPnL)}
                      </div>
                      <div className={`text-[10px] font-semibold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatPercent(pos.unrealizedPnLPercent)}
                      </div>
                    </td>

                    {/* Action Close */}
                    <td className="py-3 text-right font-sans">
                      <button
                        onClick={() => onClosePosition(pos.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/25 hover:bg-rose-500/25 hover:border-rose-500/40 transition-all inline-flex items-center gap-1 active:scale-95"
                        title="Tutup Posisi Sekarang"
                      >
                        <X className="h-3 w-3" />
                        Tutup
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
