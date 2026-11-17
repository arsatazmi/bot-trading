// server/engine/strategies/BaseStrategy.js

export class BaseStrategy {
  constructor(name, config = {}) {
    this.name = name;
    this.config = { ...config };
    this.lastSignal = null;
    this.lastSignalTime = 0;
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  // Indicator math helpers
  static calculateSMA(data, period) {
    if (data.length < period) return null;
    const slice = data.slice(-period);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    return +(sum / period).toFixed(4);
  }

  static calculateEMA(data, period) {
    if (data.length < period) return null;
    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return +ema.toFixed(4);
  }

  static calculateEMASeries(data, period) {
    if (data.length < period) return [];
    const k = 2 / (period + 1);
    const result = [];
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(ema);

    for (let i = period; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
      result.push(ema);
    }
    return result;
  }

  static calculateRSI(closes, period = 14) {
    if (closes.length <= period) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return +(100 - (100 / (1 + rs))).toFixed(2);
  }

  static calculateRSISeries(closes, period = 14) {
    if (closes.length <= period) return [];
    const series = [];

    for (let i = period + 1; i <= closes.length; i++) {
      const sub = closes.slice(0, i);
      series.push(this.calculateRSI(sub, period));
    }
    return series;
  }

  static calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (closes.length < slowPeriod + signalPeriod) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    const fastEma = this.calculateEMA(closes, fastPeriod);
    const slowEma = this.calculateEMA(closes, slowPeriod);
    const macdLine = fastEma - slowEma;

    // Approximate signal line
    const macdHistory = [];
    for (let i = slowPeriod; i <= closes.length; i++) {
      const sub = closes.slice(0, i);
      const f = this.calculateEMA(sub, fastPeriod);
      const s = this.calculateEMA(sub, slowPeriod);
      macdHistory.push(f - s);
    }

    const signalLine = this.calculateEMA(macdHistory, signalPeriod) || macdLine;
    const histogram = macdLine - signalLine;

    return {
      macd: +macdLine.toFixed(4),
      signal: +signalLine.toFixed(4),
      histogram: +histogram.toFixed(4)
    };
  }

  static calculateBollingerBands(closes, period = 20, multiplier = 2) {
    if (closes.length < period) return null;
    const slice = closes.slice(-period);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: +(mean + multiplier * stdDev).toFixed(4),
      middle: +mean.toFixed(4),
      lower: +(mean - multiplier * stdDev).toFixed(4)
    };
  }

  // To be implemented by subclasses
  evaluate(marketData, openPositions = []) {
    throw new Error('evaluate() must be implemented by strategy');
  }
}
