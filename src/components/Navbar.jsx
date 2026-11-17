// src/components/Navbar.jsx
import React from 'react';
import { 
  Bot, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Key, 
  RefreshCw, 
  AlertOctagon, 
  PlusCircle, 
  Zap,
  TrendingUp,
  ShieldCheck,
  ShieldAlert
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
  const getStatusColor = () => {
    switch (status) {
      case 'RUNNING':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'PAUSED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-700/30 text-slate-400 border-slate-700';
    }
  };

  return (
    <header className="border-b border-[#1f293d] bg-[#0f141f]/95 backdrop-blur px-4 py-3 sticky top-0 z-30">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-[1920px] mx-auto">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                AutoTrade <span className="text-blue-400">PRO</span>
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${getStatusColor()}`}>
                <span className={`h-2 w-2 rounded-full ${status === 'RUNNING' ? 'bg-emerald-400 animate-pulse' : status === 'PAUSED' ? 'bg-amber-400' : 'bg-slate-500'}`} />
                {status}
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                mode === 'live' 
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' 
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}>
                {mode === 'live' ? '⚡ LIVE EXCHANGE' : '🧪 PAPER TRADING'}
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-Asset Algorithmic Trading Platform</p>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Bot Action Buttons */}
          <div className="flex items-center bg-[#161c28] p-1 rounded-lg border border-[#1f293d]">
            {status !== 'RUNNING' ? (
              <button
                onClick={onStart}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
                title="Mulai Bot Trading"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Mulai
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-sm"
                title="Jeda Bot"
              >
                <Pause className="h-3.5 w-3.5 fill-current" />
                Jeda
              </button>
            )}

            <button
              onClick={onStop}
              disabled={status === 'STOPPED'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Hentikan Bot"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop
            </button>
          </div>

          <div className="h-6 w-px bg-[#1f293d]" />

          {/* Manual Order Button */}
          <button
            onClick={onOpenManualOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-all"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            + Order Manual
          </button>

          {/* Strategy Modal */}
          <button
            onClick={onOpenStrategyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#161c28] text-slate-300 border border-[#1f293d] hover:bg-[#1f293d] transition-all"
            title="Konfigurasi Strategi & Parameter"
          >
            <Settings className="h-3.5 w-3.5 text-slate-400" />
            Strategi
          </button>

          {/* Exchange API Keys Modal */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#161c28] text-slate-300 border border-[#1f293d] hover:bg-[#1f293d] transition-all"
            title="Pengaturan API Exchange Riil"
          >
            <Key className="h-3.5 w-3.5 text-amber-400" />
            API Key
            {isLiveExchangeConnected && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Reset Paper Account Balance */}
          {mode === 'paper' && (
            <button
              onClick={onResetBalance}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#161c28] text-slate-400 border border-[#1f293d] hover:text-slate-200 hover:bg-[#1f293d] transition-all"
              title="Reset Saldo Akun Virtual ke $10,000"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Saldo
            </button>
          )}

          {/* Panic Close Button */}
          {hasOpenPositions && (
            <button
              onClick={onPanicClose}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600/30 transition-all animate-pulse"
              title="Likuidasi darurat seluruh posisi terbuka!"
            >
              <AlertOctagon className="h-3.5 w-3.5" />
              Panic Close All
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
