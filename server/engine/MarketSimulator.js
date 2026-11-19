// server/engine/MarketSimulator.js

export class MarketSimulator {
  constructor() {
    this.symbols = {
      'BTC/USDT': {
        name: 'Bitcoin',
        type: 'crypto',
        basePrice: 68500,
        volatility: 0.0018,
        precision: 2,
        amountPrecision: 4,
        minQty: 0.001,
      },
      'ETH/USDT': {
        name: 'Ethereum',
        type: 'crypto',
        basePrice: 3450,
        volatility: 0.0022,
        precision: 2,
        amountPrecision: 3,
        minQty: 0.01,
      },
      'SOL/USDT': {
        name: 'Solana',
        type: 'crypto',
        basePrice: 182,
        volatility: 0.0035,
        precision: 2,
        amountPrecision: 2,
        minQty: 0.1,
      },
      'EUR/USD': {
        name: 'Euro / US Dollar',
        type: 'forex',
        basePrice: 1.0850,
        volatility: 0.0004,
        precision: 4,
        amountPrecision: 2,
        minQty: 100,
      },
      'XAU/USD': {
        name: 'Gold / US Dollar',
        type: 'commodity',
        basePrice: 2680,
        volatility: 0.0012,
        precision: 2,
        amountPrecision: 2,
        minQty: 0.1,
      }
    };

    this.data = {};
    this.speedMultiplier = 1; // 1x, 2x, 5x, 10x
    this.tickIntervalMs = 1000;
    this.timer = null;
    this.listeners = [];

    this.initializeAllSymbols();
  }

  initializeAllSymbols() {
    const now = Math.floor(Date.now() / 1000);
    const candleCount = 180; // 3 hours of 1-minute candles
    const timeframeSeconds = 60;

    for (const [symbol, config] of Object.entries(this.symbols)) {
      let currentPrice = config.basePrice;
      const candles = [];
      const startTime = now - (candleCount * timeframeSeconds);

      for (let i = 0; i < candleCount; i++) {
        const time = startTime + (i * timeframeSeconds);
        // Trend bias cycle
        const cycle = Math.sin(i / 15) * 0.001;
        const randomChange = (Math.random() - 0.495 + cycle) * config.volatility * currentPrice;
        const open = currentPrice;
        const close = +(open + randomChange).toFixed(config.precision);
        const wick1 = Math.abs(randomChange) * (Math.random() * 1.5);
        const wick2 = Math.abs(randomChange) * (Math.random() * 1.5);
        const high = +(Math.max(open, close) + wick1).toFixed(config.precision);
        const low = +(Math.min(open, close) - wick2).toFixed(config.precision);
        const volume = +(Math.random() * (config.type === 'crypto' ? 12 : 250) + 2).toFixed(2);

        candles.push({ time, open, high, low, close, volume });
        currentPrice = close;
      }

      const latestCandle = candles[candles.length - 1];
      const open24h = candles[0].open;
      const change24h = +(((latestCandle.close - open24h) / open24h) * 100).toFixed(2);
      const high24h = Math.max(...candles.map(c => c.high));
      const low24h = Math.min(...candles.map(c => c.low));
      const volume24h = +candles.reduce((sum, c) => sum + c.volume, 0).toFixed(2);

      this.data[symbol] = {
        config,
        candles,
        currentPrice: latestCandle.close,
        open24h,
        change24h,
        high24h,
        low24h,
        volume24h,
        currentCandle: {
          time: now,
          open: latestCandle.close,
          high: latestCandle.close,
          low: latestCandle.close,
          close: latestCandle.close,
          volume: 0,
          ticksCount: 0
        },
        orderBook: this.generateOrderBook(symbol, latestCandle.close)
      };
    }
  }

  generateOrderBook(symbol, currentPrice) {
    const config = this.symbols[symbol];
    const bids = [];
    const asks = [];
    const step = currentPrice * 0.0003;

    let cumBid = 0;
    let cumAsk = 0;

    for (let i = 1; i <= 8; i++) {
      const bidPrice = +(currentPrice - (i * step)).toFixed(config.precision);
      const askPrice = +(currentPrice + (i * step)).toFixed(config.precision);
      const bidQty = +(Math.random() * 2 + 0.2).toFixed(config.amountPrecision);
      const askQty = +(Math.random() * 2 + 0.2).toFixed(config.amountPrecision);

      cumBid += bidQty;
      cumAsk += askQty;

      bids.push({ price: bidPrice, amount: bidQty, total: +cumBid.toFixed(config.amountPrecision) });
      asks.push({ price: askPrice, amount: askQty, total: +cumAsk.toFixed(config.amountPrecision) });
    }

    return { bids, asks: asks.reverse(), spread: +(asks[asks.length - 1]?.price - bids[0]?.price || 0).toFixed(config.precision) };
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.tick();
    }, Math.max(150, Math.floor(this.tickIntervalMs / this.speedMultiplier)));
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.5, Math.min(20, multiplier));
    if (this.timer) {
      this.stop();
      this.start();
    }
  }

  tick() {
    const now = Math.floor(Date.now() / 1000);
    const tickUpdates = {};

    for (const [symbol, symData] of Object.entries(this.data)) {
      const config = symData.config;
      // Drift & Volatility
      const noise = (Math.random() - 0.495) * config.volatility * symData.currentPrice;
      let newPrice = +(symData.currentPrice + noise).toFixed(config.precision);
      if (newPrice <= 0) newPrice = config.basePrice;

      symData.currentPrice = newPrice;

      // Update current candle
      const curr = symData.currentCandle;
      curr.close = newPrice;
      if (newPrice > curr.high) curr.high = newPrice;
      if (newPrice < curr.low) curr.low = newPrice;
      curr.volume = +(curr.volume + Math.random() * 0.5).toFixed(2);
      curr.ticksCount = (curr.ticksCount || 0) + 1;

      // Candle rollover check:
      // With speed multiplier, candles can complete faster
      const secondsPerCandle = Math.max(5, Math.floor(60 / this.speedMultiplier));
      const shouldCloseCandle = (curr.ticksCount >= secondsPerCandle);

      if (shouldCloseCandle) {
        // Push closed candle
        symData.candles.push({ ...curr });
        if (symData.candles.length > 500) {
          symData.candles.shift();
        }
        // Start new candle
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

      // Update 24h stats
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

    // Notify listeners
    for (const listener of this.listeners) {
      listener(tickUpdates);
    }
  }

  onTick(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getPrice(symbol) {
    return this.data[symbol]?.currentPrice || this.symbols[symbol]?.basePrice || 0;
  }

  getCandles(symbol, limit = 200) {
    const list = this.data[symbol]?.candles || [];
    const current = this.data[symbol]?.currentCandle;
    const result = [...list.slice(-limit)];
    if (current && (!result.length || result[result.length - 1].time !== current.time)) {
      result.push({ ...current });
    }
    return result;
  }

  getSnapshot(symbol) {
    const sym = this.data[symbol];
    if (!sym) return null;
    return {
      symbol,
      name: sym.config.name,
      type: sym.config.type,
      currentPrice: sym.currentPrice,
      change24h: sym.change24h,
      high24h: sym.high24h,
      low24h: sym.low24h,
      volume24h: sym.volume24h,
      orderBook: sym.orderBook,
      speedMultiplier: this.speedMultiplier
    };
  }

  getAllSnapshots() {
    const map = {};
    for (const symbol of Object.keys(this.symbols)) {
      map[symbol] = this.getSnapshot(symbol);
    }
    return map;
  }
}
