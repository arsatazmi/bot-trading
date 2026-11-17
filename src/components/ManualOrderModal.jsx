// src/components/ManualOrderModal.jsx
import React, { useState } from 'react';
import { X, PlusCircle, ArrowUpRight, ArrowDownRight, Check } from 'lucide-react';
import { formatPrice } from '../utils/formatters.js';

export function ManualOrderModal({
  isOpen,
  onClose,
  symbols = {},
  activeSymbol = 'BTC/USDT',
  currentPrice = 0,
  onSubmitOrder
}) {
  const [symbol, setSymbol] = useState(activeSymbol);
  const [side, setSide] = useState('BUY'); // 'BUY' | 'SELL'
  const [amountUSD, setAmountUSD] = useState(500);
  const [stopLossPercent, setStopLossPercent] = useState(2.0);
  const [takeProfitPercent, setTakeProfitPercent] = useState(4.0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const price = currentPrice || 1;
  const estimatedQty = +(amountUSD / price).toFixed(4);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await onSubmitOrder({
        symbol,
        side,
        amountUSD: Number(amountUSD),
        price: Number(price),
        stopLossPercent: stopLossPercent ? Number(stopLossPercent) : null,
        takeProfitPercent: takeProfitPercent ? Number(takeProfitPercent) : null
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Gagal mengeksekusi order');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#121721] border border-[#1f293d] rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f293d] bg-[#161c28]">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-base text-white">Eksekusi Order Manual</h3>
              <p className="text-xs text-slate-400">Tempatkan order beli/jual secara instan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f293d] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* BUY / SELL Switch */}
          <div className="grid grid-cols-2 gap-2 bg-[#161c28] p-1 rounded-xl border border-[#1f293d]">
            <button
              type="button"
              onClick={() => setSide('BUY')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                side === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              BUY / LONG
            </button>
            <button
              type="button"
              onClick={() => setSide('SELL')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                side === 'SELL'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownRight className="h-4 w-4" />
              SELL / CLOSE
            </button>
          </div>

          {/* Symbol & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Aset</label>
              <select
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                className="w-full bg-[#161c28] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
              >
                {Object.keys(symbols).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Harga Saat Ini</label>
              <div className="bg-[#161c28] border border-[#1f293d] rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-200">
                {formatPrice(currentPrice, symbol)}
              </div>
            </div>
          </div>

          {/* Amount in USD */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Nominal ($ USD)</label>
              <span className="text-xs font-mono text-slate-400">
                ≈ {estimatedQty} {symbol.split('/')[0]}
              </span>
            </div>
            <input
              type="number"
              min="10"
              step="10"
              value={amountUSD}
              onChange={e => setAmountUSD(e.target.value)}
              className="w-full bg-[#161c28] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
            {/* Quick nominal buttons */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[100, 250, 500, 1000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountUSD(amt)}
                  className="py-1 text-[11px] font-mono rounded bg-[#161c28] border border-[#1f293d] text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          {/* TP & SL Percentages */}
          {side === 'BUY' && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1f293d]">
              <div>
                <label className="text-xs text-emerald-400 font-medium block mb-1">Take Profit (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={takeProfitPercent}
                  onChange={e => setTakeProfitPercent(e.target.value)}
                  className="w-full bg-[#161c28] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-rose-400 font-medium block mb-1">Stop Loss (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={stopLossPercent}
                  onChange={e => setStopLossPercent(e.target.value)}
                  className="w-full bg-[#161c28] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-2.5 rounded-lg text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {error}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all ${
                side === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
              }`}
            >
              {submitting ? 'Memproses Order...' : `Konfirmasi ${side} ${symbol}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
