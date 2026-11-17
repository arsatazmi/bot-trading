// src/utils/formatters.js

export function formatPrice(value, symbol = 'BTC/USDT') {
  if (value === undefined || value === null || isNaN(value)) return '$0.00';
  const num = Number(value);
  const decimals = symbol === 'EUR/USD' ? 4 : (num < 10 ? 3 : 2);
  return '$' + num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatCurrency(value, decimals = 2) {
  if (value === undefined || value === null || isNaN(value)) return '$0.00';
  const num = Number(value);
  return '$' + num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatPercent(value) {
  if (value === undefined || value === null || isNaN(value)) return '0.00%';
  const num = Number(value);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

export function formatTime(timestamp) {
  if (!timestamp) return '--:--:--';
  const date = new Date(timestamp * 1000 > 1e12 ? timestamp * 1000 : timestamp);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatDate(timestamp) {
  if (!timestamp) return '--/--/--';
  const date = new Date(timestamp * 1000 > 1e12 ? timestamp * 1000 : timestamp);
  return date.toLocaleDateString('id-ID', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
