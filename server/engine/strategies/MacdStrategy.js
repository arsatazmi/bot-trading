// server/engine/strategies/MacdStrategy.js
import { BaseStrategy } from './BaseStrategy.js';

export class MacdStrategy extends BaseStrategy {
  constructor(config = {}) {
    super('MACD Momentum', {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      tradeAmountUSD: 500,
      stopLossPercent: 2.0,
      takeProfitPercent: 3.5,
      trailingStopPercent: 1.5,
      cooldownSeconds: 20,
      ...config
    });
  }

  evaluate(symbol, candles, currentPrice, openPositions = []) {
    if (!candles || candles.length < this.config.slowPeriod + this.config.signalPeriod + 5) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (this.lastSignalTime && (now - this.lastSignalTime) < this.config.cooldownSeconds) {
      return null;
    }

    const closes = candles.map(c => c.close);
    const currMacd = BaseStrategy.calculateMACD(closes, this.config.fastPeriod, this.config.slowPeriod, this.config.signalPeriod);
    const prevCloses = closes.slice(0, -1);
    const prevMacd = BaseStrategy.calculateMACD(prevCloses, this.config.fastPeriod, this.config.slowPeriod, this.config.signalPeriod);

    const hasPosition = openPositions.some(p => p.symbol === symbol && p.side === 'BUY');
    const isBullishCross = prevMacd.macd <= prevMacd.signal && currMacd.macd > currMacd.signal;
    const isBearishCross = prevMacd.macd >= prevMacd.signal && currMacd.macd < currMacd.signal;

    if (!hasPosition && isBullishCross) {
      this.lastSignalTime = now;
      return {
        action: 'BUY',
        symbol,
        price: currentPrice,
        amountUSD: this.config.tradeAmountUSD,
        stopLossPercent: this.config.stopLossPercent,
        takeProfitPercent: this.config.takeProfitPercent,
        trailingStopPercent: this.config.trailingStopPercent,
        reason: `MACD Bullish Cross (MACD ${currMacd.macd} > Sig ${currMacd.signal})`,
        indicators: { ...currMacd }
      };
    } else if (hasPosition && isBearishCross) {
      this.lastSignalTime = now;
      return {
        action: 'SELL',
        symbol,
        price: currentPrice,
        reason: `MACD Bearish Cross (MACD ${currMacd.macd} < Sig ${currMacd.signal})`,
        indicators: { ...currMacd }
      };
    }

    return null;
  }
}
