// server/engine/connectors/PaperConnector.js

export class PaperConnector {
  constructor(initialBalance = 10000) {
    this.initialBalance = initialBalance;
    this.balance = initialBalance; // Free USDT / USD balance
    this.positions = []; // Active open positions
    this.tradeHistory = []; // Closed trades
    this.feeRate = 0.00075; // 0.075% fee per trade
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
      peakEquity: initialBalance
    };
  }

  getEquity(currentPrices = {}) {
    let unrealizedTotal = 0;
    for (const pos of this.positions) {
      const price = currentPrices[pos.symbol] || pos.entryPrice;
      const posPnL = (price - pos.entryPrice) * pos.amount;
      unrealizedTotal += posPnL;
    }
    return +(this.balance + this.getMarginUsed() + unrealizedTotal).toFixed(2);
  }

  getMarginUsed() {
    return +this.positions.reduce((sum, p) => sum + (p.entryPrice * p.amount), 0).toFixed(2);
  }

  placeOrder({ symbol, side, amount, price, stopLoss = null, takeProfit = null, trailingStop = null, strategy = 'Manual' }) {
    const cost = amount * price;
    const fee = cost * this.feeRate;
    const totalRequired = cost + fee;

    if (side === 'BUY') {
      if (this.balance < totalRequired) {
        return {
          success: false,
          error: `Saldo tidak mencukupi. Dibutuhkan $${totalRequired.toFixed(2)}, saldo tersedia: $${this.balance.toFixed(2)}`
        };
      }

      this.balance = +(this.balance - totalRequired).toFixed(2);

      const position = {
        id: 'pos_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        symbol,
        side: 'BUY',
        amount,
        entryPrice: price,
        currentPrice: price,
        cost: +cost.toFixed(2),
        entryTime: Math.floor(Date.now() / 1000),
        stopLoss: stopLoss ? +stopLoss : null,
        takeProfit: takeProfit ? +takeProfit : null,
        trailingStop: trailingStop ? { percent: trailingStop, highestPrice: price } : null,
        strategy,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
      };

      this.positions.push(position);
      return { success: true, position, fee: +fee.toFixed(4) };
    } else if (side === 'SELL') {
      // Direct sell closes existing open position for that symbol or partially
      const existing = this.positions.find(p => p.symbol === symbol && p.side === 'BUY');
      if (!existing) {
        return { success: false, error: `Tidak ada posisi terbuka untuk ${symbol} yang bisa dijual.` };
      }
      return this.closePosition(existing.id, price, 'Manual Sell');
    }

    return { success: false, error: 'Tipe order tidak dikenali' };
  }

  closePosition(positionId, currentPrice, reason = 'Market Close') {
    const index = this.positions.findIndex(p => p.id === positionId);
    if (index === -1) {
      return { success: false, error: 'Posisi tidak ditemukan' };
    }

    const pos = this.positions[index];
    const exitPrice = currentPrice;
    const grossReturn = pos.amount * exitPrice;
    const exitFee = grossReturn * this.feeRate;
    const netReturn = grossReturn - exitFee;
    const realizedPnL = +(grossReturn - pos.cost - exitFee).toFixed(2);
    const pnlPercent = +((realizedPnL / pos.cost) * 100).toFixed(2);

    this.balance = +(this.balance + netReturn).toFixed(2);
    this.positions.splice(index, 1);

    const closedTrade = {
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
      fee: +(pos.cost * this.feeRate + exitFee).toFixed(4),
      entryTime: pos.entryTime,
      exitTime: Math.floor(Date.now() / 1000),
      reason,
      strategy: pos.strategy
    };

    this.tradeHistory.unshift(closedTrade);
    if (this.tradeHistory.length > 300) this.tradeHistory.pop();

    this.updateStats();

    return { success: true, trade: closedTrade };
  }

  closeAllPositions(currentPrices, reason = 'Panic Close All') {
    const closed = [];
    // Clone array since closePosition mutates this.positions
    const currentList = [...this.positions];
    for (const pos of currentList) {
      const price = currentPrices[pos.symbol] || pos.entryPrice;
      const res = this.closePosition(pos.id, price, reason);
      if (res.success) closed.push(res.trade);
    }
    return closed;
  }

  updatePositions(currentPrices) {
    const triggeredExits = [];

    for (let i = this.positions.length - 1; i >= 0; i--) {
      const pos = this.positions[i];
      const currentPrice = currentPrices[pos.symbol];
      if (!currentPrice) continue;

      pos.currentPrice = currentPrice;
      const rawPnL = (currentPrice - pos.entryPrice) * pos.amount;
      pos.unrealizedPnL = +rawPnL.toFixed(2);
      pos.unrealizedPnLPercent = +(((currentPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2);

      // Trailing stop update
      if (pos.trailingStop) {
        if (currentPrice > pos.trailingStop.highestPrice) {
          pos.trailingStop.highestPrice = currentPrice;
        }
        const trailingStopPrice = pos.trailingStop.highestPrice * (1 - pos.trailingStop.percent / 100);
        if (currentPrice <= trailingStopPrice && pos.unrealizedPnL > 0) {
          triggeredExits.push({ positionId: pos.id, price: currentPrice, reason: `Trailing Stop Hit (${pos.trailingStop.percent}%)` });
          continue;
        }
      }

      // Take Profit check
      if (pos.takeProfit && currentPrice >= pos.takeProfit) {
        triggeredExits.push({ positionId: pos.id, price: currentPrice, reason: `Take Profit Hit ($${pos.takeProfit})` });
        continue;
      }

      // Stop Loss check
      if (pos.stopLoss && currentPrice <= pos.stopLoss) {
        triggeredExits.push({ positionId: pos.id, price: currentPrice, reason: `Stop Loss Hit ($${pos.stopLoss})` });
        continue;
      }
    }

    const closedTrades = [];
    for (const item of triggeredExits) {
      const res = this.closePosition(item.positionId, item.price, item.reason);
      if (res.success) closedTrades.push(res.trade);
    }

    return closedTrades;
  }

  updateStats() {
    let totalProfit = 0;
    let totalLoss = 0;
    let wins = 0;
    let losses = 0;

    for (const trade of this.tradeHistory) {
      if (trade.realizedPnL >= 0) {
        wins++;
        totalProfit += trade.realizedPnL;
      } else {
        losses++;
        totalLoss += Math.abs(trade.realizedPnL);
      }
    }

    const totalTrades = this.tradeHistory.length;
    const winRate = totalTrades > 0 ? +((wins / totalTrades) * 100).toFixed(1) : 0;
    const profitFactor = totalLoss > 0 ? +(totalProfit / totalLoss).toFixed(2) : (totalProfit > 0 ? 99 : 0);
    const netPnL = +(totalProfit - totalLoss).toFixed(2);

    const currentEquity = this.balance + this.getMarginUsed();
    if (currentEquity > this.stats.peakEquity) {
      this.stats.peakEquity = currentEquity;
    }
    const currentDrawdown = this.stats.peakEquity > 0
      ? +(((this.stats.peakEquity - currentEquity) / this.stats.peakEquity) * 100).toFixed(2)
      : 0;

    this.stats = {
      totalTrades,
      winningTrades: wins,
      losingTrades: losses,
      totalProfit: +totalProfit.toFixed(2),
      totalLoss: +totalLoss.toFixed(2),
      netPnL,
      winRate,
      profitFactor,
      maxDrawdownPercent: Math.max(this.stats.maxDrawdownPercent, currentDrawdown),
      peakEquity: this.stats.peakEquity
    };
  }

  reset(newBalance = 10000) {
    this.initialBalance = newBalance;
    this.balance = newBalance;
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
      peakEquity: newBalance
    };
  }

  getState(currentPrices = {}) {
    const equity = this.getEquity(currentPrices);
    const marginUsed = this.getMarginUsed();
    const unrealizedPnL = +(equity - this.balance - marginUsed).toFixed(2);

    return {
      balance: +this.balance.toFixed(2),
      equity,
      marginUsed,
      unrealizedPnL,
      positions: this.positions,
      tradeHistory: this.tradeHistory.slice(0, 50),
      stats: this.stats
    };
  }
}
