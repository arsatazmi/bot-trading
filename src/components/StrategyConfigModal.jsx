// src/components/StrategyConfigModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Sliders, Check } from 'lucide-react';

export function StrategyConfigModal({
  isOpen,
  onClose,
  activeStrategyKey,
  strategies = {},
  onSaveConfig
}) {
  const [selectedKey, setSelectedKey] = useState(activeStrategyKey);
  const [formData, setFormData] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setSelectedKey(activeStrategyKey);
  }, [activeStrategyKey, isOpen]);

  useEffect(() => {
    if (strategies[selectedKey]?.config) {
      setFormData({ ...strategies[selectedKey].config });
    }
  }, [selectedKey, strategies]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: Number(value)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await onSaveConfig(selectedKey, formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0e1422] border border-white/[0.08] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#121929]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Parameter Strategi & Resiko</h3>
              <p className="text-[11px] text-slate-400">Atur batas teknis dan toleransi keuntungan/kerugian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Strategy Tabs */}
        <div className="flex border-b border-white/[0.06] bg-[#090d16] px-6 gap-2 pt-2">
          {[
            { key: 'rsi_ema', label: 'RSI + EMA Trend' },
            { key: 'grid', label: 'Grid Trading' },
            { key: 'dca', label: 'DCA Martingale' },
            { key: 'macd', label: 'MACD Momentum' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedKey(tab.key)}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                selectedKey === tab.key
                  ? 'border-blue-500 text-blue-400 bg-[#0e1422]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* RSI + EMA Fields */}
          {selectedKey === 'rsi_ema' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">RSI Period</label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={formData.rsiPeriod || 14}
                    onChange={e => handleChange('rsiPeriod', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">RSI Oversold (Beli)</label>
                  <input
                    type="number"
                    min="10"
                    max="50"
                    value={formData.rsiOversold || 32}
                    onChange={e => handleChange('rsiOversold', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">RSI Overbought (Jual)</label>
                  <input
                    type="number"
                    min="50"
                    max="90"
                    value={formData.rsiOverbought || 68}
                    onChange={e => handleChange('rsiOverbought', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Trade Amount ($ USD)</label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={formData.tradeAmountUSD || 500}
                    onChange={e => handleChange('tradeAmountUSD', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Fast EMA Period</label>
                  <input
                    type="number"
                    min="3"
                    max="50"
                    value={formData.emaFastPeriod || 9}
                    onChange={e => handleChange('emaFastPeriod', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Slow EMA Period</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={formData.emaSlowPeriod || 21}
                    onChange={e => handleChange('emaSlowPeriod', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.06]">
                <div>
                  <label className="text-[11px] font-semibold text-emerald-400 block mb-1">Take Profit (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.takeProfitPercent || 4.0}
                    onChange={e => handleChange('takeProfitPercent', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-rose-400 block mb-1">Stop Loss (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.stopLossPercent || 2.5}
                    onChange={e => handleChange('stopLossPercent', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-rose-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-blue-400 block mb-1">Trailing Stop (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.trailingStopPercent || 1.5}
                    onChange={e => handleChange('trailingStopPercent', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-blue-400 font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Grid Trading Fields */}
          {selectedKey === 'grid' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Rentang Range (± %)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="20"
                    value={formData.rangePercent || 4.0}
                    onChange={e => handleChange('rangePercent', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Jumlah Grid</label>
                  <input
                    type="number"
                    min="3"
                    max="20"
                    value={formData.gridCount || 6}
                    onChange={e => handleChange('gridCount', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Order per Grid ($)</label>
                  <input
                    type="number"
                    step="50"
                    value={formData.orderAmountUSD || 250}
                    onChange={e => handleChange('orderAmountUSD', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-emerald-400 block mb-1">TP per Grid (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.takeProfitPercent || 1.5}
                    onChange={e => handleChange('takeProfitPercent', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-rose-400 block mb-1">SL Range (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.stopLossPercent || 5.0}
                    onChange={e => handleChange('stopLossPercent', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-rose-400 font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DCA Martingale Fields */}
          {selectedKey === 'dca' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Base Order ($)</label>
                  <input
                    type="number"
                    step="50"
                    value={formData.baseOrderUSD || 300}
                    onChange={e => handleChange('baseOrderUSD', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Safety Order ($)</label>
                  <input
                    type="number"
                    step="50"
                    value={formData.safetyOrderUSD || 300}
                    onChange={e => handleChange('safetyOrderUSD', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Max Safety Orders</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maxSafetyOrders || 4}
                    onChange={e => handleChange('maxSafetyOrders', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Step Penurunan (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.priceDropStepPercent || 1.5}
                    onChange={e => handleChange('priceDropStepPercent', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Volume Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.volumeScale || 1.2}
                    onChange={e => handleChange('volumeScale', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-emerald-400 block mb-1">Target TP (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.takeProfitPercent || 2.5}
                    onChange={e => handleChange('takeProfitPercent', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MACD Fields */}
          {selectedKey === 'macd' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Fast Period</label>
                  <input
                    type="number"
                    value={formData.fastPeriod || 12}
                    onChange={e => handleChange('fastPeriod', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Slow Period</label>
                  <input
                    type="number"
                    value={formData.slowPeriod || 26}
                    onChange={e => handleChange('slowPeriod', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Signal Period</label>
                  <input
                    type="number"
                    value={formData.signalPeriod || 9}
                    onChange={e => handleChange('signalPeriod', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="50"
                    value={formData.tradeAmountUSD || 500}
                    onChange={e => handleChange('tradeAmountUSD', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-emerald-400 block mb-1">TP (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.takeProfitPercent || 3.5}
                    onChange={e => handleChange('takeProfitPercent', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-rose-400 block mb-1">SL (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.stopLossPercent || 2.0}
                    onChange={e => handleChange('stopLossPercent', e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-rose-400 font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              {saveSuccess ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Simpan & Terapkan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
