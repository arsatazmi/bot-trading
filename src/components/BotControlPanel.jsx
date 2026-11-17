// src/components/BotControlPanel.jsx
import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Sliders, 
  Zap, 
  Layers, 
  CheckCircle2,
  Gauge,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';

export function BotControlPanel({
  status,
  mode,
  activeStrategyKey,
  strategies = {},
  speedMultiplier = 1,
  onStart,
  onPause,
  onStop,
  onSelectStrategy,
  onSelectMode,
  onSetSpeed,
  onOpenConfigModal
}) {
  const currentStrategy = strategies[activeStrategyKey] || {};
  const currentConfig = currentStrategy.config || {};

  return (
    <div className="bg-[#121721] rounded-xl border border-[#1f293d] p-4 flex flex-col gap-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-[#1f293d] pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Kontrol & Strategi Bot</h3>
            <p className="text-xs text-slate-400">Atur algoritma eksekusi otomatis</p>
          </div>
        </div>

        {/* Speed Multiplier Pill */}
        <div className="flex items-center gap-1 bg-[#161c28] p-1 rounded-lg border border-[#1f293d]">
          <span className="text-[11px] text-slate-400 pl-1.5 pr-1 flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-400" />
            Kecepatan:
          </span>
          {[1, 2, 5, 10].map(speed => (
            <button
              key={speed}
              onClick={() => onSetSpeed(speed)}
              className={`px-2 py-0.5 text-xs font-semibold rounded transition-colors ${
                speedMultiplier === speed
                  ? 'bg-amber-500 text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f293d]'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onSelectMode('paper')}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
            mode === 'paper'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400 shadow-inner'
              : 'bg-[#161c28] border-[#1f293d] text-slate-400 hover:bg-[#1a2232]'
          }`}
        >
          <div className={`h-2 w-2 rounded-full ${mode === 'paper' ? 'bg-blue-400' : 'bg-slate-600'}`} />
          <span>Paper Trading (Simulasi)</span>
        </button>

        <button
          onClick={() => onSelectMode('live')}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
            mode === 'live'
              ? 'bg-purple-600/15 border-purple-500 text-purple-400 shadow-inner'
              : 'bg-[#161c28] border-[#1f293d] text-slate-400 hover:bg-[#1a2232]'
          }`}
        >
          <div className={`h-2 w-2 rounded-full ${mode === 'live' ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'}`} />
          <span>Live Exchange API</span>
        </button>
      </div>

      {/* Strategy Switcher */}
      <div>
        <label className="text-xs font-medium text-slate-400 block mb-2">
          Pilih Algoritma Strategi:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'rsi_ema', name: 'RSI + EMA Trend', desc: 'Sinyal reversal & tren' },
            { key: 'grid', name: 'Grid Trading', desc: 'Beli murah, jual mahal per grid' },
            { key: 'dca', name: 'DCA Martingale', desc: 'Akumulasi saat koreksi harga' },
            { key: 'macd', name: 'MACD Momentum', desc: 'Tren breakout momentum' }
          ].map(s => {
            const isSelected = activeStrategyKey === s.key;
            return (
              <button
                key={s.key}
                onClick={() => onSelectStrategy(s.key)}
                className={`p-2.5 text-left rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-[#161c28] border-[#1f293d] text-slate-400 hover:text-slate-200 hover:bg-[#1a2232]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-100">{s.name}</span>
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{s.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Active Strategy Parameters Summary */}
      <div className="bg-[#161c28] rounded-lg p-3 border border-[#1f293d] text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-slate-300 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-blue-400" />
            Parameter Aktif ({currentStrategy.name || 'Strategi'})
          </span>
          <button
            onClick={onOpenConfigModal}
            className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors text-[11px]"
          >
            Ubah Parameter
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-slate-400 text-[11px]">
          {activeStrategyKey === 'rsi_ema' && (
            <>
              <div className="bg-[#121721] p-1.5 rounded border border-[#1f293d]">
                <div className="text-slate-500">RSI Period/Lev</div>
                <div className="font-mono text-slate-200">{currentConfig.rsiPeriod || 14} ({currentConfig.rsiOversold}/{currentConfig.rsiOverbought})</div>
              </div>
              <div className="bg-[#121721] p-1.5 rounded border border-[#1f293d]">
                <div className="text-slate-500">Fast/Slow EMA</div>
                <div className="font-mono text-slate-200">{currentConfig.emaFastPeriod || 9} / {currentConfig.emaSlowPeriod || 21}</div>
              </div>
              <div className="bg-[#121721] p-1.5 rounded border border-[#1f293d]">
                <div className="text-slate-500">TP / SL / Trail</div>
                <div className="font-mono text-emerald-400">+{currentConfig.takeProfitPercent}% / -{currentConfig.stopLossPercent}%</div>
              </div>
            </>
          )}

          {activeStrategyKey === 'grid' && (
            <>
              <div className="bg-[#121721] p-1.5 rounded border border-[#1f293d]">
                <div className="text-slate-500">Rentang Range</div>
                <div className="font-mono text-slate-200">±{currentConfig.rangePercent}%</div>
              </div>
              <div className="bg-[#121721] p-1.5 rounded border border-[#1f293d]">
                <div className="text-slate-500">Jumlah Grid</div>
                <div className="font-mono text-slate-200">{currentConfig.gridCount} Grid</div>
              </div>
              <div className="bg-[#121721] p-1.5 rounded border border-[#1f293d]">
                <div className="text-slate-500">Ukuran Order</div>
                <div className="font-mono text-emerald-400">${currentConfig.orderAmountUSD}</div>
              </div>
            </>
          )}

          {activeStrategyKey === 'dca' && (
            <>
              <div className="bg-[#121721] p-1.5 rounded border border-[#1f293d]">
                <div className="text-slate-500">Base / Safety</div>
                <div className="font-mono text-slate-200">${currentConfig.baseOrderUSD} / ${currentConfig.safetyOrderUSD}</div>
              </div>
              <div className="bg-[#121721] p-1.5 rounded border border-[#1f293d]">
                <div className="text-slate-500">Max Safety Orders</div>
                <div className="font-mono text-slate-200">{currentConfig.maxSafetyOrders}x (Step {currentConfig.priceDropStepPercent}%)</div>
              </div>
              <div className="bg-[#121721] p-1.5 rounded border border-[#1f293d]">
                <div className="text-slate-500">Target Take Profit</div>
                <div className="font-mono text-emerald-400">+{currentConfig.takeProfitPercent}%</div>
              </div>
            </>
          )}

          {activeStrategyKey === 'macd' && (
            <>
              <div className="bg-[#121721] p-1.5 rounded border border-[#1f293d]">
                <div className="text-slate-500">Fast / Slow</div>
                <div className="font-mono text-slate-200">{currentConfig.fastPeriod || 12} / {currentConfig.slowPeriod || 26}</div>
              </div>
              <div className="bg-[#121721] p-1.5 rounded border border-[#1f293d]">
                <div className="text-slate-500">Signal Period</div>
                <div className="font-mono text-slate-200">{currentConfig.signalPeriod || 9}</div>
              </div>
              <div className="bg-[#121721] p-1.5 rounded border border-[#1f293d]">
                <div className="text-slate-500">TP / SL</div>
                <div className="font-mono text-emerald-400">+{currentConfig.takeProfitPercent}% / -{currentConfig.stopLossPercent}%</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bot Master Controls */}
      <div className="pt-1">
        {status !== 'RUNNING' ? (
          <button
            onClick={onStart}
            className="w-full py-3 rounded-lg font-bold text-sm bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
          >
            <Play className="h-4 w-4 fill-current" />
            JALANKAN BOT SEKARANG
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onPause}
              className="py-2.5 rounded-lg font-semibold text-xs bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center gap-1.5 transition-all"
            >
              <Pause className="h-3.5 w-3.5 fill-current" />
              Jeda Bot
            </button>
            <button
              onClick={onStop}
              className="py-2.5 rounded-lg font-semibold text-xs bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center gap-1.5 transition-all"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Hentikan Bot
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
