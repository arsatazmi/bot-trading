// server/engine/strategies/GridStrategy.js
import { BaseStrategy } from './BaseStrategy.js';

export class GridStrategy extends BaseStrategy {
  constructor(config = {}) {
    super('Grid Trading', {
      rangePercent: 4.0, // +/- 4% range around base price
      gridCount: 6, // 6 grid levels
      orderAmountUSD: 250,
      takeProfitPercent: 1.5,
      stopLossPercent: 5.0,
      cooldownSeconds: 15,
      ...config
    });

    this.gridBasePrice = null;
    this.gridLevels = [];
    this.filledLevels = new Set();
  }

  setupGrids(currentPrice) {
    this.gridBasePrice = currentPrice;
    const halfRange = this.config.rangePercent / 100;
    const lowerBound = currentPrice * (1 - halfRange);
    const upperBound = currentPrice * (1 + halfRange);
    const step = (upperBound - lowerBound) / this.config.gridCount;

    this.gridLevels = [];
    for (let i = 0; i <= this.config.gridCount; i++) {
      this.gridLevels.push(+(lowerBound + i * step).toFixed(2));
    }
    this.filledLevels.clear();
  }

  evaluate(symbol, candles, currentPrice, openPositions = []) {
    if (!this.gridBasePrice || Math.abs(currentPrice - this.gridBasePrice) / this.gridBasePrice > 0.08) {
      this.setupGrids(currentPrice);
    }

    const now = Math.floor(Date.now() / 1000);
    if (this.lastSignalTime && (now - this.lastSignalTime) < this.config.cooldownSeconds) {
      return null;
    }

    // Check each grid level
    for (let i = 0; i < this.gridLevels.length - 1; i++) {
      const levelPrice = this.gridLevels[i];

      // If price is near or below this grid level and not yet filled
      if (currentPrice <= levelPrice * 1.002 && !this.filledLevels.has(i)) {
        // Only buy if we haven't maxed out open positions
        const openGridPositions = openPositions.filter(p => p.symbol === symbol && p.strategy === 'Grid Trading');
        if (openGridPositions.length < this.config.gridCount) {
          this.filledLevels.add(i);
          this.lastSignalTime = now;

          return {
            action: 'BUY',
            symbol,
            price: currentPrice,
            amountUSD: this.config.orderAmountUSD,
            stopLossPercent: this.config.stopLossPercent,
            takeProfitPercent: this.config.takeProfitPercent,
            reason: `Grid Level #${i + 1} Hit ($${levelPrice.toFixed(2)})`,
            gridIndex: i
          };
        }
      }
    }

    // Free up grid levels if price moves back up
    for (const levelIndex of Array.from(this.filledLevels)) {
      const levelPrice = this.gridLevels[levelIndex];
      const targetSellPrice = levelPrice * (1 + this.config.takeProfitPercent / 100);
      if (currentPrice >= targetSellPrice) {
        this.filledLevels.delete(levelIndex);
      }
    }

    return null;
  }
}
