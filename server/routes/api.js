// server/routes/api.js
import { Router } from 'express';

export function createApiRouter(botManager) {
  const router = Router();

  // Full state snapshot
  router.get('/state', (req, res) => {
    try {
      const state = botManager.getFullState();
      res.json({ success: true, data: state });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Candlestick history for specific symbol
  router.get('/candles', (req, res) => {
    try {
      const symbol = req.query.symbol || botManager.activeSymbol;
      const limit = parseInt(req.query.limit, 10) || 180;
      const candles = botManager.simulator.getCandles(symbol, limit);
      res.json({ success: true, symbol, candles });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Server-Sent Events (SSE) stream for live real-time updates
  router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial ping
    res.write(`event: connected\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);

    botManager.registerSSEClient(res);
  });

  // Bot Lifecycle Controls
  router.post('/bot/start', (req, res) => {
    try {
      const result = botManager.start();
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/bot/pause', (req, res) => {
    try {
      const result = botManager.pause();
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/bot/stop', (req, res) => {
    try {
      const result = botManager.stop();
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/bot/mode', (req, res) => {
    try {
      const { mode } = req.body;
      const result = botManager.setMode(mode);
      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post('/bot/symbol', (req, res) => {
    try {
      const { symbol } = req.body;
      const result = botManager.setSymbol(symbol);
      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post('/bot/strategy', (req, res) => {
    try {
      const { strategy, config } = req.body;
      const result = botManager.setStrategy(strategy, config);
      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  router.post('/bot/speed', (req, res) => {
    try {
      const { speed } = req.body;
      const result = botManager.setSpeed(Number(speed));
      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Manual Trading
  router.post('/orders/manual', (req, res) => {
    try {
      const { symbol, side, amountUSD, price, stopLossPercent, takeProfitPercent } = req.body;
      const result = botManager.manualOrder({
        symbol,
        side,
        amountUSD: Number(amountUSD),
        price: price ? Number(price) : null,
        stopLossPercent: stopLossPercent ? Number(stopLossPercent) : null,
        takeProfitPercent: takeProfitPercent ? Number(takeProfitPercent) : null
      });
      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Positions
  router.post('/positions/:id/close', (req, res) => {
    try {
      const result = botManager.closePosition(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/positions/panic-close', (req, res) => {
    try {
      const result = botManager.panicCloseAll();
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Virtual account reset
  router.post('/paper/reset', (req, res) => {
    try {
      const { amount } = req.body;
      const result = botManager.resetPaperAccount(amount ? Number(amount) : 10000);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Live Exchange API Configuration
  router.post('/exchange/config', (req, res) => {
    try {
      const { exchange, apiKey, apiSecret, isTestnet } = req.body;
      const result = botManager.liveExchange.configure({ exchange, apiKey, apiSecret, isTestnet });
      botManager.addLog('INFO', `Pengaturan exchange ${exchange.toUpperCase()} diperbarui (${isTestnet ? 'Testnet' : 'Mainnet'}).`);
      res.json({ ...result, summary: botManager.liveExchange.getConfigSummary() });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/exchange/test', async (req, res) => {
    try {
      const result = await botManager.liveExchange.testConnection();
      if (result.success) {
        botManager.addLog('SUCCESS', `Tes koneksi ${result.exchange.toUpperCase()} berhasil. Saldo USDT: $${result.usdtBalance}`);
      } else {
        botManager.addLog('ERROR', `Tes koneksi exchange gagal: ${result.error}`);
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Export trade history
  router.get('/trades/export', (req, res) => {
    try {
      const trades = botManager.paperExchange.tradeHistory;
      const format = req.query.format || 'json';

      if (format === 'csv') {
        let csv = 'ID,Timestamp,Date,Symbol,Side,Strategy,EntryPrice,ExitPrice,Amount,Cost,PnL,PnLPercent,Fee,Reason\n';
        for (const t of trades) {
          const date = new Date(t.exitTime * 1000).toISOString();
          csv += `"${t.id}","${t.exitTime}","${date}","${t.symbol}","${t.side}","${t.strategy}",${t.entryPrice},${t.exitPrice},${t.amount},${t.cost},${t.realizedPnL},${t.pnlPercent},${t.fee},"${t.reason}"\n`;
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="trades_export.csv"');
        return res.send(csv);
      }

      res.json({ success: true, count: trades.length, trades });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
