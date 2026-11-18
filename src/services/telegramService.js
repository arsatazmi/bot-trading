// src/services/telegramService.js
// Integration service for Telegram Bot (@SmartAIAnalytics_bot)

const STORAGE_KEY = 'autotrade_telegram_config';

export class TelegramService {
  constructor() {
    this.config = this.loadConfig();
    this.lastUpdateId = 0;
    this.pollTimer = null;
    this.messageQueue = [];
  }

  loadConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.botToken) {
          parsed.botToken = '7650747217:AAGhWU3S0qtgpTD77n3tMTF9_o1bhQXO27c';
        }
        return parsed;
      }
    } catch (e) {}

    return {
      botToken: '7650747217:AAGhWU3S0qtgpTD77n3tMTF9_o1bhQXO27c',
      chatId: '',
      botUsername: '@SmartAIAnalytics_bot',
      enabled: true,
      notifyBuy: true,
      notifySell: true,
      notifyDaily: true,
      notifyRisk: true
    };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {}
    return this.config;
  }

  isConnected() {
    return Boolean(this.config.enabled && this.config.botToken && this.config.chatId);
  }

  async verifyBotToken(token) {
    if (!token) throw new Error('Token bot tidak boleh kosong');
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await res.json();
      if (data.ok && data.result) {
        return {
          valid: true,
          botUsername: '@' + data.result.username,
          botName: data.result.first_name
        };
      } else {
        throw new Error(data.description || 'Token bot tidak valid');
      }
    } catch (err) {
      throw new Error(`Verifikasi bot gagal: ${err.message}`);
    }
  }

  async detectChatId(token = null) {
    const t = token || this.config.botToken;
    if (!t) throw new Error('Token bot diperlukan');
    try {
      const res = await fetch(`https://api.telegram.org/bot${t}/getUpdates`);
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.description || 'Gagal membaca pembaruan dari Telegram.');
      }
      const updates = data.result || [];
      if (updates.length === 0) {
        throw new Error('Belum ada pesan yang masuk ke bot ini. Buka bot Anda di Telegram (@SmartAIAnalytics_bot), klik Start atau kirim pesan "halo", lalu klik tombol ini lagi.');
      }

      for (let i = updates.length - 1; i >= 0; i--) {
        const u = updates[i];
        const chat = u.message?.chat || u.channel_post?.chat || u.my_chat_member?.chat || u.callback_query?.message?.chat;
        if (chat && chat.id) {
          const senderName = u.message?.from?.first_name || chat.first_name || chat.title || 'Trader';
          return {
            success: true,
            chatId: String(chat.id),
            senderName,
            username: chat.username ? `@${chat.username}` : ''
          };
        }
      }

      throw new Error('Tidak menemukan Chat ID dari obrolan terbaru. Coba kirim pesan lagi ke bot Anda di Telegram.');
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async sendRawMessage(text, options = {}) {
    if (!this.config.botToken || !this.config.chatId) {
      return { success: false, error: 'Token atau Chat ID belum dikonfigurasi' };
    }

    try {
      const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
      const payload = {
        chat_id: this.config.chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.ok) {
        return { success: true, messageId: data.result.message_id };
      } else {
        return { success: false, error: data.description };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Pre-formatted Smart AI Analytics Alerts
  async notifySignalBuy({ symbol, price, amount, stopLoss, takeProfit, strategy }) {
    if (!this.config.enabled || !this.config.notifyBuy) return;

    const symClean = symbol.replace('/', '');
    const text = `
🤖 <b>[Smart AI Analytics] SINYAL BUY TERDETEKSI</b> 🚀
━━━━━━━━━━━━━━━━━━━━
📈 <b>Aset:</b> #${symbol} (#${symClean})
⚡ <b>Strategi:</b> <code>${strategy || 'AI Algorithm'}</code>
💵 <b>Harga Masuk:</b> <code>$${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</code>
📦 <b>Jumlah:</b> <code>${amount}</code>
🎯 <b>Target TP:</b> <code>$${takeProfit ? Number(takeProfit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '--'}</code>
🛡️ <b>Stop Loss:</b> <code>$${stopLoss ? Number(stopLoss).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '--'}</code>
⏱️ <b>Waktu:</b> <code>${new Date().toLocaleTimeString('id-ID')} WIB</code>
━━━━━━━━━━━━━━━━━━━━
💡 <i>Order otomatis telah dieksekusi di market simulator.</i>
`;

    return await this.sendRawMessage(text);
  }

  async notifyPositionClosed({ symbol, exitPrice, entryPrice, realizedPnL, pnlPercent, reason, strategy }) {
    if (!this.config.enabled || !this.config.notifySell) return;

    const isWin = realizedPnL >= 0;
    const symClean = symbol.replace('/', '');
    const emoji = isWin ? '🎉' : '⚠️';
    const tag = isWin ? 'TAKE PROFIT / WIN' : 'STOP LOSS / EXIT';

    const text = `
${emoji} <b>[Smart AI Analytics] ${tag}</b>
━━━━━━━━━━━━━━━━━━━━
📈 <b>Aset:</b> #${symbol} (#${symClean})
🎯 <b>Alasan Exit:</b> <code>${reason || 'Market Close'}</code>
💵 <b>Entry &rarr; Exit:</b> <code>$${entryPrice} &rarr; $${exitPrice}</code>
${isWin ? '💚' : '💔'} <b>Realized PnL:</b> <b>${isWin ? '+' : ''}$${realizedPnL} (${isWin ? '+' : ''}${pnlPercent}%)</b>
⚡ <b>Strategi:</b> <code>${strategy || 'Auto'}</code>
⏱️ <b>Waktu:</b> <code>${new Date().toLocaleTimeString('id-ID')} WIB</code>
━━━━━━━━━━━━━━━━━━━━
📊 <i>Saldo modal diperbarui secara otomatis.</i>
`;

    return await this.sendRawMessage(text);
  }

  async notifyPanicClose(count) {
    if (!this.config.enabled) return;

    const text = `
🚨 <b>[Smart AI Analytics] EMERGENCY PANIC CLOSE!</b> 🚨
━━━━━━━━━━━━━━━━━━━━
⚠️ Perhatian: Seluruh <b>${count} posisi terbuka</b> telah dilikuidasi seketika di harga pasar.
🔒 Bot otomatis dialihkan ke status <b>PAUSED</b> demi melindungi modal.
⏱️ <b>Waktu:</b> <code>${new Date().toLocaleTimeString('id-ID')} WIB</code>
`;

    return await this.sendRawMessage(text);
  }

  async notifyStatusReport(portfolio = {}, status = 'RUNNING', activeSymbol = 'BTC/USDT') {
    if (!this.config.enabled) return;

    const stats = portfolio.stats || {};
    const text = `
🧠 <b>[Smart AI Analytics] RINGKASAN PERFORMA BOT</b> 📊
━━━━━━━━━━━━━━━━━━━━
🤖 <b>Status Bot:</b> <code>${status}</code>
📈 <b>Aset Fokus:</b> <code>${activeSymbol}</code>
💼 <b>Total Ekuitas:</b> <code>$${(portfolio.equity || 10000).toLocaleString('en-US', { minimumFractionDigits: 2 })}</code>
💵 <b>Saldo Kas Tersedia:</b> <code>$${(portfolio.balance || 10000).toLocaleString('en-US', { minimumFractionDigits: 2 })}</code>
📈 <b>Total Realized PnL:</b> <code>${(stats.netPnL || 0) >= 0 ? '+' : ''}$${stats.netPnL || 0}</code>
🎯 <b>Win Rate:</b> <code>${stats.winRate || 0}%</code> (${stats.winningTrades || 0}W / ${stats.losingTrades || 0}L)
⚡ <b>Posisi Aktif:</b> <code>${(portfolio.positions || []).length} Terbuka</code>
━━━━━━━━━━━━━━━━━━━━
🤖 <i>Smart AI Analytics Engine v2.4 Active</i>
`;

    return await this.sendRawMessage(text);
  }

  async sendTestNotification() {
    const text = `
🚀 <b>[Smart AI Analytics] KONEKSI BERHASIL!</b> 🟢
━━━━━━━━━━━━━━━━━━━━
Halo! Bot Telegram <b>@SmartAIAnalytics_bot</b> telah berhasil terhubung dengan akun trading Anda di <b>AutoTrade Pro</b>.

🔔 <b>Fitur Notifikasi Aktif:</b>
• Sinyal beli/jual AI otomatis
• Notifikasi eksekusi Take Profit & Stop Loss
• Proteksi Drawdown & Panic Alert
• Laporan berkala portofolio

<i>Ketik /status di obrolan ini untuk mengecek performa bot kapan saja!</i>
`;
    return await this.sendRawMessage(text);
  }
}

export const telegramService = new TelegramService();
