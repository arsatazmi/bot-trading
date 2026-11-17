// src/components/TradeHistory.jsx
import React, { useState } from 'react';
import { formatPrice, formatCurrency, formatPercent, formatDate } from '../utils/formatters.js';
import { Download, History } from 'lucide-react';

export function TradeHistory({ trades = [] }) {
  const [filterSide, setFilterSide] = useState('ALL');

  const filteredTrades = trades.filter(t => {
    if (filterSide === 'ALL') return true;
    if (filterSide === 'WIN') return t.realizedPnL > 0;
    if (filterSide === 'LOSS') return t.realizedPnL <= 0;
    return true;
  });

  const handleExportCSV = () => {
    window.location.href = '/api/trades/export?format=csv';
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between pb-3 mb-2 border-b border-white/[0.06] gap-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-blue-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
            Riwayat Transaksi Bot ({trades.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center bg-[#101623] p-0.5 rounded-xl border border-white/[0.06] text-xs">
            {['ALL', 'WIN', 'LOSS'].map(f => (
              <button
                key={f}
                onClick={() => setFilterSide(f)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  filterSide === f
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-xl bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-all active:scale-95"
            title="Download CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {filteredTrades.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          Belum ada riwayat transaksi yang tersimpan.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[360px] overflow-y-auto pr-1">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#0d121c] border-b border-white/[0.06] text-slate-400 text-[11px]">
              <tr>
                <th className="pb-2 font-semibold">Waktu Selesai</th>
                <th className="pb-2 font-semibold">Aset</th>
                <th className="pb-2 font-semibold">Strategi</th>
                <th className="pb-2 font-semibold">Beli &rarr; Jual</th>
                <th className="pb-2 font-semibold">Jumlah</th>
                <th className="pb-2 font-semibold">Alasan Exit</th>
                <th className="pb-2 font-semibold text-right">Realized PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {filteredTrades.map(trade => {
                const isWin = trade.realizedPnL >= 0;
                return (
                  <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Time */}
                    <td className="py-2.5 text-slate-400 font-sans text-[11px]">
                      {formatDate(trade.exitTime)}
                    </td>

                    {/* Symbol */}
                    <td className="py-2.5">
                      <span className="font-bold font-sans text-white">{trade.symbol}</span>
                    </td>

                    {/* Strategy */}
                    <td className="py-2.5 font-sans text-slate-400 text-[11px]">
                      {trade.strategy}
                    </td>

                    {/* Entry -> Exit */}
                    <td className="py-2.5 text-slate-300">
                      <span className="text-slate-400">{formatPrice(trade.entryPrice, trade.symbol)}</span>
                      <span className="text-slate-600 mx-1.5">&rarr;</span>
                      <span className="font-bold text-white">{formatPrice(trade.exitPrice, trade.symbol)}</span>
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 text-slate-400 text-[11px]">
                      {trade.amount}
                    </td>

                    {/* Reason */}
                    <td className="py-2.5 font-sans text-[11px]">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                        isWin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {trade.reason}
                      </span>
                    </td>

                    {/* Realized PnL */}
                    <td className="py-2.5 text-right">
                      <div className={`font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isWin ? '+' : ''}{formatCurrency(trade.realizedPnL)}
                      </div>
                      <div className={`text-[10px] ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatPercent(trade.pnlPercent)}
                      </div>
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
