// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { TickerBar } from './components/TickerBar.jsx';
import { PerformanceMetrics } from './components/PerformanceMetrics.jsx';
import { ChartView } from './components/ChartView.jsx';
import { BotControlPanel } from './components/BotControlPanel.jsx';
import { OrderBook } from './components/OrderBook.jsx';
import { ActivePositions } from './components/ActivePositions.jsx';
import { TradeHistory } from './components/TradeHistory.jsx';
import { BotLogStream } from './components/BotLogStream.jsx';
import { StrategyConfigModal } from './components/StrategyConfigModal.jsx';
import { ExchangeSettingsModal } from './components/ExchangeSettingsModal.jsx';
import { ManualOrderModal } from './components/ManualOrderModal.jsx';

import {
  fetchState,
  fetchCandles,
  startBot,
  pauseBot,
  stopBot,
  setBotMode,
  setBotSymbol,
  setBotStrategy,
  setSimulationSpeed,
  placeManualOrder,
  closePosition,
  panicCloseAll,
  resetPaperAccount
} from './services/api.js';

export function App() {
  const [appState, setAppState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [candles, setCandles] = useState([]);
  const [activeTab, setActiveTab] = useState('positions'); // 'positions' | 'history' | 'logs'

  // Modals
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [manualOrderModalOpen, setManualOrderModalOpen] = useState(false);

  // Active Symbol & Ticker ref
  const activeSymbolRef = useRef('BTC/USDT');

  // Initial State Fetch
  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await fetchState();
        if (res.success && res.data) {
          setAppState(res.data);
          activeSymbolRef.current = res.data.activeSymbol;
          setCandles(res.data.candles || []);
        }
      } catch (err) {
        console.error('Failed to load initial state:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  // Server-Sent Events (SSE) Live Stream
  useEffect(() => {
    const eventSource = new EventSource('/api/stream');

    eventSource.addEventListener('tick', (e) => {
      try {
        const tickData = JSON.parse(e.data);

        setAppState(prev => {
          if (!prev) return prev;
          const activeSym = prev.activeSymbol;
          const activeTick = tickData.ticks[activeSym];

          // Update snapshots
          const updatedSnapshots = { ...prev.allSnapshots };
          for (const [sym, tick] of Object.entries(tickData.ticks)) {
            updatedSnapshots[sym] = {
              ...(updatedSnapshots[sym] || {}),
              currentPrice: tick.price,
              change24h: tick.change24h,
              high24h: tick.high24h,
              low24h: tick.low24h,
              volume24h: tick.volume24h,
              orderBook: tick.orderBook
            };
          }

          return {
            ...prev,
            status: tickData.status,
            mode: tickData.mode,
            portfolio: tickData.portfolio,
            allSnapshots: updatedSnapshots
          };
        });

        // Update current candles for active symbol
        if (tickData.ticks[activeSymbolRef.current]) {
          const currentCandle = tickData.ticks[activeSymbolRef.current].candle;
          setCandles(prevCandles => {
            if (!prevCandles || prevCandles.length === 0) return prevCandles;
            const lastCandle = prevCandles[prevCandles.length - 1];

            if (lastCandle.time === currentCandle.time) {
              // Update last candle in-place
              return [...prevCandles.slice(0, -1), currentCandle];
            } else if (currentCandle.time > lastCandle.time) {
              // Append new candle
              return [...prevCandles.slice(-180), currentCandle];
            }
            return prevCandles;
          });
        }
      } catch (err) {
        console.error('SSE tick parse error:', err);
      }
    });

    eventSource.addEventListener('log', (e) => {
      try {
        const newLog = JSON.parse(e.data);
        setAppState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            logs: [newLog, ...(prev.logs || [])].slice(0, 100)
          };
        });
      } catch (err) {
        console.error('SSE log parse error:', err);
      }
    });

    eventSource.addEventListener('marker', (e) => {
      try {
        const newMarker = JSON.parse(e.data);
        setAppState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            tradeMarkers: [...(prev.tradeMarkers || []), newMarker].slice(-80)
          };
        });
      } catch (err) {
        console.error('SSE marker parse error:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // Symbol Change Handler
  const handleSelectSymbol = async (symbol) => {
    activeSymbolRef.current = symbol;
    try {
      const res = await setBotSymbol(symbol);
      if (res.success) {
        setAppState(prev => ({ ...prev, activeSymbol: symbol }));
        // Fetch fresh candles for new symbol
        const candleRes = await fetchCandles(symbol, 180);
        if (candleRes.success) {
          setCandles(candleRes.candles);
        }
      }
    } catch (err) {
      console.error('Error changing symbol:', err);
    }
  };

  // Bot Lifecycle Handlers
  const handleStart = async () => {
    try {
      const res = await startBot();
      if (res.success) {
        setAppState(prev => ({ ...prev, status: 'RUNNING' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePause = async () => {
    try {
      const res = await pauseBot();
      if (res.success) {
        setAppState(prev => ({ ...prev, status: 'PAUSED' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStop = async () => {
    try {
      const res = await stopBot();
      if (res.success) {
        setAppState(prev => ({ ...prev, status: 'STOPPED' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectMode = async (mode) => {
    try {
      const res = await setBotMode(mode);
      if (res.success) {
        setAppState(prev => ({ ...prev, mode }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectStrategy = async (strategyKey) => {
    try {
      const res = await setBotStrategy(strategyKey);
      if (res.success) {
        setAppState(prev => ({ ...prev, activeStrategyKey: strategyKey }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetSpeed = async (speed) => {
    try {
      const res = await setSimulationSpeed(speed);
      if (res.success) {
        setAppState(prev => ({ ...prev, speedMultiplier: speed }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveStrategyConfig = async (strategyKey, config) => {
    try {
      const res = await setBotStrategy(strategyKey, config);
      if (res.success) {
        setAppState(prev => ({
          ...prev,
          activeStrategyKey: strategyKey,
          strategies: {
            ...prev.strategies,
            [strategyKey]: {
              ...prev.strategies[strategyKey],
              config
            }
          }
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClosePosition = async (id) => {
    try {
      await closePosition(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePanicClose = async () => {
    if (confirm('APAKAH ANDA YAKIN? Semua posisi terbuka akan langsung ditutup darurat di harga pasar!')) {
      try {
        await panicCloseAll();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleResetBalance = async () => {
    if (confirm('Reset saldo virtual paper trading kembali ke $10,000 USD?')) {
      try {
        await resetPaperAccount(10000);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleManualOrder = async (orderData) => {
    return await placeManualOrder(orderData);
  };

  if (loading || !appState) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center text-slate-300">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-semibold text-sm">Memuat AutoTrade Pro Engine...</span>
      </div>
    );
  }

  const activeSymbol = appState.activeSymbol;
  const activeSnapshot = appState.allSnapshots?.[activeSymbol] || {};
  const currentPrice = activeSnapshot.currentPrice || appState.symbols?.[activeSymbol]?.basePrice || 0;
  const positions = appState.portfolio?.positions || [];
  const trades = appState.portfolio?.tradeHistory || [];
  const logs = appState.logs || [];
  const markers = appState.tradeMarkers || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0e14] text-slate-100">
      {/* 1. Header Navbar */}
      <Navbar
        status={appState.status}
        mode={appState.mode}
        onStart={handleStart}
        onPause={handlePause}
        onStop={handleStop}
        onOpenSettings={() => setExchangeModalOpen(true)}
        onOpenStrategyModal={() => setConfigModalOpen(true)}
        onOpenManualOrder={() => setManualOrderModalOpen(true)}
        onResetBalance={handleResetBalance}
        onPanicClose={handlePanicClose}
        hasOpenPositions={positions.length > 0}
        isLiveExchangeConnected={appState.liveExchange?.isConnected}
      />

      {/* 2. Ticker Bar with Multi-Asset Switching */}
      <TickerBar
        symbols={appState.symbols}
        activeSymbol={activeSymbol}
        onSelectSymbol={handleSelectSymbol}
        activeTickerData={activeSnapshot}
        allSnapshots={appState.allSnapshots}
      />

      {/* 3. Main Dashboard Workspace */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 space-y-4">
        {/* Performance Metrics Row */}
        <PerformanceMetrics portfolio={appState.portfolio} />

        {/* Primary Interactive Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column (8 cols): Interactive Chart & Tables */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Live Candlestick & RSI Chart */}
            <ChartView
              candles={candles}
              markers={markers}
              activeSymbol={activeSymbol}
              currentPrice={currentPrice}
            />

            {/* Bottom Tabbed Area (Positions, History, Logs) */}
            <div className="bg-[#121721] rounded-xl border border-[#1f293d] overflow-hidden shadow-lg">
              {/* Tab Navigation Header */}
              <div className="flex items-center justify-between border-b border-[#1f293d] px-4 pt-2 bg-[#151b27]">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('positions')}
                    className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
                      activeTab === 'positions'
                        ? 'border-blue-500 text-blue-400 bg-[#121721]'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Posisi Terbuka</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                      {positions.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
                      activeTab === 'history'
                        ? 'border-blue-500 text-blue-400 bg-[#121721]'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Riwayat Transaksi</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                      {trades.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
                      activeTab === 'logs'
                        ? 'border-blue-500 text-blue-400 bg-[#121721]'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Log Aktivitas</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-3">
                {activeTab === 'positions' && (
                  <ActivePositions
                    positions={positions}
                    onClosePosition={handleClosePosition}
                  />
                )}

                {activeTab === 'history' && (
                  <TradeHistory trades={trades} />
                )}

                {activeTab === 'logs' && (
                  <BotLogStream logs={logs} />
                )}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Bot Controls & Order Book */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Bot Controls & Strategy Settings */}
            <BotControlPanel
              status={appState.status}
              mode={appState.mode}
              activeStrategyKey={appState.activeStrategyKey}
              strategies={appState.strategies}
              speedMultiplier={appState.speedMultiplier}
              onStart={handleStart}
              onPause={handlePause}
              onStop={handleStop}
              onSelectStrategy={handleSelectStrategy}
              onSelectMode={handleSelectMode}
              onSetSpeed={handleSetSpeed}
              onOpenConfigModal={() => setConfigModalOpen(true)}
            />

            {/* Live Order Book Depth */}
            <OrderBook
              orderBook={activeSnapshot.orderBook}
              symbol={activeSymbol}
            />

            {/* Quick Live Terminal Log Preview */}
            <div className="hidden xl:block">
              <BotLogStream logs={logs} />
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <StrategyConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        activeStrategyKey={appState.activeStrategyKey}
        strategies={appState.strategies}
        onSaveConfig={handleSaveStrategyConfig}
      />

      <ExchangeSettingsModal
        isOpen={exchangeModalOpen}
        onClose={() => setExchangeModalOpen(false)}
        liveExchangeInfo={appState.liveExchange}
        onConfigSaved={(res) => {
          setAppState(prev => ({
            ...prev,
            liveExchange: res.summary
          }));
        }}
      />

      <ManualOrderModal
        isOpen={manualOrderModalOpen}
        onClose={() => setManualOrderModalOpen(false)}
        symbols={appState.symbols}
        activeSymbol={activeSymbol}
        currentPrice={currentPrice}
        onSubmitOrder={handleManualOrder}
      />
    </div>
  );
}
