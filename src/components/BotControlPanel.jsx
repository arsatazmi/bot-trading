// src/components/BotControlPanel.jsx
import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SlidersHorizontal, 
  Zap, 
  Check, 
  Cpu, 
  ArrowUpRight,
  ShieldAlert
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
  const isRunning = status === 'RUNNING';

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3.5 shadow-2xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Bot Command Center</h3>
            <p className="text-[11px] text-slate-400">Eksekusi algoritma otomatis</p>
          </div>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-[#101623] p-1 rounded-xl border border-white/[0.06]">
          <span className="text-[10px] text-slate-400 pl-1.5 pr-0.5 flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-400" />
            Speed:
          </span>
          {[1, 2, 5, 10].map(speed => (
            <button
              key={speed}
              onClick={() => onSetSpeed(speed)}
              className={`px-2 py-0.5 text-xs font-mono font-bold rounded-lg transition-all ${
                speedMultiplier === speed
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onSelectMode('paper')}
          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            mode === 'paper'
              ? 'bg-blue-600/15 border-blue-500/50 text-blue-300 shadow-sm'
              : 'bg-[#101623]/60 border-white/[0.05] text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${mode === 'paper' ? 'bg-blue-400' : 'bg-slate-600'}`} />
          <span>Paper Trading</span>
        </button>

        <button
          onClick={() => onSelectMode('live')}
          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            mode === 'live'
              ? 'bg-purple-600/15 border-purple-500/50 text-purple-300 shadow-sm'
              : 'bg-[#101623]/60 border-white/[0.05] text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${mode === 'live' ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'}`} />
          <span>Live Exchange</span>
        </button>
      </div>

      {/* Strategy Switcher Grid */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
          Pilih Algoritma:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'rsi_ema', name: 'RSI + EMA Trend', desc: 'Reversal & persilangan tren' },
            { key: 'grid', name: 'Grid Trading', desc: 'Beli murah jual mahal' },
            { key: 'dca', name: 'DCA Martingale', desc: 'Akumulasi saat koreksi' },
            { key: 'macd', name: 'MACD Momentum', desc: 'Breakout momentum tren' }
          ].map(s => {
            const isSelected = activeStrategyKey === s.key;
            return (
              <button
                key={s.key}
                onClick={() => onSelectStrategy(s.key)}
                className={`p-2.5 text-left rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/5'
                    : 'bg-[#101623]/60 border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-[#151c2c]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-100">{s.name}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-blue-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{s.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Strategy Parameters Quickview */}
      <div className="bg-[#101623]/80 rounded-xl p-3 border border-white/[0.06] text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />
            Parameter {currentStrategy.name || 'Strategi'}
          </span>
          <button
            onClick={onOpenConfigModal}
            className="text-blue-400 hover:text-blue-300 font-medium text-[11px] flex items-center gap-1 transition-colors"
          >
            Sesuaikan
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
          {activeStrategyKey === 'rsi_ema' && (
            <>
              <div className="bg-[#0b0e17] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 font-sans">RSI Over B/J</div>
                <div className="font-bold text-slate-200">{currentConfig.rsiOversold || 32} / {currentConfig.rsiOverbought || 68}</div>
              </div>
              <div className="bg-[#0b0e17] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 font-sans">EMA Fast/Slow</div>
                <div className="font-bold text-slate-200">{currentConfig.emaFastPeriod || 9} / {currentConfig.emaSlowPeriod || 21}</div>
              </div>
              <div className="bg-[#0b0e17] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 font-sans">TP / SL</div>
                <div className="font-bold text-emerald-400">+{currentConfig.takeProfitPercent}% / -{currentConfig.stopLossPercent}%</div>
              </div>
            </>
          )}

          {activeStrategyKey === 'grid' && (
            <>
              <div className="bg-[#0b0e17] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 font-sans">Range Rentang</div>
                <div className="font-bold text-slate-200">±{currentConfig.rangePercent}%</div>
              </div>
              <div className="bg-[#0b0e17] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 font-sans">Grid Levels</div>
                <div className="font-bold text-slate-200">{currentConfig.gridCount} Grid</div>
              </div>
              <div className="bg-[#0b0e17] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 font-sans">TP per Grid</div>
                <div className="font-bold text-emerald-400">+{currentConfig.takeProfitPercent}%</div>
              </div>
            </>
          )}

          {activeStrategyKey === 'dca' && (
            <>
              <div className="bg-[#0b0e17] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 font-sans">Base / Safety</div>
                <div className="font-bold text-slate-200">${currentConfig.baseOrderUSD} / ${currentConfig.safetyOrderUSD}</div>
              </div>
              <div className="bg-[#0b0e17] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 font-sans">Max Safety</div>
                <div className="font-bold text-slate-200">{currentConfig.maxSafetyOrders}x ({currentConfig.priceDropStepPercent}%)</div>
              </div>
              <div className="bg-[#0b0e17] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 font-sans">Target TP</div>
                <div className="font-bold text-emerald-400">+{currentConfig.takeProfitPercent}%</div>
              </div>
            </>
          )}

          {activeStrategyKey === 'macd' && (
            <>
              <div className="bg-[#0b0e17] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 font-sans">Fast/Slow</div>
                <div className="font-bold text-slate-200">{currentConfig.fastPeriod || 12} / {currentConfig.slowPeriod || 26}</div>
              </div>
              <div className="bg-[#0b0e17] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 font-sans">Signal</div>
                <div className="font-bold text-slate-200">{currentConfig.signalPeriod || 9}</div>
              </div>
              <div className="bg-[#0b0e17] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 font-sans">TP / SL</div>
                <div className="font-bold text-emerald-400">+{currentConfig.takeProfitPercent}% / -{currentConfig.stopLossPercent}%</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Action Execution Bar */}
      <div className="pt-1">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" />
            JALANKAN BOT OTOMATIS
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onPause}
              className="py-2.5 rounded-xl font-bold text-xs bg-amber-600/90 hover:bg-amber-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
            >
              <Pause className="h-3.5 w-3.5 fill-current" />
              Jeda Eksekusi
            </button>
            <button
              onClick={onStop}
              className="py-2.5 rounded-xl font-bold text-xs bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Hentikan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
