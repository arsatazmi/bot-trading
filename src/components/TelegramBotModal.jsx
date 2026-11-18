// src/components/TelegramBotModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Bell, 
  HelpCircle, 
  ExternalLink,
  ShieldCheck,
  Bot,
  Sparkles,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { telegramService } from '../services/telegramService.js';

export function TelegramBotModal({ isOpen, onClose, portfolio = {}, status = 'RUNNING', activeSymbol = 'BTC/USDT' }) {
  const [config, setConfig] = useState(telegramService.config);
  const [testing, setTesting] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setConfig(telegramService.loadConfig());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    telegramService.saveConfig(config);
    setFeedback({
      type: 'success',
      message: 'Pengaturan bot @SmartAIAnalytics_bot berhasil disimpan!'
    });
    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  const handleTestMessage = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      telegramService.saveConfig(config);
      const res = await telegramService.sendTestNotification();
      if (res && res.success) {
        setFeedback({
          type: 'success',
          message: 'Pesan uji coba berhasil dikirim ke Telegram Anda!'
        });
      } else {
        setFeedback({
          type: 'error',
          message: res?.error || 'Gagal mengirim pesan. Pastikan Token & Chat ID benar dan Anda telah menekan /start di obrolan bot.'
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSendReport = async () => {
    setSendingReport(true);
    setFeedback(null);
    try {
      telegramService.saveConfig(config);
      const res = await telegramService.notifyStatusReport(portfolio, status, activeSymbol);
      if (res && res.success) {
        setFeedback({
          type: 'success',
          message: 'Laporan performa & analitik AI berhasil dikirim ke Telegram!'
        });
      } else {
        setFeedback({
          type: 'error',
          message: res?.error || 'Gagal mengirim laporan status.'
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSendingReport(false);
    }
  };

  const isConnected = Boolean(config.botToken && config.chatId && config.enabled);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0e1422] border border-white/[0.08] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header with Telegram Branding */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-[#111a2f] via-[#0e1526] to-[#0e1422]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Send className="h-5 w-5 -ml-0.5 mt-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Smart AI Analytics Bot</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-mono font-bold border border-sky-500/30">
                  @SmartAIAnalytics_bot
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Integrasi notifikasi instan sinyal & eksekusi AI ke smartphone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-2.5 bg-[#090d16] border-b border-white/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="font-medium text-slate-300">
              Status Bot: {isConnected ? <strong className="text-emerald-400">Aktif & Terhubung</strong> : <span className="text-slate-400">Belum Terhubung</span>}
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-[11px] text-slate-400 font-medium">Aktifkan Notifikasi</span>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={e => setConfig({ ...config, enabled: e.target.checked })}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 cursor-pointer"
            />
          </label>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick Guide Card */}
          <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <span className="font-bold block mb-0.5">Cara Menghubungkan dalam 1 Menit:</span>
              1. Buka Telegram dan cari <strong>@BotFather</strong>, ketik <code>/newbot</code> untuk membuat bot baru Anda (misal nama: <code>SmartAIAnalytics_bot</code>).<br />
              2. Salin <strong>HTTP API Token</strong> yang diberikan ke form di bawah.<br />
              3. Kirim pesan apa saja ke bot Anda, lalu masukkan <strong>Chat ID</strong> Anda (bisa cek via <code>@userinfobot</code> di Telegram).
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            {/* Bot Token */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">Telegram Bot Token</label>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
                >
                  Buka @BotFather <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <input
                type="password"
                placeholder="Contoh: 7123456789:AAFlkB... (dari @BotFather)"
                value={config.botToken}
                onChange={e => setConfig({ ...config, botToken: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            {/* Chat ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">Telegram Chat ID Anda</label>
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
                >
                  Cek ID di @userinfobot <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <input
                type="text"
                placeholder="Contoh: 123456789 (ID Telegram akun Anda)"
                value={config.chatId}
                onChange={e => setConfig({ ...config, chatId: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            {/* Notification Checkboxes */}
            <div className="pt-2 border-t border-white/[0.06]">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Pilih Jenis Notifikasi yang Dikirim:
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-[#101623] border border-white/[0.05] cursor-pointer hover:border-sky-500/30">
                  <input
                    type="checkbox"
                    checked={config.notifyBuy}
                    onChange={e => setConfig({ ...config, notifyBuy: e.target.checked })}
                    className="h-4 w-4 rounded text-sky-500 bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-300 text-[11px] font-medium">Sinyal & Eksekusi BUY</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-[#101623] border border-white/[0.05] cursor-pointer hover:border-sky-500/30">
                  <input
                    type="checkbox"
                    checked={config.notifySell}
                    onChange={e => setConfig({ ...config, notifySell: e.target.checked })}
                    className="h-4 w-4 rounded text-sky-500 bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-300 text-[11px] font-medium">Take Profit & Stop Loss</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-[#101623] border border-white/[0.05] cursor-pointer hover:border-sky-500/30">
                  <input
                    type="checkbox"
                    checked={config.notifyRisk}
                    onChange={e => setConfig({ ...config, notifyRisk: e.target.checked })}
                    className="h-4 w-4 rounded text-sky-500 bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-300 text-[11px] font-medium">Panic Close & Drawdown</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-[#101623] border border-white/[0.05] cursor-pointer hover:border-sky-500/30">
                  <input
                    type="checkbox"
                    checked={config.notifyDaily}
                    onChange={e => setConfig({ ...config, notifyDaily: e.target.checked })}
                    className="h-4 w-4 rounded text-sky-500 bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-300 text-[11px] font-medium">Laporan Performa Berkala</span>
                </label>
              </div>
            </div>

            {/* Feedback notification */}
            {feedback && (
              <div className={`p-3 rounded-xl text-xs border ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
              }`}>
                {feedback.message}
              </div>
            )}

            {/* Test & Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestMessage}
                  disabled={testing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#101623] text-sky-400 border border-sky-500/30 hover:bg-sky-500/10 transition-all disabled:opacity-50"
                  title="Kirim pesan tes ke obrolan Telegram"
                >
                  <Send className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
                  Tes Kirim Pesan
                </button>

                <button
                  type="button"
                  onClick={handleSendReport}
                  disabled={sendingReport}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#101623] text-slate-300 border border-white/[0.08] hover:bg-white/[0.05] transition-all disabled:opacity-50"
                  title="Kirim ringkasan ekuitas & posisi saat ini"
                >
                  <Bot className="h-3.5 w-3.5 text-cyan-400" />
                  Kirim Status
                </button>
              </div>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition-all active:scale-95"
              >
                Simpan
              </button>
            </div>
          </form>

          {/* Interactive Preview of Message in Telegram */}
          <div className="pt-2 border-t border-white/[0.06]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Contoh Format Notifikasi di Telegram:
            </span>
            <div className="p-3.5 rounded-xl bg-[#17212b] border border-[#232e3c] font-mono text-xs text-slate-200 shadow-inner space-y-1.5">
              <div className="text-sky-400 font-bold flex items-center gap-1.5">
                <span>🤖 [Smart AI Analytics] SINYAL BUY TERDETEKSI</span>
                <span>🚀</span>
              </div>
              <div className="text-slate-400 text-[10px]">━━━━━━━━━━━━━━━━━━━━</div>
              <div className="text-slate-200">📈 <b>Aset:</b> #BTC/USDT</div>
              <div className="text-slate-200">⚡ <b>Strategi:</b> <code>RSI + EMA Trend</code></div>
              <div className="text-slate-200">💵 <b>Harga Masuk:</b> <code>$68,450.20</code></div>
              <div className="text-emerald-400 font-semibold">🎯 <b>Target TP:</b> <code>$71,188.20 (+4.0%)</code></div>
              <div className="text-rose-400 font-semibold">🛡️ <b>Stop Loss:</b> <code>$66,738.94 (-2.5%)</code></div>
              <div className="text-slate-400 text-[10px]">━━━━━━━━━━━━━━━━━━━━</div>
              <div className="text-slate-400 text-[11px] italic">💡 Status: Posisi Aktif Terbuka</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
