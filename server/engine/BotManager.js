// server/engine/BotManager.js
import { MarketSimulator } from './MarketSimulator.js';
import { PaperConnector } from './connectors/PaperConnector.js';
import { ExchangeConnector } from './connectors/ExchangeConnector.js';
import { RsiEmaStrategy } from './strategies/RsiEmaStrategy.js';
import { GridStrategy } from './strategies/GridStrategy.js';
import { DcaStrategy } from './strategies/DcaStrategy.js';
import { MacdStrategy } from './strategies/MacdStrategy.js';

export class BotManager {
  constructor() {
    this.simulator = new MarketSimulator();
    this.paperExchange = new PaperConnector(10000);
    this.liveExchange = new ExchangeConnector();

    this.status = 'STOPPED'; // 'RUNNING' | 'PAUSED' | 'STOPPED'
    this.mode = 'paper'; // 'paper' | 'live'
    this.activeSymbol = 'BTC/USDT';
    this.activeStrategyKey = 'rsi_ema';

    this.strategies = {
      rsi_ema: new RsiEmaStrategy(),
      grid: new GridStrategy(),
      dca: new DcaStrategy(),
      macd: new MacdStrategy()
    };

    this.riskConfig = {
      maxOpenPositions: 5,
      maxDrawdownLimitPercent: 10.0,
      emergencyStopActive: false,
      dailyStartingEquity: 10000
    };

    this.logs = [];
    this.sseClients = new Set();
    this.tradeMarkers = []; // Chart markers for buys and sells

    this.addLog('INFO', 'Bot Engine berhasil diinisialisasi. Mode awal: Paper Trading (Simulasi).');
    this.setupListeners();
    this.simulator.start();
  }

  setupListeners() {
    this.simulator.onTick((tickUpdates) => {
      this.handleTick(tickUpdates);
    });
  }

  addLog(level, message, data = null) {
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now(),
      level, // 'INFO' | 'SIGNAL' | 'ORDER' | 'ALERT' | 'SUCCESS' | 'ERROR' | 'RISK'
      message,
      data
    };

    this.logs.unshift(entry);
    if (this.logs.length > 200) {
      this.logs.pop();
    }

    // Broadcast log to SSE
    this.broadcastSSE('log', entry);
    return entry;
  }

  handleTick(tickUpdates) {
    const currentPrices = {};
    for (const [symbol, data] of Object.entries(tickUpdates)) {
      currentPrices[symbol] = data.price;
    }

    // 1. Process automated SL/TP & Trailing Stop on paper exchange
    if (this.mode === 'paper') {
      const closedTrades = this.paperExchange.updatePositions(currentPrices);
      for (const trade of closedTrades) {
        const isWin = trade.realizedPnL >= 0;
        const level = isWin ? 'SUCCESS' : 'ALERT';
        this.addLog(
          level,
          `Posisi ditutup (${trade.reason}): ${trade.symbol} @ $${trade.exitPrice}. PnL: ${trade.realizedPnL >= 0 ? '+' : ''}$${trade.realizedPnL} (${trade.pnlPercent}%)`,
          trade
        );

        this.recordChartMarker({
          time: trade.exitTime,
          position: 'aboveBar',
          color: isWin ? '#00c076' : '#ff4d4f',
          shape: 'arrowDown',
          text: `SELL (${trade.reason})`
        });
      }

      // Check max drawdown risk protection
      const equity = this.paperExchange.getEquity(currentPrices);
      const drawdown = ((this.riskConfig.dailyStartingEquity - equity) / this.riskConfig.dailyStartingEquity) * 100;
      if (drawdown >= this.riskConfig.maxDrawdownLimitPercent && !this.riskConfig.emergencyStopActive) {
        this.riskConfig.emergencyStopActive = true;
        this.status = 'PAUSED';
        this.addLog('RISK', `PROTEKSI RESIKO: Drawdown mencapai ${drawdown.toFixed(1)}% (Batas: ${this.riskConfig.maxDrawdownLimitPercent}%). Bot otomatis DIJEDA!`);
      }
    }

    // 2. Evaluate active strategy if RUNNING
    if (this.status === 'RUNNING') {
      this.evaluateActiveStrategy(currentPrices);
    }

    // 3. Broadcast real-time tick to UI clients
    this.broadcastTick(tickUpdates);
  }

  evaluateActiveStrategy(currentPrices) {
    const strategy = this.strategies[this.activeStrategyKey];
    if (!strategy) return;

    const symbol = this.activeSymbol;
    const currentPrice = currentPrices[symbol];
    if (!currentPrice) return;

    const candles = this.simulator.getCandles(symbol, 120);
    const openPositions = this.mode === 'paper' ? this.paperExchange.positions : [];

    // Max open positions guard
    if (openPositions.length >= this.riskConfig.maxOpenPositions) {
      return;
    }

    const signal = strategy.evaluate(symbol, candles, currentPrice, openPositions);
    if (!signal) return;

    this.addLog('SIGNAL', `Sinyal terdeteksi [${strategy.name}]: ${signal.action} ${symbol} @ $${signal.price} (${signal.reason})`);

    // Execute signal
    this.executeSignal(signal);
  }

  executeSignal(signal) {
    if (this.mode === 'paper') {
      const config = this.simulator.symbols[signal.symbol];
      if (signal.action === 'BUY') {
        const rawAmount = signal.amountUSD / signal.price;
        const amount = +(Math.max(config.minQty, rawAmount)).toFixed(config.amountPrecision);

        const stopLoss = signal.stopLossPercent
          ? +(signal.price * (1 - signal.stopLossPercent / 100)).toFixed(config.precision)
          : null;
        const takeProfit = signal.takeProfitPercent
          ? +(signal.price * (1 + signal.takeProfitPercent / 100)).toFixed(config.precision)
          : null;

        const res = this.paperExchange.placeOrder({
          symbol: signal.symbol,
          side: 'BUY',
          amount,
          price: signal.price,
          stopLoss,
          takeProfit,
          trailingStop: signal.trailingStopPercent,
          strategy: this.strategies[this.activeStrategyKey].name
        });

        if (res.success) {
          this.addLog('ORDER', `Order BUY Berhasil: ${amount} ${signal.symbol} @ $${signal.price} | TP: $${takeProfit} | SL: $${stopLoss}`);
          this.recordChartMarker({
            time: Math.floor(Date.now() / 1000),
            position: 'belowBar',
            color: '#00c076',
            shape: 'arrowUp',
            text: `BUY ($${signal.price})`
          });
        } else {
          this.addLog('ERROR', `Gagal mengeksekusi BUY: ${res.error}`);
        }
      } else if (signal.action === 'SELL') {
        const res = this.paperExchange.placeOrder({
          symbol: signal.symbol,
          side: 'SELL',
          price: signal.price
        });

        if (res.success) {
          this.addLog('ORDER', `Order SELL Selesai: ${signal.symbol} @ $${signal.price}`);
        }
      }
    } else {
      // Live Exchange Execution
      if (!this.liveExchange.isConnected) {
        this.addLog('ERROR', `Exchange riil tidak terhubung. Periksa konfigurasi API Key.`);
        return;
      }
      this.addLog('ORDER', `[LIVE EXCHANGE] Mengirimkan order ke ${this.liveExchange.exchangeName.toUpperCase()}...`);
    }
  }

  recordChartMarker(marker) {
    this.tradeMarkers.push(marker);
    if (this.tradeMarkers.length > 100) this.tradeMarkers.shift();
    this.broadcastSSE('marker', marker);
  }

  // User Actions
  start() {
    this.status = 'RUNNING';
    this.riskConfig.emergencyStopActive = false;
    this.addLog('SUCCESS', `Bot Trading DIJALANKAN. Strategi: ${this.strategies[this.activeStrategyKey]?.name}, Pasar: ${this.activeSymbol}, Mode: ${this.mode.toUpperCase()}`);
    return { success: true, status: this.status };
  }

  pause() {
    this.status = 'PAUSED';
    this.addLog('INFO', 'Bot Trading DIJEDA oleh pengguna.');
    return { success: true, status: this.status };
  }

  stop() {
    this.status = 'STOPPED';
    this.addLog('INFO', 'Bot Trading DIHENTIKAN oleh pengguna.');
    return { success: true, status: this.status };
  }

  setMode(newMode) {
    if (newMode !== 'paper' && newMode !== 'live') {
      throw new Error('Mode harus paper atau live');
    }
    this.mode = newMode;
    this.addLog('INFO', `Mode operasional diganti ke: ${newMode === 'paper' ? 'Paper Trading (Simulasi Virtual)' : 'Live Exchange API'}`);
    return { success: true, mode: this.mode };
  }

  setSymbol(newSymbol) {
    if (!this.simulator.symbols[newSymbol]) {
      throw new Error(`Simbol ${newSymbol} tidak didukung`);
    }
    this.activeSymbol = newSymbol;
    this.addLog('INFO', `Pasar aktif diubah ke ${newSymbol}`);
    return { success: true, symbol: this.activeSymbol };
  }

  setStrategy(strategyKey, customConfig = null) {
    if (!this.strategies[strategyKey]) {
      throw new Error(`Strategi ${strategyKey} tidak ditemukan`);
    }
    this.activeStrategyKey = strategyKey;
    if (customConfig) {
      this.strategies[strategyKey].updateConfig(customConfig);
    }
    this.addLog('INFO', `Strategi aktif diubah ke: ${this.strategies[strategyKey].name}`);
    return { success: true, strategy: this.activeStrategyKey, config: this.strategies[strategyKey].config };
  }

  setSpeed(multiplier) {
    this.simulator.setSpeed(multiplier);
    this.addLog('INFO', `Kecepatan simulasi diatur ke ${multiplier}x`);
    return { success: true, speed: multiplier };
  }

  manualOrder({ symbol, side, amountUSD, price, stopLossPercent, takeProfitPercent }) {
    const sym = symbol || this.activeSymbol;
    const currentPrice = price || this.simulator.getPrice(sym);
    const symConfig = this.simulator.symbols[sym];
    const amount = +(amountUSD / currentPrice).toFixed(symConfig.amountPrecision);

    const stopLoss = stopLossPercent ? +(currentPrice * (1 - stopLossPercent / 100)).toFixed(symConfig.precision) : null;
    const takeProfit = takeProfitPercent ? +(currentPrice * (1 + takeProfitPercent / 100)).toFixed(symConfig.precision) : null;

    if (this.mode === 'paper') {
      const res = this.paperExchange.placeOrder({
        symbol: sym,
        side,
        amount,
        price: currentPrice,
        stopLoss,
        takeProfit,
        strategy: 'Manual Trade'
      });

      if (res.success) {
        this.addLog('ORDER', `Manual ${side} Sukses: ${amount} ${sym} @ $${currentPrice}`);
        this.recordChartMarker({
          time: Math.floor(Date.now() / 1000),
          position: side === 'BUY' ? 'belowBar' : 'aboveBar',
          color: side === 'BUY' ? '#00c076' : '#ff4d4f',
          shape: side === 'BUY' ? 'arrowUp' : 'arrowDown',
          text: `Manual ${side}`
        });
        return { success: true, message: 'Order manual berhasil' };
      } else {
        return { success: false, error: res.error };
      }
    } else {
      return { success: false, error: 'Manual trade pada live exchange memerlukan koneksi API aktif.' };
    }
  }

  closePosition(positionId) {
    if (this.mode === 'paper') {
      const pos = this.paperExchange.positions.find(p => p.id === positionId);
      if (!pos) return { success: false, error: 'Posisi tidak ditemukan' };

      const currentPrice = this.simulator.getPrice(pos.symbol);
      const res = this.paperExchange.closePosition(positionId, currentPrice, 'Manual Closed');
      if (res.success) {
        this.addLog('ORDER', `Posisi ditutup manual: ${pos.symbol} @ $${currentPrice}. PnL: $${res.trade.realizedPnL}`);
        return { success: true, trade: res.trade };
      }
      return { success: false, error: res.error };
    }
    return { success: false, error: 'Fitur close live position belum aktif' };
  }

  panicCloseAll() {
    if (this.mode === 'paper') {
      const currentPrices = {};
      for (const sym of Object.keys(this.simulator.symbols)) {
        currentPrices[sym] = this.simulator.getPrice(sym);
      }
      const closed = this.paperExchange.closeAllPositions(currentPrices, 'PANIC EMERGENCY CLOSE');
      this.status = 'PAUSED';
      this.addLog('ALERT', `🚨 EMERGENCY CLOSE: Seluruh ${closed.length} posisi terbuka dilikuidasi seketika! Bot dijeda.`);
      return { success: true, closedCount: closed.length };
    }
    return { success: false, error: 'Fitur panic close live position belum aktif' };
  }

  resetPaperAccount(amount = 10000) {
    this.paperExchange.reset(amount);
    this.tradeMarkers = [];
    this.riskConfig.dailyStartingEquity = amount;
    this.riskConfig.emergencyStopActive = false;
    this.addLog('INFO', `Akun simulasi di-reset ke saldo awal: $${amount.toLocaleString()}`);
    return { success: true, balance: amount };
  }

  // Server-Sent Events management
  registerSSEClient(res) {
    this.sseClients.add(res);
    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  broadcastSSE(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }

  broadcastTick(tickUpdates) {
    const currentPrices = {};
    for (const [symbol, data] of Object.entries(tickUpdates)) {
      currentPrices[symbol] = data.price;
    }

    const payload = {
      ticks: tickUpdates,
      activeSymbol: this.activeSymbol,
      status: this.status,
      mode: this.mode,
      activeStrategy: {
        key: this.activeStrategyKey,
        name: this.strategies[this.activeStrategyKey]?.name,
        config: this.strategies[this.activeStrategyKey]?.config
      },
      portfolio: this.paperExchange.getState(currentPrices),
      timestamp: Date.now()
    };

    this.broadcastSSE('tick', payload);
  }

  getFullState() {
    const currentPrices = {};
    for (const sym of Object.keys(this.simulator.symbols)) {
      currentPrices[sym] = this.simulator.getPrice(sym);
    }

    return {
      status: this.status,
      mode: this.mode,
      activeSymbol: this.activeSymbol,
      activeStrategyKey: this.activeStrategyKey,
      strategies: Object.fromEntries(
        Object.entries(this.strategies).map(([k, s]) => [k, { name: s.name, config: s.config }])
      ),
      speedMultiplier: this.simulator.speedMultiplier,
      symbols: this.simulator.symbols,
      allSnapshots: this.simulator.getAllSnapshots(),
      candles: this.simulator.getCandles(this.activeSymbol, 180),
      portfolio: this.paperExchange.getState(currentPrices),
      liveExchange: this.liveExchange.getConfigSummary(),
      riskConfig: this.riskConfig,
      logs: this.logs.slice(0, 50),
      tradeMarkers: this.tradeMarkers.slice(-50)
    };
  }
}
