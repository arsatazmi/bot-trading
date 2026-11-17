// server/engine/connectors/ExchangeConnector.js
import ccxt from 'ccxt';

export class ExchangeConnector {
  constructor() {
    this.exchangeName = 'binance';
    this.apiKey = '';
    this.apiSecret = '';
    this.isTestnet = true;
    this.client = null;
    this.isConnected = false;
    this.lastError = null;
  }

  configure({ exchange = 'binance', apiKey, apiSecret, isTestnet = true }) {
    this.exchangeName = exchange.toLowerCase();
    this.apiKey = apiKey || '';
    this.apiSecret = apiSecret || '';
    this.isTestnet = Boolean(isTestnet);
    this.isConnected = false;
    this.lastError = null;

    if (!this.apiKey || !this.apiSecret) {
      this.client = null;
      return { success: false, error: 'API Key dan API Secret diperlukan' };
    }

    try {
      const exchangeClass = ccxt[this.exchangeName];
      if (!exchangeClass) {
        throw new Error(`Exchange "${this.exchangeName}" tidak didukung oleh CCXT.`);
      }

      this.client = new exchangeClass({
        apiKey: this.apiKey,
        secret: this.apiSecret,
        enableRateLimit: true,
        options: {
          defaultType: 'spot'
        }
      });

      if (this.isTestnet && typeof this.client.setSandboxMode === 'function') {
        this.client.setSandboxMode(true);
      }

      return { success: true, message: `Konfigurasi ${this.exchangeName.toUpperCase()} berhasil disimpan.` };
    } catch (err) {
      this.lastError = err.message;
      return { success: false, error: err.message };
    }
  }

  async testConnection() {
    if (!this.client) {
      return {
        success: false,
        error: 'Klien exchange belum dikonfigurasi. Masukkan API Key & Secret terlebih dahulu.'
      };
    }

    try {
      // Test by checking time or balance
      const balance = await this.client.fetchBalance();
      this.isConnected = true;
      this.lastError = null;

      const freeUSDT = balance.free?.USDT ?? balance.total?.USDT ?? 0;
      return {
        success: true,
        message: `Koneksi ke ${this.exchangeName.toUpperCase()} berhasil!`,
        exchange: this.exchangeName,
        isTestnet: this.isTestnet,
        usdtBalance: freeUSDT
      };
    } catch (err) {
      this.isConnected = false;
      this.lastError = err.message;
      return {
        success: false,
        error: `Gagal terhubung ke ${this.exchangeName}: ${err.message}`
      };
    }
  }

  async fetchBalance() {
    if (!this.client) return null;
    try {
      const balance = await this.client.fetchBalance();
      return {
        USDT: balance.total?.USDT || 0,
        freeUSDT: balance.free?.USDT || 0,
        raw: balance
      };
    } catch (err) {
      this.lastError = err.message;
      throw err;
    }
  }

  async placeOrder({ symbol, side, type = 'limit', amount, price }) {
    if (!this.client) {
      throw new Error('Exchange belum terhubung');
    }

    try {
      // Format symbol e.g. BTC/USDT
      const order = await this.client.createOrder(
        symbol,
        type.toLowerCase(),
        side.toLowerCase(),
        amount,
        type.toLowerCase() === 'limit' ? price : undefined
      );

      return {
        success: true,
        orderId: order.id,
        symbol: order.symbol,
        side: order.side,
        price: order.price || price,
        amount: order.amount,
        status: order.status
      };
    } catch (err) {
      this.lastError = err.message;
      return {
        success: false,
        error: err.message
      };
    }
  }

  getConfigSummary() {
    return {
      exchange: this.exchangeName,
      isConfigured: Boolean(this.apiKey && this.apiSecret),
      isTestnet: this.isTestnet,
      isConnected: this.isConnected,
      maskedKey: this.apiKey ? `${this.apiKey.slice(0, 4)}...${this.apiKey.slice(-4)}` : '',
      lastError: this.lastError
    };
  }
}
