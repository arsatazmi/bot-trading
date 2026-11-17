// src/services/clientBotEngine.js
// Client-side fallback Bot Engine for static hosting (Vercel, Netlify, etc.)

export class ClientBotEngine {
  constructor() {
    this.symbols = {
      'BTC/USDT': { name: 'Bitcoin', type: 'crypto', basePrice: 68500, volatility: 0.0018, precision: 2, amountPrecision: 4, minQty: 0.001 },
      'ETH/USDT': { name: 'Ethereum', type: 'crypto', basePrice: 3450, volatility: 0.0022, precision: 2, amountPrecision: 3, minQty: 0.01 },
      'SOL/USDT': { name: 'Solana', type: 'crypto', basePrice: 182, volatility: 0.0035, precision: 2, amountPrecision: 2, minQty: 0.1 },
      'EUR/USD': { name: 'Euro / US Dollar', type: 'forex', basePrice: 1.0850, volatility: 0.0004, precision: 4, amountPrecision: 2, minQty: 100 },
      'XAU/USD': { name: 'Gold / US Dollar', type: 'commodity', basePrice: 2680, volatility: 0.0012, precision: 2, amountPrecision: 2, minQty: 0.1 }
    };

    this.status = 'STOPPED'; // 'RUNNING' | 'PAUSED' | 'STOPPED'
    this.mode = 'paper';
    this.activeSymbol = 'BTC/USDT';
    this.activeStrategyKey = 'rsi_ema';
    this.speedMultiplier = 1;

    this.strategies = {
      rsi_ema: {
        name: 'RSI + EMA Trend',
        config: { rsiPeriod: 14, rsiOversold: 32, rsiOverbought: 68, emaFastPeriod: 9, emaSlowPeriod: 21, tradeAmountUSD: 500, stopLossPercent: 2.5, takeProfitPercent: 4.0, trailingStopPercent: 1.5, cooldownSeconds: 20 }
      },
      grid: {
        name: 'Grid Trading',
        config: { rangePercent: 4.0, gridCount: 6, orderAmountUSD: 250, takeProfitPercent: 1.5, stopLossPercent: 5.0, cooldownSeconds: 15 }
      },
      dca: {
        name: 'DCA Martingale',
        config: { baseOrderUSD: 300, safetyOrderUSD: 300, maxSafetyOrders: 4, priceDropStepPercent: 1.5, volumeScale: 1.2, takeProfitPercent: 2.5, stopLossPercent: 7.0, cooldownSeconds: 20 }
      },
      macd: {
        name: 'MACD Momentum',
        config: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, tradeAmountUSD: 500, stopLossPercent: 2.0, takeProfitPercent: 3.5, trailingStopPercent: 1.5, cooldownSeconds: 20 }
      }
    };

    this.riskConfig = {
      maxOpenPositions: 5,
      maxDrawdownLimitPercent: 10.0,
      emergencyStopActive: false,
      dailyStartingEquity: 10000
    };

    // Virtual Portfolio
    this.balance = 10000;
    this.positions = [];
    this.tradeHistory = [];
    this.stats = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      netPnL: 0,
      winRate: 0,
      profitFactor: 0,
      maxDrawdownPercent: 0,
      peakEquity: 10000
    };

    this.logs = [];
    this.tradeMarkers = [];
    this.data = {};
    this.tickListeners = [];
    this.logListeners = [];
    this.markerListeners = [];
    this.timer = null;
    this.lastStrategySignalTime = 0;

    this.initializeMarketData();
    this.addLog('INFO', 'Client-side Trading Bot Engine diaktifkan. Mode Paper Trading siap.');
    this.startSimulationLoop();
  }

  initializeMarketData() {
    const now = Math.floor(Date.now() / 1000);
    const candleCount = 180;
    const timeframeSeconds = 60;

    for (const [symbol, config] of Object.entries(this.symbols)) {
      let currentPrice = config.basePrice;
      const candles = [];
      const startTime = now - (candleCount * timeframeSeconds);

      for (let i = 0; i < candleCount; i++) {
        const time = startTime + (i * timeframeSeconds);
        const cycle = Math.sin(i / 15) * 0.001;
        const randomChange = (Math.random() - 0.495 + cycle) * config.volatility * currentPrice;
        const open = currentPrice;
        const close = +(open + randomChange).toFixed(config.precision);
        const wick = Math.abs(randomChange) * 1.2;
        const high = +(Math.max(open, close) + wick).toFixed(config.precision);
        const low = +(Math.min(open, close) - wick).toFixed(config.precision);
        const volume = +(Math.random() * (config.type === 'crypto' ? 12 : 250) + 2).toFixed(2);

        candles.push({ time, open, high, low, close, volume });
        currentPrice = close;
      }

      const latest = candles[candles.length - 1];
      const open24h = candles[0].open;

      this.data[symbol] = {
        config,
        candles,
        currentPrice: latest.close,
        open24h,
        change24h: +(((latest.close - open24h) / open24h) * 100).toFixed(2),
        high24h: Math.max(...candles.map(c => c.high)),
        low24h: Math.min(...candles.map(c => c.low)),
        volume24h: +candles.reduce((s, c) => s + c.volume, 0).toFixed(2),
        currentCandle: {
          time: now,
          open: latest.close,
          high: latest.close,
          low: latest.close,
          close: latest.close,
          volume: 0,
          ticksCount: 0
        },
        orderBook: this.generateOrderBook(symbol, latest.close)
      };
    }
  }

  generateOrderBook(symbol, price) {
    const config = this.symbols[symbol];
    const bids = [];
    const asks = [];
    const step = price * 0.0003;
    let cumB = 0;
    let cumA = 0;

    for (let i = 1; i <= 8; i++) {
      const bPrice = +(price - i * step).toFixed(config.precision);
      const aPrice = +(price + i * step).toFixed(config.precision);
      const bQty = +(Math.random() * 2 + 0.2).toFixed(config.amountPrecision);
      const aQty = +(Math.random() * 2 + 0.2).toFixed(config.amountPrecision);
      cumB += bQty;
      cumA += aQty;
      bids.push({ price: bPrice, amount: bQty, total: +cumB.toFixed(config.amountPrecision) });
      asks.push({ price: aPrice, amount: aQty, total: +cumA.toFixed(config.amountPrecision) });
    }

    return { bids, asks: asks.reverse(), spread: +(asks[asks.length - 1]?.price - bids[0]?.price || 0).toFixed(config.precision) };
  }

  startSimulationLoop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.tick();
    }, Math.max(150, Math.floor(1000 / this.speedMultiplier)));
  }

  tick() {
    const now = Math.floor(Date.now() / 1000);
    const tickUpdates = {};

    for (const [symbol, symData] of Object.entries(this.data)) {
      const config = symData.config;
      const noise = (Math.random() - 0.495) * config.volatility * symData.currentPrice;
      let newPrice = +(symData.currentPrice + noise).toFixed(config.precision);
      if (newPrice <= 0) newPrice = config.basePrice;

      symData.currentPrice = newPrice;
      const curr = symData.currentCandle;
      curr.close = newPrice;
      if (newPrice > curr.high) curr.high = newPrice;
      if (newPrice < curr.low) curr.low = newPrice;
      curr.volume = +(curr.volume + Math.random() * 0.4).toFixed(2);
      curr.ticksCount = (curr.ticksCount || 0) + 1;

      const secondsPerCandle = Math.max(5, Math.floor(60 / this.speedMultiplier));
      if (curr.ticksCount >= secondsPerCandle) {
        symData.candles.push({ ...curr });
        if (symData.candles.length > 300) symData.candles.shift();
        symData.currentCandle = {
          time: now,
          open: newPrice,
          high: newPrice,
          low: newPrice,
          close: newPrice,
          volume: 0,
          ticksCount: 0
        };
      }

      symData.change24h = +(((symData.currentPrice - symData.open24h) / symData.open24h) * 100).toFixed(2);
      if (newPrice > symData.high24h) symData.high24h = newPrice;
      if (newPrice < symData.low24h) symData.low24h = newPrice;
      symData.orderBook = this.generateOrderBook(symbol, newPrice);

      tickUpdates[symbol] = {
        symbol,
        price: symData.currentPrice,
        change24h: symData.change24h,
        high24h: symData.high24h,
        low24h: symData.low24h,
        volume24h: symData.volume24h,
        candle: { ...symData.currentCandle },
        orderBook: symData.orderBook
      };
    }

    const currentPrices = {};
    for (const [s, t] of Object.entries(tickUpdates)) {
      currentPrices[s] = t.price;
    }

    // SL / TP / Trailing Stop evaluation
    this.evaluateExits(currentPrices);

    // Bot Strategy evaluation if RUNNING
    if (this.status === 'RUNNING') {
      this.evaluateStrategy(currentPrices);
    }

    // Broadcast tick to UI
    const payload = {
      ticks: tickUpdates,
      activeSymbol: this.activeSymbol,
      status: this.status,
      mode: this.mode,
      portfolio: this.getPortfolioState(currentPrices)
    };

    for (const listener of this.tickListeners) {
      listener(payload);
    }
  }

  evaluateExits(currentPrices) {
    for (let i = this.positions.length - 1; i >= 0; i--) {
      const pos = this.positions[i];
      const price = currentPrices[pos.symbol];
      if (!price) continue;

      pos.currentPrice = price;
      pos.unrealizedPnL = +((price - pos.entryPrice) * pos.amount).toFixed(2);
      pos.unrealizedPnLPercent = +(((price - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2);

      // Trailing stop
      if (pos.trailingStop) {
        if (price > pos.trailingStop.highestPrice) {
          pos.trailingStop.highestPrice = price;
        }
        const trailPrice = pos.trailingStop.highestPrice * (1 - pos.trailingStop.percent / 100);
        if (price <= trailPrice && pos.unrealizedPnL > 0) {
          this.closePosition(pos.id, `Trailing Stop Hit (${pos.trailingStop.percent}%)`);
          continue;
        }
      }

      // Take Profit
      if (pos.takeProfit && price >= pos.takeProfit) {
        this.closePosition(pos.id, `Take Profit Hit ($${pos.takeProfit})`);
        continue;
      }

      // Stop Loss
      if (pos.stopLoss && price <= pos.stopLoss) {
        this.closePosition(pos.id, `Stop Loss Hit ($${pos.stopLoss})`);
        continue;
      }
    }
  }

  evaluateStrategy(currentPrices) {
    const symbol = this.activeSymbol;
    const price = currentPrices[symbol];
    if (!price) return;

    if (this.positions.length >= this.riskConfig.maxOpenPositions) return;

    const now = Math.floor(Date.now() / 1000);
    const strategyObj = this.strategies[this.activeStrategyKey];
    const cfg = strategyObj.config;

    if (this.lastStrategySignalTime && (now - this.lastStrategySignalTime) < (cfg.cooldownSeconds || 20)) {
      return;
    }

    const candles = this.getCandles(symbol, 120);
    const closes = candles.map(c => c.close);
    if (closes.length < 30) return;

    const rsi = this.calcRSI(closes, cfg.rsiPeriod || 14);
    const emaFast = this.calcEMA(closes, cfg.emaFastPeriod || 9);
    const emaSlow = this.calcEMA(closes, cfg.emaSlowPeriod || 21);

    const hasPos = this.positions.some(p => p.symbol === symbol && p.side === 'BUY');

    if (this.activeStrategyKey === 'rsi_ema') {
      if (!hasPos && (rsi <= (cfg.rsiOversold || 32) || (emaFast > emaSlow && rsi < 60))) {
        this.lastStrategySignalTime = now;
        this.addLog('SIGNAL', `Sinyal BUY [${strategyObj.name}]: RSI ${rsi.toFixed(1)} / EMA Cross @ $${price}`);
        this.executeBuy(symbol, price, cfg.tradeAmountUSD || 500, cfg.stopLossPercent, cfg.takeProfitPercent, cfg.trailingStopPercent, strategyObj.name);
      } else if (hasPos && (rsi >= (cfg.rsiOverbought || 68) || emaFast < emaSlow)) {
        this.lastStrategySignalTime = now;
        this.addLog('SIGNAL', `Sinyal SELL [${strategyObj.name}]: RSI ${rsi.toFixed(1)} @ $${price}`);
        const pos = this.positions.find(p => p.symbol === symbol && p.side === 'BUY');
        if (pos) this.closePosition(pos.id, 'Sinyal Strategi RSI/EMA');
      }
    } else if (this.activeStrategyKey === 'grid') {
      if (this.positions.length < (cfg.gridCount || 6)) {
        this.lastStrategySignalTime = now;
        this.addLog('SIGNAL', `Sinyal Grid [${strategyObj.name}]: Level order eksekusi @ $${price}`);
        this.executeBuy(symbol, price, cfg.orderAmountUSD || 250, cfg.stopLossPercent, cfg.takeProfitPercent, null, strategyObj.name);
      }
    } else if (this.activeStrategyKey === 'dca') {
      if (!hasPos) {
        this.lastStrategySignalTime = now;
        this.addLog('SIGNAL', `Sinyal DCA [${strategyObj.name}]: Base Order eksekusi @ $${price}`);
        this.executeBuy(symbol, price, cfg.baseOrderUSD || 300, cfg.stopLossPercent, cfg.takeProfitPercent, null, strategyObj.name);
      }
    } else if (this.activeStrategyKey === 'macd') {
      if (!hasPos && emaFast > emaSlow) {
        this.lastStrategySignalTime = now;
        this.addLog('SIGNAL', `Sinyal MACD [${strategyObj.name}]: Bullish cross @ $${price}`);
        this.executeBuy(symbol, price, cfg.tradeAmountUSD || 500, cfg.stopLossPercent, cfg.takeProfitPercent, cfg.trailingStopPercent, strategyObj.name);
      }
    }
  }

  executeBuy(symbol, price, amountUSD, slPct, tpPct, trailPct, strategyName) {
    const config = this.symbols[symbol];
    const amount = +(amountUSD / price).toFixed(config.amountPrecision);
    const cost = +(amount * price).toFixed(2);
    const fee = +(cost * 0.00075).toFixed(2);

    if (this.balance < cost + fee) {
      this.addLog('ERROR', `Saldo tidak cukup untuk order ${symbol}.`);
      return;
    }

    this.balance = +(this.balance - cost - fee).toFixed(2);
    const stopLoss = slPct ? +(price * (1 - slPct / 100)).toFixed(config.precision) : null;
    const takeProfit = tpPct ? +(price * (1 + tpPct / 100)).toFixed(config.precision) : null;

    const pos = {
      id: 'pos_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      symbol,
      side: 'BUY',
      amount,
      entryPrice: price,
      currentPrice: price,
      cost,
      entryTime: Math.floor(Date.now() / 1000),
      stopLoss,
      takeProfit,
      trailingStop: trailPct ? { percent: trailPct, highestPrice: price } : null,
      strategy: strategyName,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0
    };

    this.positions.push(pos);
    this.addLog('ORDER', `Order BUY Sukses: ${amount} ${symbol} @ $${price} | TP: $${takeProfit || '--'} | SL: $${stopLoss || '--'}`);

    const marker = {
      time: Math.floor(Date.now() / 1000),
      position: 'belowBar',
      color: '#00c076',
      shape: 'arrowUp',
      text: `BUY ($${price})`
    };
    this.recordMarker(marker);
  }

  closePosition(id, reason = 'Manual') {
    const idx = this.positions.findIndex(p => p.id === id);
    if (idx === -1) return { success: false, error: 'Posisi tidak ditemukan' };

    const pos = this.positions[idx];
    const exitPrice = this.data[pos.symbol]?.currentPrice || pos.entryPrice;
    const gross = pos.amount * exitPrice;
    const exitFee = gross * 0.00075;
    const netReturn = gross - exitFee;
    const realizedPnL = +(netReturn - pos.cost).toFixed(2);
    const pnlPercent = +((realizedPnL / pos.cost) * 100).toFixed(2);

    this.balance = +(this.balance + netReturn).toFixed(2);
    this.positions.splice(idx, 1);

    const trade = {
      id: 'trade_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      positionId: pos.id,
      symbol: pos.symbol,
      side: pos.side,
      entryPrice: pos.entryPrice,
      exitPrice: +exitPrice.toFixed(4),
      amount: pos.amount,
      cost: pos.cost,
      realizedPnL,
      pnlPercent,
      fee: +(pos.cost * 0.00075 + exitFee).toFixed(4),
      entryTime: pos.entryTime,
      exitTime: Math.floor(Date.now() / 1000),
      reason,
      strategy: pos.strategy
    };

    this.tradeHistory.unshift(trade);
    if (this.tradeHistory.length > 200) this.tradeHistory.pop();
    this.updateStats();

    const isWin = realizedPnL >= 0;
    this.addLog(isWin ? 'SUCCESS' : 'ALERT', `Posisi ditutup (${reason}): ${pos.symbol} @ $${exitPrice}. PnL: ${isWin ? '+' : ''}$${realizedPnL} (${pnlPercent}%)`);

    this.recordMarker({
      time: Math.floor(Date.now() / 1000),
      position: 'aboveBar',
      color: isWin ? '#00c076' : '#ff4d4f',
      shape: 'arrowDown',
      text: `SELL (${reason})`
    });

    return { success: true, trade };
  }

  panicCloseAll() {
    const list = [...this.positions];
    for (const p of list) {
      this.closePosition(p.id, 'EMERGENCY PANIC CLOSE');
    }
    this.status = 'PAUSED';
    this.addLog('ALERT', '🚨 EMERGENCY CLOSE: Seluruh posisi telah dilikuidasi di harga pasar! Bot dijeda.');
    return { success: true, closedCount: list.length };
  }

  updateStats() {
    let wins = 0, losses = 0, profit = 0, loss = 0;
    for (const t of this.tradeHistory) {
      if (t.realizedPnL >= 0) {
        wins++;
        profit += t.realizedPnL;
      } else {
        losses++;
        loss += Math.abs(t.realizedPnL);
      }
    }
    const total = this.tradeHistory.length;
    this.stats = {
      totalTrades: total,
      winningTrades: wins,
      losingTrades: losses,
      totalProfit: +profit.toFixed(2),
      totalLoss: +loss.toFixed(2),
      netPnL: +(profit - loss).toFixed(2),
      winRate: total > 0 ? +((wins / total) * 100).toFixed(1) : 0,
      profitFactor: loss > 0 ? +(profit / loss).toFixed(2) : (profit > 0 ? 99 : 0),
      maxDrawdownPercent: 0,
      peakEquity: 10000
    };
  }

  getPortfolioState(currentPrices) {
    let margin = 0;
    let unrealized = 0;
    for (const pos of this.positions) {
      margin += pos.cost;
      const p = currentPrices[pos.symbol] || pos.entryPrice;
      unrealized += (p - pos.entryPrice) * pos.amount;
    }
    const equity = +(this.balance + margin + unrealized).toFixed(2);
    return {
      balance: +this.balance.toFixed(2),
      equity,
      marginUsed: +margin.toFixed(2),
      unrealizedPnL: +unrealized.toFixed(2),
      positions: this.positions,
      tradeHistory: this.tradeHistory.slice(0, 50),
      stats: this.stats
    };
  }

  calcRSI(closes, period = 14) {
    if (closes.length <= period) return 50;
    let g = 0, l = 0;
    for (let i = 1; i <= period; i++) {
      const d = closes[i] - closes[i - 1];
      if (d >= 0) g += d; else l += Math.abs(d);
    }
    let avgG = g / period;
    let avgL = l / period;
    for (let i = period + 1; i < closes.length; i++) {
      const d = closes[i] - closes[i - 1];
      avgG = (avgG * (period - 1) + (d >= 0 ? d : 0)) / period;
      avgL = (avgL * (period - 1) + (d < 0 ? Math.abs(d) : 0)) / period;
    }
    if (avgL === 0) return 100;
    return +(100 - (100 / (1 + (avgG / avgL)))).toFixed(2);
  }

  calcEMA(data, period) {
    if (data.length < period) return data[data.length - 1] || 0;
    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return +ema.toFixed(4);
  }

  addLog(level, message, data = null) {
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now(),
      level,
      message,
      data
    };
    this.logs.unshift(entry);
    if (this.logs.length > 150) this.logs.pop();
    for (const l of this.logListeners) l(entry);
  }

  recordMarker(marker) {
    this.tradeMarkers.push(marker);
    if (this.tradeMarkers.length > 80) this.tradeMarkers.shift();
    for (const l of this.markerListeners) l(marker);
  }

  getCandles(symbol, limit = 180) {
    const sym = this.data[symbol];
    if (!sym) return [];
    const list = [...sym.candles.slice(-limit)];
    if (sym.currentCandle) list.push({ ...sym.currentCandle });
    return list;
  }

  getFullState() {
    const currentPrices = {};
    const snapshots = {};
    for (const [sym, d] of Object.entries(this.data)) {
      currentPrices[sym] = d.currentPrice;
      snapshots[sym] = {
        symbol: sym,
        name: d.config.name,
        type: d.config.type,
        currentPrice: d.currentPrice,
        change24h: d.change24h,
        high24h: d.high24h,
        low24h: d.low24h,
        volume24h: d.volume24h,
        orderBook: d.orderBook
      };
    }
    return {
      status: this.status,
      mode: this.mode,
      activeSymbol: this.activeSymbol,
      activeStrategyKey: this.activeStrategyKey,
      strategies: this.strategies,
      speedMultiplier: this.speedMultiplier,
      symbols: this.symbols,
      allSnapshots: snapshots,
      candles: this.getCandles(this.activeSymbol, 180),
      portfolio: this.getPortfolioState(currentPrices),
      liveExchange: { isConfigured: false, isConnected: false },
      riskConfig: this.riskConfig,
      logs: this.logs.slice(0, 50),
      tradeMarkers: this.tradeMarkers.slice(-50)
    };
  }
}

// Global singleton instance for client-side execution
export const clientEngine = new ClientBotEngine();
