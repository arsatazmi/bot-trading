// server/engine/strategies/DcaStrategy.js
import { BaseStrategy } from './BaseStrategy.js';

export class DcaStrategy extends BaseStrategy {
  constructor(config = {}) {
    super('DCA Martingale', {
      baseOrderUSD: 300,
      safetyOrderUSD: 300,
      maxSafetyOrders: 4,
      priceDropStepPercent: 1.5,
      volumeScale: 1.2,
      takeProfitPercent: 2.5,
      stopLossPercent: 7.0,
      cooldownSeconds: 20,
      ...config
    });

    this.dcaCycles = {}; // symbol -> { active, basePrice, safetyOrdersCount, averagePrice, totalCost, totalAmount }
  }

  evaluate(symbol, candles, currentPrice, openPositions = []) {
    const now = Math.floor(Date.now() / 1000);
    if (this.lastSignalTime && (now - this.lastSignalTime) < this.config.cooldownSeconds) {
      return null;
    }

    const dcaPositions = openPositions.filter(p => p.symbol === symbol && p.strategy === 'DCA Martingale');

    // Case 1: No active DCA position -> Open Base Order
    if (dcaPositions.length === 0) {
      delete this.dcaCycles[symbol];
      this.lastSignalTime = now;
      this.dcaCycles[symbol] = {
        basePrice: currentPrice,
        safetyOrdersCount: 0,
        averagePrice: currentPrice
      };

      return {
        action: 'BUY',
        symbol,
        price: currentPrice,
        amountUSD: this.config.baseOrderUSD,
        stopLossPercent: this.config.stopLossPercent,
        takeProfitPercent: this.config.takeProfitPercent,
        reason: 'DCA Base Order Initiation'
      };
    }

    // Case 2: We have positions -> Calculate weighted average and check safety order
    const totalCost = dcaPositions.reduce((acc, p) => acc + p.cost, 0);
    const totalAmount = dcaPositions.reduce((acc, p) => acc + p.amount, 0);
    const avgEntryPrice = totalAmount > 0 ? (totalCost / totalAmount) : currentPrice;
    const safetyCount = dcaPositions.length - 1; // 0 safety orders means 1 base order

    // Check Take Profit on entire DCA basket
    const targetProfitPrice = avgEntryPrice * (1 + this.config.takeProfitPercent / 100);
    if (currentPrice >= targetProfitPrice) {
      this.lastSignalTime = now;
      delete this.dcaCycles[symbol];
      return {
        action: 'SELL',
        symbol,
        price: currentPrice,
        reason: `DCA Target Hit (+${this.config.takeProfitPercent}% above Avg $${avgEntryPrice.toFixed(2)})`
      };
    }

    // Check Safety Order trigger
    if (safetyCount < this.config.maxSafetyOrders) {
      const dropRequired = (safetyCount + 1) * this.config.priceDropStepPercent;
      const triggerPrice = avgEntryPrice * (1 - dropRequired / 100);

      if (currentPrice <= triggerPrice) {
        this.lastSignalTime = now;
        const multiplier = Math.pow(this.config.volumeScale, safetyCount);
        const orderAmountUSD = +(this.config.safetyOrderUSD * multiplier).toFixed(2);

        return {
          action: 'BUY',
          symbol,
          price: currentPrice,
          amountUSD: orderAmountUSD,
          stopLossPercent: this.config.stopLossPercent,
          takeProfitPercent: this.config.takeProfitPercent,
          reason: `DCA Safety Order #${safetyCount + 1} (Dip -${dropRequired.toFixed(1)}%, Size $${orderAmountUSD})`
        };
      }
    }

    return null;
  }
}
