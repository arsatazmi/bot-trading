// src/components/Navbar.jsx
import React from 'react';
import { 
  Bot, 
  Play, 
  Pause, 
  Square, 
  Settings2, 
  KeyRound, 
  RotateCcw, 
  AlertOctagon, 
  Plus, 
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

export function Navbar({
  status,
  mode,
  onStart,
  onPause,
  onStop,
  onOpenSettings,
  onOpenStrategyModal,
  onOpenManualOrder,
  onResetBalance,
  onPanicClose,
  hasOpenPositions,
  isLiveExchangeConnected
}) {
  const isRunning = status === 'RUNNING';
  const isPaused = status === 'PAUSED';

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#090d16]/90 backdrop-blur-xl px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4 max-w-[1920px] mx-auto">
        {/* Brand & Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/10">
            <div className="h-full w-full rounded-[11px] bg-[#0b0e17] flex items-center justify-center">
              <Bot className="h-4 w-4 text-cyan-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                AutoTrade <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">PRO</span>
              </span>
              
              {/* Bot Status Pill */}
              <div className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full flex items-center gap-1.5 border transition-all ${
                isRunning 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-sm shadow-emerald-500/10'
                  : isPaused
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  isRunning ? 'bg-emerald-400 animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-slate-500'
                }`} />
                {isRunning ? 'RUNNING' : isPaused ? 'PAUSED' : 'IDLE'}
              </div>

              {/* Mode Pill */}
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border hidden sm:inline-flex items-center gap-1 ${
                mode === 'live' 
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/25' 
                  : 'bg-blue-500/10 text-blue-300 border-blue-500/25'
              }`}>
                {mode === 'live' ? 'Live API' : 'Paper Trading'}
              </span>
            </div>
          </div>
        </div>

        {/* Center Live Latency / Engine Tag (Desktop) */}
        <div className="hidden md:flex items-center gap-4 text-[11px] text-slate-400 bg-white/[0.02] border border-white/[0.05] px-3 py-1 rounded-full">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Real-time Stream: <strong className="text-slate-200 font-mono">18ms</strong></span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-slate-300 font-medium">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>AI Multi-Strategy Active</span>
          </div>
        </div>

        {/* Right Actions & Controls */}
        <div className="flex items-center gap-2">
          {/* Main Bot Start / Pause / Stop Toggle Button */}
          <div className="flex items-center bg-[#101623] p-1 rounded-xl border border-white/[0.08] shadow-inner">
            {!isRunning ? (
              <button
                onClick={onStart}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                title="Jalankan Bot Trading Otomatis"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Mulai Bot
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-md shadow-amber-600/20 transition-all active:scale-95"
                title="Jeda Bot Trading"
              >
                <Pause className="h-3.5 w-3.5 fill-current" />
                Jeda
              </button>
            )}

            <button
              onClick={onStop}
              disabled={status === 'STOPPED'}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Hentikan Bot"
            >
              <Square className="h-3 w-3 fill-current" />
              Stop
            </button>
          </div>

          <div className="h-5 w-px bg-white/[0.08] hidden sm:block" />

          {/* Quick Manual Order Button */}
          <button
            onClick={onOpenManualOrder}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/25 hover:bg-blue-600/25 hover:border-blue-500/40 transition-all shadow-sm active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Order Manual</span>
          </button>

          {/* Strategy Config Modal Button */}
          <button
            onClick={onOpenStrategyModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-[#101623] text-slate-300 border border-white/[0.08] hover:bg-white/[0.05] hover:text-white transition-all active:scale-95"
            title="Pengaturan Parameter Strategi"
          >
            <Settings2 className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden md:inline">Strategi</span>
          </button>

          {/* Exchange API Key Modal Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-[#101623] text-slate-300 border border-white/[0.08] hover:bg-white/[0.05] hover:text-white transition-all active:scale-95"
            title="Integrasi Exchange API"
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">API Key</span>
            {isLiveExchangeConnected && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Reset Balance Button */}
          {mode === 'paper' && (
            <button
              onClick={onResetBalance}
              className="p-1.5 text-xs font-medium rounded-xl bg-[#101623] text-slate-400 border border-white/[0.08] hover:text-slate-200 hover:bg-white/[0.05] transition-all"
              title="Reset Saldo Akun Virtual ke $10,000 USD"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Panic Close All Button (Emergency) */}
          {hasOpenPositions && (
            <button
              onClick={onPanicClose}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600/30 transition-all shadow-lg shadow-red-600/10 animate-pulse"
              title="🚨 Tutup Darurat Seluruh Posisi Terbuka"
            >
              <AlertOctagon className="h-3.5 w-3.5" />
              <span>Panic Close</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
