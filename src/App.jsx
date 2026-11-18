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
import { TelegramBotModal } from './components/TelegramBotModal.jsx';
import { clientEngine } from './services/clientBotEngine.js';
import { telegramService } from './services/telegramService.js';

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
  resetPaperAccount,
  getIsClientEngineMode
} from './services/api.js';

export function App() {
  const [appState, setAppState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [candles, setCandles] = useState([]);
  const [activeTab, setActiveTab] = useState('positions');

  // Modals
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [manualOrderModalOpen, setManualOrderModalOpen] = useState(false);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);

  const activeSymbolRef = useRef('BTC/USDT');

  // Initial State Load
  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await fetchState();
        if (res && res.data) {
          setAppState(res.data);
          activeSymbolRef.current = res.data.activeSymbol;
          setCandles(res.data.candles || []);
        } else {
          const fallback = clientEngine.getFullState();
          setAppState(fallback);
          activeSymbolRef.current = fallback.activeSymbol;
          setCandles(fallback.candles || []);
        }
      } catch (err) {
        console.warn('Backend unavailable, using client engine:', err);
        const fallback = clientEngine.getFullState();
        setAppState(fallback);
        activeSymbolRef.current = fallback.activeSymbol;
        setCandles(fallback.candles || []);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  // Real-Time Event Streaming
  useEffect(() => {
    let eventSource = null;
    let fallbackCleanup = null;

    const handleTickUpdate = (tickData) => {
      setAppState(prev => {
        if (!prev) return prev;
        const activeSym = prev.activeSymbol;
        const activeTick = tickData.ticks[activeSym];

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

      if (tickData.ticks && tickData.ticks[activeSymbolRef.current]) {
        const currentCandle = tickData.ticks[activeSymbolRef.current].candle;
        setCandles(prevCandles => {
          if (!prevCandles || prevCandles.length === 0) return [currentCandle];
          const lastCandle = prevCandles[prevCandles.length - 1];

          if (lastCandle.time === currentCandle.time) {
            return [...prevCandles.slice(0, -1), currentCandle];
          } else if (currentCandle.time > lastCandle.time) {
            return [...prevCandles.slice(-180), currentCandle];
          }
          return prevCandles;
        });
      }
    };

    const handleLogUpdate = (newLog) => {
      setAppState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          logs: [newLog, ...(prev.logs || [])].slice(0, 100)
        };
      });
    };

    const handleMarkerUpdate = (newMarker) => {
      setAppState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tradeMarkers: [...(prev.tradeMarkers || []), newMarker].slice(-80)
        };
      });
    };

    const setupClientListeners = () => {
      clientEngine.tickListeners.push(handleTickUpdate);
      clientEngine.logListeners.push(handleLogUpdate);
      clientEngine.markerListeners.push(handleMarkerUpdate);

      fallbackCleanup = () => {
        clientEngine.tickListeners = clientEngine.tickListeners.filter(l => l !== handleTickUpdate);
        clientEngine.logListeners = clientEngine.logListeners.filter(l => l !== handleLogUpdate);
        clientEngine.markerListeners = clientEngine.markerListeners.filter(l => l !== handleMarkerUpdate);
      };
    };

    if (getIsClientEngineMode()) {
      setupClientListeners();
    } else {
      try {
        eventSource = new EventSource('/api/stream');

        eventSource.addEventListener('tick', (e) => {
          try {
            handleTickUpdate(JSON.parse(e.data));
          } catch (err) {}
        });

        eventSource.addEventListener('log', (e) => {
          try {
            handleLogUpdate(JSON.parse(e.data));
          } catch (err) {}
        });

        eventSource.addEventListener('marker', (e) => {
          try {
            handleMarkerUpdate(JSON.parse(e.data));
          } catch (err) {}
        });

        eventSource.onerror = () => {
          if (eventSource) eventSource.close();
          setupClientListeners();
        };
      } catch (err) {
        setupClientListeners();
      }
    }

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackCleanup) fallbackCleanup();
    };
  }, []);

  const handleSelectSymbol = async (symbol) => {
    activeSymbolRef.current = symbol;
    try {
      const res = await setBotSymbol(symbol);
      if (res && res.success) {
        setAppState(prev => ({ ...prev, activeSymbol: symbol }));
        const candleRes = await fetchCandles(symbol, 180);
        if (candleRes && candleRes.candles) {
          setCandles(candleRes.candles);
        }
      }
    } catch (err) {
      console.error('Error changing symbol:', err);
    }
  };

  const handleStart = async () => {
    try {
      const res = await startBot();
      if (res && res.success) {
        setAppState(prev => ({ ...prev, status: 'RUNNING' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePause = async () => {
    try {
      const res = await pauseBot();
      if (res && res.success) {
        setAppState(prev => ({ ...prev, status: 'PAUSED' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStop = async () => {
    try {
      const res = await stopBot();
      if (res && res.success) {
        setAppState(prev => ({ ...prev, status: 'STOPPED' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectMode = async (mode) => {
    try {
      const res = await setBotMode(mode);
      if (res && res.success) {
        setAppState(prev => ({ ...prev, mode }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectStrategy = async (strategyKey) => {
    try {
      const res = await setBotStrategy(strategyKey);
      if (res && res.success) {
        setAppState(prev => ({ ...prev, activeStrategyKey: strategyKey }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetSpeed = async (speed) => {
    try {
      const res = await setSimulationSpeed(speed);
      if (res && res.success) {
        setAppState(prev => ({ ...prev, speedMultiplier: speed }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveStrategyConfig = async (strategyKey, config) => {
    try {
      const res = await setBotStrategy(strategyKey, config);
      if (res && res.success) {
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
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-slate-300">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-semibold text-sm">Menyiapkan AutoTrade Pro...</span>
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
    <div className="min-h-screen flex flex-col bg-[#07090e] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.08),rgba(255,255,255,0))] text-slate-100 selection:bg-blue-600 selection:text-white">
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
        isTelegramConnected={telegramService.isConnected()}
        onOpenTelegramModal={() => setTelegramModalOpen(true)}
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
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 lg:p-6 space-y-4">
        {/* Performance Metrics KPI Strip */}
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
            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
              {/* Tab Navigation Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 pt-3 bg-[#0c101b]/60">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('positions')}
                    className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
                      activeTab === 'positions'
                        ? 'border-blue-500 text-blue-400 bg-white/[0.03]'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Posisi Terbuka</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] bg-white/[0.06] text-slate-300 font-mono">
                      {positions.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
                      activeTab === 'history'
                        ? 'border-blue-500 text-blue-400 bg-white/[0.03]'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Riwayat Transaksi</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] bg-white/[0.06] text-slate-300 font-mono">
                      {trades.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
                      activeTab === 'logs'
                        ? 'border-blue-500 text-blue-400 bg-white/[0.03]'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Log Aktivitas</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-4">
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

      <TelegramBotModal
        isOpen={telegramModalOpen}
        onClose={() => setTelegramModalOpen(false)}
        portfolio={appState.portfolio}
        status={appState.status}
        activeSymbol={activeSymbol}
      />
    </div>
  );
}
