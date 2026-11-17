// src/services/api.js

export async function fetchState() {
  const res = await fetch('/api/state');
  if (!res.ok) throw new Error('Gagal mengambil status');
  return res.json();
}

export async function fetchCandles(symbol, limit = 180) {
  const res = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
  if (!res.ok) throw new Error('Gagal mengambil data candlestick');
  return res.json();
}

export async function startBot() {
  const res = await fetch('/api/bot/start', { method: 'POST' });
  return res.json();
}

export async function pauseBot() {
  const res = await fetch('/api/bot/pause', { method: 'POST' });
  return res.json();
}

export async function stopBot() {
  const res = await fetch('/api/bot/stop', { method: 'POST' });
  return res.json();
}

export async function setBotMode(mode) {
  const res = await fetch('/api/bot/mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode })
  });
  return res.json();
}

export async function setBotSymbol(symbol) {
  const res = await fetch('/api/bot/symbol', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol })
  });
  return res.json();
}

export async function setBotStrategy(strategy, config = null) {
  const res = await fetch('/api/bot/strategy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategy, config })
  });
  return res.json();
}

export async function setSimulationSpeed(speed) {
  const res = await fetch('/api/bot/speed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speed })
  });
  return res.json();
}

export async function placeManualOrder(data) {
  const res = await fetch('/api/orders/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function closePosition(id) {
  const res = await fetch(`/api/positions/${id}/close`, { method: 'POST' });
  return res.json();
}

export async function panicCloseAll() {
  const res = await fetch('/api/positions/panic-close', { method: 'POST' });
  return res.json();
}

export async function resetPaperAccount(amount = 10000) {
  const res = await fetch('/api/paper/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  });
  return res.json();
}

export async function saveExchangeConfig(config) {
  const res = await fetch('/api/exchange/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  return res.json();
}

export async function testExchangeConnection() {
  const res = await fetch('/api/exchange/test', { method: 'POST' });
  return res.json();
}
