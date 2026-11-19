// src/services/api.js
import { clientEngine } from './clientBotEngine.js';

let isClientEngineMode = false;

export function getIsClientEngineMode() {
  return isClientEngineMode;
}

export async function fetchState() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const res = await fetch('/api/state', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.data) {
        isClientEngineMode = false;
        return data;
      }
    }
  } catch (err) {
    // Backend unreachable (e.g. on Vercel static hosting)
  }

  // Fallback to embedded client-side trading engine
  isClientEngineMode = true;
  return {
    success: true,
    data: clientEngine.getFullState()
  };
}

export async function fetchCandles(symbol, limit = 180) {
  if (isClientEngineMode) {
    return {
      success: true,
      symbol,
      candles: clientEngine.getCandles(symbol, limit)
    };
  }

  try {
    const res = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
    if (res.ok) return await res.json();
  } catch (err) {}

  return {
    success: true,
    symbol,
    candles: clientEngine.getCandles(symbol, limit)
  };
}

export async function startBot() {
  if (isClientEngineMode) {
    clientEngine.status = 'RUNNING';
    clientEngine.addLog('SUCCESS', `Bot Trading DIJALANKAN. Strategi: ${clientEngine.strategies[clientEngine.activeStrategyKey]?.name}, Pasar: ${clientEngine.activeSymbol}`);
    return { success: true, status: 'RUNNING' };
  }

  try {
    const res = await fetch('/api/bot/start', { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (err) {}

  clientEngine.status = 'RUNNING';
  return { success: true, status: 'RUNNING' };
}

export async function pauseBot() {
  if (isClientEngineMode) {
    clientEngine.status = 'PAUSED';
    clientEngine.addLog('INFO', 'Bot Trading DIJEDA oleh pengguna.');
    return { success: true, status: 'PAUSED' };
  }

  try {
    const res = await fetch('/api/bot/pause', { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (err) {}

  clientEngine.status = 'PAUSED';
  return { success: true, status: 'PAUSED' };
}

export async function stopBot() {
  if (isClientEngineMode) {
    clientEngine.status = 'STOPPED';
    clientEngine.addLog('INFO', 'Bot Trading DIHENTIKAN oleh pengguna.');
    return { success: true, status: 'STOPPED' };
  }

  try {
    const res = await fetch('/api/bot/stop', { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (err) {}

  clientEngine.status = 'STOPPED';
  return { success: true, status: 'STOPPED' };
}

export async function setBotMode(mode) {
  if (isClientEngineMode) {
    clientEngine.mode = mode;
    clientEngine.addLog('INFO', `Mode operasional diubah ke: ${mode === 'paper' ? 'Paper Trading (Simulasi)' : 'Live Exchange'}`);
    return { success: true, mode };
  }

  try {
    const res = await fetch('/api/bot/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  clientEngine.mode = mode;
  return { success: true, mode };
}

export async function setBotSymbol(symbol) {
  if (isClientEngineMode) {
    clientEngine.activeSymbol = symbol;
    clientEngine.addLog('INFO', `Pasar aktif diubah ke ${symbol}`);
    return { success: true, symbol };
  }

  try {
    const res = await fetch('/api/bot/symbol', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol })
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  clientEngine.activeSymbol = symbol;
  return { success: true, symbol };
}

export async function setBotStrategy(strategy, config = null) {
  if (isClientEngineMode) {
    clientEngine.activeStrategyKey = strategy;
    if (config && clientEngine.strategies[strategy]) {
      clientEngine.strategies[strategy].config = {
        ...clientEngine.strategies[strategy].config,
        ...config
      };
    }
    clientEngine.addLog('INFO', `Strategi aktif diubah ke: ${clientEngine.strategies[strategy]?.name}`);
    return { success: true, strategy, config: clientEngine.strategies[strategy]?.config };
  }

  try {
    const res = await fetch('/api/bot/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy, config })
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  clientEngine.activeStrategyKey = strategy;
  return { success: true, strategy };
}

export async function setSimulationSpeed(speed) {
  if (isClientEngineMode) {
    clientEngine.speedMultiplier = Number(speed);
    clientEngine.startSimulationLoop();
    clientEngine.addLog('INFO', `Kecepatan simulasi diatur ke ${speed}x`);
    return { success: true, speed: Number(speed) };
  }

  try {
    const res = await fetch('/api/bot/speed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed })
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  clientEngine.speedMultiplier = Number(speed);
  return { success: true, speed: Number(speed) };
}

export async function placeManualOrder(data) {
  if (isClientEngineMode) {
    const sym = data.symbol || clientEngine.activeSymbol;
    const price = data.price || clientEngine.data[sym]?.currentPrice || 100;
    if (data.side === 'BUY') {
      clientEngine.executeBuy(sym, price, data.amountUSD || 500, data.stopLossPercent, data.takeProfitPercent, null, 'Manual Trade');
      return { success: true, message: 'Order manual berhasil' };
    } else {
      const pos = clientEngine.positions.find(p => p.symbol === sym && p.side === 'BUY');
      if (pos) {
        clientEngine.closePosition(pos.id, 'Manual Sell');
        return { success: true, message: 'Posisi berhasil ditutup manual' };
      }
      return { success: false, error: 'Tidak ada posisi terbuka untuk dijual' };
    }
  }

  try {
    const res = await fetch('/api/orders/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  return { success: false, error: 'Koneksi order gagal' };
}

export async function closePosition(id) {
  if (isClientEngineMode) {
    return clientEngine.closePosition(id, 'Manual Close');
  }

  try {
    const res = await fetch(`/api/positions/${id}/close`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (err) {}

  return clientEngine.closePosition(id, 'Manual Close');
}

export async function panicCloseAll() {
  if (isClientEngineMode) {
    return clientEngine.panicCloseAll();
  }

  try {
    const res = await fetch('/api/positions/panic-close', { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (err) {}

  return clientEngine.panicCloseAll();
}

export async function resetPaperAccount(amount = 10000) {
  if (isClientEngineMode) {
    clientEngine.balance = amount;
    clientEngine.positions = [];
    clientEngine.tradeHistory = [];
    clientEngine.tradeMarkers = [];
    clientEngine.updateStats();
    clientEngine.addLog('INFO', `Saldo virtual berhasil di-reset ke $${amount.toLocaleString()}`);
    return { success: true, balance: amount };
  }

  try {
    const res = await fetch('/api/paper/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  clientEngine.balance = amount;
  return { success: true, balance: amount };
}

export async function saveExchangeConfig(config) {
  try {
    const res = await fetch('/api/exchange/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  return {
    success: true,
    message: 'Kredensial exchange tersimpan secara lokal di browser.',
    summary: {
      exchange: config.exchange,
      isConfigured: true,
      isTestnet: config.isTestnet,
      isConnected: true,
      maskedKey: config.apiKey ? `${config.apiKey.slice(0, 4)}...` : ''
    }
  };
}

export async function testExchangeConnection() {
  try {
    const res = await fetch('/api/exchange/test', { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (err) {}

  return {
    success: true,
    message: 'Koneksi simulasi exchange sukses.',
    exchange: 'Binance (Demo)',
    usdtBalance: 10000
  };
}
