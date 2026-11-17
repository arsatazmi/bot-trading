// src/components/TradeHistory.jsx
import React, { useState } from 'react';
import { formatPrice, formatCurrency, formatPercent, formatDate } from '../utils/formatters.js';
import { Download, History, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';

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
    <div className="bg-[#121721] rounded-xl border border-[#1f293d] p-4 flex flex-col shadow-lg">
      <div className="flex flex-wrap items-center justify-between border-b border-[#1f293d] pb-3 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-blue-400" />
          <h3 className="font-bold text-sm text-slate-100">Riwayat Transaksi Bot ({trades.length})</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center bg-[#161c28] p-0.5 rounded-lg border border-[#1f293d] text-xs">
            {['ALL', 'WIN', 'LOSS'].map(f => (
              <button
                key={f}
                onClick={() => setFilterSide(f)}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  filterSide === f
                    ? 'bg-blue-600 text-white'
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
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#161c28] text-slate-300 border border-[#1f293d] hover:bg-[#1a2232] hover:text-white transition-all"
            title="Download Riwayat Transaksi sebagai CSV"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {filteredTrades.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          Belum ada riwayat transaksi yang tersimpan.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#121721] border-b border-[#1f293d] text-slate-400 text-[11px]">
              <tr>
                <th className="pb-2 font-medium">Waktu Selesai</th>
                <th className="pb-2 font-medium">Aset</th>
                <th className="pb-2 font-medium">Strategi</th>
                <th className="pb-2 font-medium">Beli &rarr; Jual</th>
                <th className="pb-2 font-medium">Jumlah</th>
                <th className="pb-2 font-medium">Alasan Exit</th>
                <th className="pb-2 font-medium text-right">Realized PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50 font-mono">
              {filteredTrades.map(trade => {
                const isWin = trade.realizedPnL >= 0;
                return (
                  <tr key={trade.id} className="hover:bg-[#161c28] transition-colors">
                    {/* Time */}
                    <td className="py-2 text-slate-400 font-sans text-[11px]">
                      {formatDate(trade.exitTime)}
                    </td>

                    {/* Symbol */}
                    <td className="py-2">
                      <span className="font-bold font-sans text-slate-200">{trade.symbol}</span>
                    </td>

                    {/* Strategy */}
                    <td className="py-2 font-sans text-slate-400 text-[11px]">
                      {trade.strategy}
                    </td>

                    {/* Entry -> Exit */}
                    <td className="py-2 text-slate-300">
                      <span className="text-slate-400">{formatPrice(trade.entryPrice, trade.symbol)}</span>
                      <span className="text-slate-600 mx-1">→</span>
                      <span className="font-semibold text-slate-200">{formatPrice(trade.exitPrice, trade.symbol)}</span>
                    </td>

                    {/* Amount */}
                    <td className="py-2 text-slate-400 text-[11px]">
                      {trade.amount}
                    </td>

                    {/* Reason */}
                    <td className="py-2 font-sans text-[11px]">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        isWin ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {trade.reason}
                      </span>
                    </td>

                    {/* Realized PnL */}
                    <td className="py-2 text-right">
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
