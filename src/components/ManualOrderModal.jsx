// src/components/ManualOrderModal.jsx
import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
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
  const [side, setSide] = useState('BUY');
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

      if (res && res.success) {
        onClose();
      } else {
        setError(res?.error || 'Gagal mengeksekusi order');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0e1422] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#121929]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Eksekusi Order Manual</h3>
              <p className="text-[11px] text-slate-400">Order instan di harga pasar saat ini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* BUY / SELL Switch */}
          <div className="grid grid-cols-2 gap-2 bg-[#090d16] p-1 rounded-xl border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setSide('BUY')}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                side === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              BUY / LONG
            </button>
            <button
              type="button"
              onClick={() => setSide('SELL')}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                side === 'SELL'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
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
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Aset</label>
              <select
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-bold"
              >
                {Object.keys(symbols).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Harga Terkini</label>
              <div className="glass-input rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-200">
                {formatPrice(currentPrice, symbol)}
              </div>
            </div>
          </div>

          {/* Amount in USD */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300">Nominal ($ USD)</label>
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
              className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
            />
            {/* Quick chips */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[100, 250, 500, 1000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountUSD(amt)}
                  className="py-1 text-[11px] font-mono font-semibold rounded-lg bg-[#101623] border border-white/[0.06] text-slate-300 hover:text-white hover:border-blue-500/40 transition-colors"
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          {/* TP & SL Percentages */}
          {side === 'BUY' && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
              <div>
                <label className="text-[11px] font-semibold text-emerald-400 block mb-1">Take Profit (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={takeProfitPercent}
                  onChange={e => setTakeProfitPercent(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-rose-400 block mb-1">Stop Loss (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={stopLossPercent}
                  onChange={e => setStopLossPercent(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-rose-400 font-mono font-bold"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl transition-all active:scale-[0.98] ${
                side === 'BUY'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-rose-500/20'
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
