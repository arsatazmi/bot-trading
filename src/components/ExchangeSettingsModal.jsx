// src/components/ExchangeSettingsModal.jsx
import React, { useState } from 'react';
import { X, KeyRound, ShieldCheck, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { saveExchangeConfig, testExchangeConnection } from '../services/api.js';

export function ExchangeSettingsModal({
  isOpen,
  onClose,
  liveExchangeInfo = {},
  onConfigSaved
}) {
  const [exchange, setExchange] = useState(liveExchangeInfo.exchange || 'binance');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isTestnet, setIsTestnet] = useState(liveExchangeInfo.isTestnet ?? true);
  const [showSecret, setShowSecret] = useState(false);

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const res = await saveExchangeConfig({ exchange, apiKey, apiSecret, isTestnet });
      if (res && res.success) {
        setFeedback({ type: 'success', message: 'Kredensial API Exchange berhasil disimpan!' });
        if (onConfigSaved) onConfigSaved(res);
      } else {
        setFeedback({ type: 'error', message: res?.error || 'Gagal menyimpan konfigurasi.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const res = await testExchangeConnection();
      if (res && res.success) {
        setFeedback({
          type: 'success',
          message: `${res.message} Saldo USDT: $${(res.usdtBalance || 0).toFixed(2)}`
        });
      } else {
        setFeedback({ type: 'error', message: res?.error || 'Gagal terhubung.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0e1422] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#121929]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Integrasi Exchange API</h3>
              <p className="text-[11px] text-slate-400">Hubungkan bot ke bursa kripto riil</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Security Warning */}
        <div className="p-3.5 mx-6 mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <span className="font-bold block mb-0.5">Panduan Keamanan:</span>
            Hanya izinkan izin <strong>Read</strong> dan <strong>Spot Trading</strong>. JANGAN PERNAH mengaktifkan opsi <strong>Withdrawal (Penarikan Dana)</strong>!
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">Pilih Exchange:</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'binance', name: 'Binance' },
                { id: 'bybit', name: 'Bybit' },
                { id: 'indodax', name: 'Indodax' },
                { id: 'okx', name: 'OKX' }
              ].map(ex => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setExchange(ex.id)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all text-center ${
                    exchange === ex.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-[#101623] border-white/[0.06] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#101623] border border-white/[0.06]">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Mode Testnet / Demo</span>
              <span className="text-[11px] text-slate-400">Gunakan akun simulasi resmi tanpa risiko saldo riil</span>
            </div>
            <input
              type="checkbox"
              checked={isTestnet}
              onChange={e => setIsTestnet(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">API Key</label>
            <input
              type="text"
              placeholder={liveExchangeInfo?.maskedKey ? `Tersimpan (${liveExchangeInfo.maskedKey})` : 'Masukkan API Key Anda'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">API Secret</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                placeholder="Masukkan API Secret Anda"
                value={apiSecret}
                onChange={e => setApiSecret(e.target.value)}
                className="w-full glass-input rounded-xl pl-3 pr-10 py-2 text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {feedback && (
            <div className={`p-3 rounded-xl text-xs border ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {feedback.message}
            </div>
          )}

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#101623] text-slate-300 border border-white/[0.08] hover:bg-white/[0.05] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
              Tes Koneksi
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-95"
              >
                Simpan API Key
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
