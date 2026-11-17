// src/components/ActivePositions.jsx
import React from 'react';
import { formatPrice, formatCurrency, formatPercent } from '../utils/formatters.js';
import { XCircle, ArrowUpRight, ShieldCheck, AlertCircle } from 'lucide-react';

export function ActivePositions({ positions = [], onClosePosition }) {
  return (
    <div className="bg-[#121721] rounded-xl border border-[#1f293d] p-4 flex flex-col shadow-lg">
      <div className="flex items-center justify-between border-b border-[#1f293d] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="font-bold text-sm text-slate-100">Posisi Terbuka ({positions.length})</h3>
        </div>
        <span className="text-xs text-slate-400">Real-time Floating PnL</span>
      </div>

      {positions.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
          <AlertCircle className="h-6 w-6 text-slate-600 mb-2" />
          <span>Tidak ada posisi terbuka saat ini.</span>
          <span className="text-[11px] text-slate-600 mt-0.5">Bot akan membuka order otomatis saat kondisi strategi terpenuhi.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1f293d] text-slate-400 text-[11px]">
                <th className="pb-2 font-medium">Aset / Posisi</th>
                <th className="pb-2 font-medium">Strategi</th>
                <th className="pb-2 font-medium">Jumlah</th>
                <th className="pb-2 font-medium">Harga Masuk</th>
                <th className="pb-2 font-medium">Harga Sekarang</th>
                <th className="pb-2 font-medium">Target TP / SL</th>
                <th className="pb-2 font-medium">Floating PnL</th>
                <th className="pb-2 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50 font-mono">
              {positions.map(pos => {
                const isProfit = (pos.unrealizedPnL || 0) >= 0;
                return (
                  <tr key={pos.id} className="hover:bg-[#161c28] transition-colors">
                    {/* Symbol & Side */}
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold font-sans text-slate-100">{pos.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-sans font-bold bg-emerald-500/20 text-emerald-400">
                          {pos.side}
                        </span>
                      </div>
                    </td>

                    {/* Strategy */}
                    <td className="py-2.5 font-sans text-slate-400 text-[11px]">
                      {pos.strategy || 'Auto'}
                    </td>

                    {/* Amount & Cost */}
                    <td className="py-2.5 text-slate-300">
                      <div>{pos.amount}</div>
                      <div className="text-[10px] text-slate-500">${pos.cost}</div>
                    </td>

                    {/* Entry Price */}
                    <td className="py-2.5 text-slate-300">
                      {formatPrice(pos.entryPrice, pos.symbol)}
                    </td>

                    {/* Current Price */}
                    <td className="py-2.5 text-slate-100 font-semibold">
                      {formatPrice(pos.currentPrice, pos.symbol)}
                    </td>

                    {/* TP & SL */}
                    <td className="py-2.5 text-[11px]">
                      <div className="text-emerald-400">TP: {pos.takeProfit ? formatPrice(pos.takeProfit, pos.symbol) : '--'}</div>
                      <div className="text-rose-400">SL: {pos.stopLoss ? formatPrice(pos.stopLoss, pos.symbol) : '--'}</div>
                    </td>

                    {/* Unrealized PnL */}
                    <td className="py-2.5">
                      <div className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}{formatCurrency(pos.unrealizedPnL)}
                      </div>
                      <div className={`text-[10px] ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatPercent(pos.unrealizedPnLPercent)}
                      </div>
                    </td>

                    {/* Action Close */}
                    <td className="py-2.5 text-right font-sans">
                      <button
                        onClick={() => onClosePosition(pos.id)}
                        className="px-2 py-1 rounded text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all inline-flex items-center gap-1"
                        title="Tutup Posisi Sekarang"
                      >
                        <XCircle className="h-3 w-3" />
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
