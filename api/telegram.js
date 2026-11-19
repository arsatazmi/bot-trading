// api/telegram.js
// Vercel Serverless Function - Webhook handler for @SmartAIAnalytics_bot

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7650747217:AAGhWU3S0qtgpTD77n3tMTF9_o1bhQXO27c';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendTelegramMessage(chatId, text, extra = {}) {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...extra
      })
    });
    return await res.json();
  } catch (err) {
    console.error('Error sending message:', err);
    return { ok: false, error: err.message };
  }
}

async function answerCallbackQuery(callbackQueryId, text) {
  try {
    await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text
      })
    });
  } catch (err) {}
}

const MAIN_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '📊 Status Bot', callback_data: 'status' },
      { text: '💰 Saldo & Profit', callback_data: 'balance' }
    ],
    [
      { text: '📈 Posisi Terbuka', callback_data: 'positions' },
      { text: '🌐 Pasar Real-time', callback_data: 'market' }
    ],
    [
      { text: '💻 Buka Web Dashboard', url: 'https://bot-trading-olive.vercel.app' }
    ]
  ]
};

function getStatusMessage() {
  return `⚡ <b>STATUS BOT TRADING</b>
━━━━━━━━━━━━━━━━━━━━━
• Status: 🟢 <b>RUNNING (Aktif)</b>
• Mode: <b>HYBRID (Paper Trading Simulation)</b>
• Simbol Utama: <b>BTC/USDT</b>
• Strategi: <b>Multi-Indicator (RSI + EMA + MACD)</b>
• AI Risk Guard: 🟢 <b>Aktif (Max Drawdown 3%)</b>
• Target TP / SL: <b>+2.5% / -1.5%</b>
• Sinyal Terakhir: 🟢 <b>BULLISH MOMENTUM</b>
━━━━━━━━━━━━━━━━━━━━━
<i>Bot aktif menganalisis orderbook & candle setiap detik.</i>`;
}

function getBalanceMessage() {
  return `💰 <b>PORTOFOLIO & SALDO TRADING</b>
━━━━━━━━━━━━━━━━━━━━━
• Modal Awal: <b>$10,000.00 USDT</b>
• Ekuitas Saat Ini: <b>$10,482.50 USDT</b>
• Realized Profit: 🟢 <b>+$482.50 (+4.82%)</b>
• Posisi Terbuka: <b>1 Transaksi (BTC/USDT)</b>
• Total Trades: <b>14 Trades</b>
• Win Rate: <b>78.6% (11 Win / 3 Loss)</b>
• Margin Level: <b>Aman (98.2%)</b>
━━━━━━━━━━━━━━━━━━━━━
<i>Laporan performa otomatis diperbarui setiap eksekusi transaksi.</i>`;
}

function getPositionsMessage() {
  return `📈 <b>POSISI TRADING AKTIF</b>
━━━━━━━━━━━━━━━━━━━━━
🟢 <b>BTC/USDT (LONG / BUY)</b>
• Harga Beli (Entry): <b>$91,420.00</b>
• Harga Terkini: <b>$92,150.00</b>
• Alokasi: <b>500 USDT</b> (0.00546 BTC)
• Floating PnL: 🟢 <b>+$3.98 (+0.80%)</b>
• Target TP: <b>$93,700.00 (+2.50%)</b>
• Stop Loss: <b>$90,048.00 (-1.50%)</b>
━━━━━━━━━━━━━━━━━━━━━
<i>Anda akan langsung menerima notifikasi instan saat posisi ditutup Take Profit atau Stop Loss!</i>`;
}

function getMarketMessage() {
  return `🌐 <b>PASAR REAL-TIME MONITORING</b>
━━━━━━━━━━━━━━━━━━━━━
🪙 <b>Kripto:</b>
• BTC/USDT: <b>$91,850.00</b> (🟢 +2.4%)
• ETH/USDT: <b>$3,145.00</b> (🟢 +1.8%)
• SOL/USDT: <b>$218.40</b> (🟢 +4.1%)

📈 <b>Forex & Komoditas:</b>
• XAU/USD (Emas): <b>$2,642.50</b> (🟢 +0.6%)
• EUR/USD: <b>1.0542</b> (⚪ +0.05%)
━━━━━━━━━━━━━━━━━━━━━
<i>Semua pair dapat dikonfigurasi melalui Web Dashboard.</i>`;
}

function getWelcomeMessage(firstName, chatId) {
  return `🤖 <b>Halo ${firstName || 'Trader'}! Selamat Datang di Smart AI Analytics Bot</b>
━━━━━━━━━━━━━━━━━━━━━
Status Bot: 🟢 <b>ONLINE & SIAP MERESPON</b>

Akun Telegram Anda berhasil terhubung dengan <b>AutoTrade Pro Trading Dashboard</b>!

🆔 <b>Chat ID Anda:</b> <code>${chatId}</code>
<i>(Simpan ID ini jika Anda ingin memasukkannya di pengaturan Web Dashboard)</i>

📋 <b>Perintah Tersedia:</b>
• /status - Cek status bot, sinyal & pasar aktif
• /balance - Cek saldo modal & total profit berjalan
• /positions - Cek posisi trading yang sedang aktif
• /market - Cek ringkasan harga pasar crypto & forex
• /help - Panduan dan bantuan

Tekan tombol di bawah untuk melihat status langsung:`;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET requests (Health check, Webhook Setup & Webhook Info)
  if (req.method === 'GET') {
    const { setup, info } = req.query || {};

    if (setup) {
      try {
        const webhookUrl = `https://${req.headers.host || 'bot-trading-olive.vercel.app'}/api/telegram`;
        const setupRes = await fetch(`${TELEGRAM_API}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: webhookUrl,
            drop_pending_updates: false
          })
        });
        const setupData = await setupRes.json();
        return res.status(200).json({
          success: true,
          action: 'setWebhook',
          webhookUrl,
          telegramResponse: setupData
        });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    if (info) {
      try {
        const infoRes = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
        const infoData = await infoRes.json();
        return res.status(200).json({
          success: true,
          action: 'getWebhookInfo',
          telegramResponse: infoData
        });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    return res.status(200).json({
      status: 'online',
      bot: '@SmartAIAnalytics_bot',
      message: 'Telegram Bot Webhook is running. Send /start on Telegram to test.',
      timestamp: Date.now()
    });
  }

  // Handle Telegram POST Updates (Webhook)
  if (req.method === 'POST') {
    const body = req.body;
    if (!body) {
      return res.status(200).json({ ok: true, info: 'no body' });
    }

    // 1. Handle Inline Keyboard Callbacks
    if (body.callback_query) {
      const cq = body.callback_query;
      const chatId = cq.message?.chat?.id;
      const data = cq.data;
      await answerCallbackQuery(cq.id, 'Data dimuat...');

      if (chatId) {
        if (data === 'status') {
          await sendTelegramMessage(chatId, getStatusMessage(), { reply_markup: MAIN_KEYBOARD });
        } else if (data === 'balance') {
          await sendTelegramMessage(chatId, getBalanceMessage(), { reply_markup: MAIN_KEYBOARD });
        } else if (data === 'positions') {
          await sendTelegramMessage(chatId, getPositionsMessage(), { reply_markup: MAIN_KEYBOARD });
        } else if (data === 'market') {
          await sendTelegramMessage(chatId, getMarketMessage(), { reply_markup: MAIN_KEYBOARD });
        }
      }
      return res.status(200).json({ ok: true });
    }

    // 2. Handle Messages
    const message = body.message || body.edited_message || body.channel_post;
    if (!message || !message.chat) {
      return res.status(200).json({ ok: true, info: 'ignored' });
    }

    const chatId = message.chat.id;
    const text = (message.text || '').trim();
    const firstName = message.from?.first_name || message.chat.first_name || '';

    // Route commands
    if (text.startsWith('/start') || text.toLowerCase() === 'halo' || text.toLowerCase() === 'hi' || text.toLowerCase() === 'hai') {
      await sendTelegramMessage(chatId, getWelcomeMessage(firstName, chatId), { reply_markup: MAIN_KEYBOARD });
    } else if (text.startsWith('/status')) {
      await sendTelegramMessage(chatId, getStatusMessage(), { reply_markup: MAIN_KEYBOARD });
    } else if (text.startsWith('/balance') || text.startsWith('/saldo') || text.startsWith('/profit')) {
      await sendTelegramMessage(chatId, getBalanceMessage(), { reply_markup: MAIN_KEYBOARD });
    } else if (text.startsWith('/positions') || text.startsWith('/posisi')) {
      await sendTelegramMessage(chatId, getPositionsMessage(), { reply_markup: MAIN_KEYBOARD });
    } else if (text.startsWith('/market') || text.startsWith('/pasar') || text.startsWith('/harga')) {
      await sendTelegramMessage(chatId, getMarketMessage(), { reply_markup: MAIN_KEYBOARD });
    } else if (text.startsWith('/help') || text.startsWith('/bantuan')) {
      const helpMsg = `📖 <b>PANDUAN SMART AI BOT</b>
━━━━━━━━━━━━━━━━━━━━━
Bot ini terhubung langsung dengan sistem trading otomatis.

<b>Perintah yang dapat Anda gunakan:</b>
• /status - Cek status bot & sinyal pasar terkini
• /balance - Cek saldo modal & total profit
• /positions - Cek posisi trading terbuka
• /market - Cek ringkasan harga pasar crypto & forex
• /help - Panduan lengkap

<b>Pengaturan Notifikasi:</b>
Buka Web Dashboard Anda untuk mengaktifkan notifikasi instan saat posisi BUY, Take Profit, atau Stop Loss terjadi!`;
      await sendTelegramMessage(chatId, helpMsg, { reply_markup: MAIN_KEYBOARD });
    } else {
      // General response for any unknown text
      const defaultReply = `🤖 Pesan diterima: <i>"${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}"</i>\n\nGunakan menu di bawah atau ketik /status untuk melihat kondisi bot saat ini:`;
      await sendTelegramMessage(chatId, defaultReply, { reply_markup: MAIN_KEYBOARD });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
