// server/engine/strategies/RsiEmaStrategy.js
import { BaseStrategy } from './BaseStrategy.js';

export class RsiEmaStrategy extends BaseStrategy {
  constructor(config = {}) {
    super('RSI + EMA Trend', {
      rsiPeriod: 14,
      rsiOversold: 32,
      rsiOverbought: 68,
      emaFastPeriod: 9,
      emaSlowPeriod: 21,
      tradeAmountUSD: 500,
      stopLossPercent: 2.5,
      takeProfitPercent: 4.0,
      trailingStopPercent: 1.5,
      cooldownSeconds: 20,
      ...config
    });
  }

  evaluate(symbol, candles, currentPrice, openPositions = []) {
    if (!candles || candles.length < this.config.emaSlowPeriod + 5) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (this.lastSignalTime && (now - this.lastSignalTime) < this.config.cooldownSeconds) {
      return null;
    }

    const closes = candles.map(c => c.close);
    const rsi = BaseStrategy.calculateRSI(closes, this.config.rsiPeriod);
    const emaFast = BaseStrategy.calculateEMA(closes, this.config.emaFastPeriod);
    const emaSlow = BaseStrategy.calculateEMA(closes, this.config.emaSlowPeriod);

    // Previous candle indicator calculation for crossover
    const prevCloses = closes.slice(0, -1);
    const prevEmaFast = BaseStrategy.calculateEMA(prevCloses, this.config.emaFastPeriod);
    const prevEmaSlow = BaseStrategy.calculateEMA(prevCloses, this.config.emaSlowPeriod);

    const hasPosition = openPositions.some(p => p.symbol === symbol && p.side === 'BUY');
    const isBullishCross = prevEmaFast <= prevEmaSlow && emaFast > emaSlow;
    const isBearishCross = prevEmaFast >= prevEmaSlow && emaFast < emaSlow;

    // BUY condition
    if (!hasPosition) {
      const isOversold = rsi <= this.config.rsiOversold;
      const isBullishTrend = isBullishCross && rsi < 60;

      if (isOversold || isBullishTrend) {
        this.lastSignalTime = now;
        const reason = isOversold
          ? `RSI Oversold (${rsi.toFixed(1)} <= ${this.config.rsiOversold})`
          : `EMA Golden Cross (${this.config.emaFastPeriod} EMA > ${this.config.emaSlowPeriod} EMA, RSI: ${rsi.toFixed(1)})`;

        return {
          action: 'BUY',
          symbol,
          price: currentPrice,
          amountUSD: this.config.tradeAmountUSD,
          stopLossPercent: this.config.stopLossPercent,
          takeProfitPercent: this.config.takeProfitPercent,
          trailingStopPercent: this.config.trailingStopPercent,
          reason,
          indicators: { rsi, emaFast, emaSlow }
        };
      }
    } else {
      // SELL condition
      const isOverbought = rsi >= this.config.rsiOverbought;

      if (isOverbought || isBearishCross) {
        this.lastSignalTime = now;
        const reason = isOverbought
          ? `RSI Overbought (${rsi.toFixed(1)} >= ${this.config.rsiOverbought})`
          : `EMA Death Cross (${this.config.emaFastPeriod} EMA < ${this.config.emaSlowPeriod} EMA)`;

        return {
          action: 'SELL',
          symbol,
          price: currentPrice,
          reason,
          indicators: { rsi, emaFast, emaSlow }
        };
      }
    }

    return null;
  }
}
