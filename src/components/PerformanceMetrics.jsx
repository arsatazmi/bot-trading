// src/components/PerformanceMetrics.jsx
import React from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters.js';
import { 
  Wallet2, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Zap,
  Target
} from 'lucide-react';

export function PerformanceMetrics({ portfolio = {} }) {
  const balance = portfolio.balance || 10000;
  const equity = portfolio.equity || 10000;
  const marginUsed = portfolio.marginUsed || 0;
  const unrealizedPnL = portfolio.unrealizedPnL || 0;
  const stats = portfolio.stats || {};

  const netPnL = stats.netPnL || 0;
  const winRate = stats.winRate || 0;
  const totalTrades = stats.totalTrades || 0;
  const wins = stats.winningTrades || 0;
  const losses = stats.losingTrades || 0;
  const profitFactor = stats.profitFactor || 0;

  const isNetPnLPositive = netPnL >= 0;
  const isUnrealizedPositive = unrealizedPnL >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {/* 1. Total Ekuitas */}
      <div className="glass-card rounded-2xl p-3.5 flex flex-col justify-between hover:border-white/[0.1] transition-all">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total Ekuitas</span>
          <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Wallet2 className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="text-xl font-extrabold font-mono text-white tracking-tight">
            {formatCurrency(equity)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            Margin: <span className="text-slate-300 font-mono font-medium">{formatCurrency(marginUsed)}</span>
          </div>
        </div>
      </div>

      {/* 2. Saldo Tersedia */}
      <div className="glass-card rounded-2xl p-3.5 flex flex-col justify-between hover:border-white/[0.1] transition-all">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Saldo Tersedia</span>
          <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Coins className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="text-xl font-extrabold font-mono text-emerald-400 tracking-tight">
            {formatCurrency(balance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            USDT Siap Digunakan
          </div>
        </div>
      </div>

      {/* 3. Realized PnL */}
      <div className="glass-card rounded-2xl p-3.5 flex flex-col justify-between hover:border-white/[0.1] transition-all">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Net Realized PnL</span>
          <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${
            isNetPnLPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            {isNetPnLPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          </div>
        </div>
        <div className="mt-1.5">
          <div className={`text-xl font-extrabold font-mono tracking-tight ${isNetPnLPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isNetPnLPositive ? '+' : ''}{formatCurrency(netPnL)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            Profit Factor: <span className="text-slate-200 font-mono font-semibold">{profitFactor}x</span>
          </div>
        </div>
      </div>

      {/* 4. Floating PnL */}
      <div className="glass-card rounded-2xl p-3.5 flex flex-col justify-between hover:border-white/[0.1] transition-all">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Floating PnL</span>
          <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${
            isUnrealizedPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            <Zap className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className={`text-xl font-extrabold font-mono tracking-tight ${isUnrealizedPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isUnrealizedPositive ? '+' : ''}{formatCurrency(unrealizedPnL)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            Posisi: <span className="text-slate-200 font-mono font-medium">{(portfolio.positions || []).length} Terbuka</span>
          </div>
        </div>
      </div>

      {/* 5. Win Rate */}
      <div className="glass-card rounded-2xl p-3.5 flex flex-col justify-between hover:border-white/[0.1] transition-all col-span-2 md:col-span-4 lg:col-span-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Win Rate</span>
          <div className="h-6 w-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Target className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold font-mono text-purple-400 tracking-tight">
              {winRate}%
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              <strong className="text-emerald-400">{wins}W</strong> / <strong className="text-rose-400">{losses}L</strong> ({totalTrades})
            </span>
          </div>
          <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
