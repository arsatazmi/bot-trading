// src/components/PerformanceMetrics.jsx
import React from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters.js';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  PieChart, 
  ShieldAlert,
  Percent
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
  const maxDrawdown = stats.maxDrawdownPercent || 0;

  const isNetPnLPositive = netPnL >= 0;
  const isUnrealizedPositive = unrealizedPnL >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {/* Total Equity */}
      <div className="bg-[#121721] rounded-xl border border-[#1f293d] p-3 flex flex-col justify-between shadow-md">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Total Ekuitas</span>
          <div className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Wallet className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-lg font-bold font-mono text-white">
            {formatCurrency(equity)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Margin: <span className="text-slate-300 font-mono">{formatCurrency(marginUsed)}</span>
          </div>
        </div>
      </div>

      {/* Saldo Kas Tersedia */}
      <div className="bg-[#121721] rounded-xl border border-[#1f293d] p-3 flex flex-col justify-between shadow-md">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Saldo Tersedia (USDT)</span>
          <div className="h-6 w-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <PieChart className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-lg font-bold font-mono text-emerald-400">
            {formatCurrency(balance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Siap untuk order baru
          </div>
        </div>
      </div>

      {/* Realized Net PnL */}
      <div className="bg-[#121721] rounded-xl border border-[#1f293d] p-3 flex flex-col justify-between shadow-md">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Net Realized PnL</span>
          <div className={`h-6 w-6 rounded-md flex items-center justify-center ${
            isNetPnLPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            {isNetPnLPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          </div>
        </div>
        <div className="mt-2">
          <div className={`text-lg font-bold font-mono ${isNetPnLPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isNetPnLPositive ? '+' : ''}{formatCurrency(netPnL)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Profit Factor: <span className="text-slate-200 font-mono font-semibold">{profitFactor}x</span>
          </div>
        </div>
      </div>

      {/* Unrealized Floating PnL */}
      <div className="bg-[#121721] rounded-xl border border-[#1f293d] p-3 flex flex-col justify-between shadow-md">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Floating PnL Posisi</span>
          <div className={`h-6 w-6 rounded-md flex items-center justify-center ${
            isUnrealizedPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            <Award className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <div className={`text-lg font-bold font-mono ${isUnrealizedPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isUnrealizedPositive ? '+' : ''}{formatCurrency(unrealizedPnL)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Posisi Aktif: <span className="text-slate-200 font-mono">{(portfolio.positions || []).length}</span>
          </div>
        </div>
      </div>

      {/* Win Rate & Trades */}
      <div className="bg-[#121721] rounded-xl border border-[#1f293d] p-3 flex flex-col justify-between shadow-md col-span-2 md:col-span-4 lg:col-span-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Win Rate & Eksekusi</span>
          <div className="h-6 w-6 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Percent className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold font-mono text-purple-400">
              {winRate}%
            </span>
            <span className="text-[11px] text-slate-400">
              <span className="text-emerald-400 font-bold">{wins}W</span> / <span className="text-rose-400 font-bold">{losses}L</span>
            </span>
          </div>
          {/* Win Rate Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
