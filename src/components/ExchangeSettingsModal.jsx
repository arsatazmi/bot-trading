// src/components/ExchangeSettingsModal.jsx
import React, { useState } from 'react';
import { X, Key, ShieldCheck, AlertTriangle, Eye, EyeOff, CheckCircle2, RefreshCw } from 'lucide-react';
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
      if (res.success) {
        setFeedback({ type: 'success', message: 'Kredensial API Exchange berhasil disimpan!' });
        if (onConfigSaved) onConfigSaved(res);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Gagal menyimpan konfigurasi.' });
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
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `${res.message} Saldo USDT: $${res.usdtBalance.toFixed(2)}`
        });
      } else {
        setFeedback({ type: 'error', message: res.error });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#121721] border border-[#1f293d] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f293d] bg-[#161c28]">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base text-white">Integrasi Live Exchange API</h3>
              <p className="text-xs text-slate-400">Hubungkan bot ke bursa kripto riil</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f293d] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="p-4 mx-6 mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold block mb-0.5">Panduan Keamanan API Key:</span>
            Hanya berikan izin <strong>Read</strong> dan <strong>Spot Trading</strong>. <strong>JANGAN PERNAH</strong> mencentang izin "Withdrawal" (Penarikan Dana) pada API Key exchange Anda!
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Exchange Selection */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">Pilih Bursa / Exchange:</label>
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
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
                    exchange === ex.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-[#161c28] border-[#1f293d] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>

          {/* Testnet Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#161c28] border border-[#1f293d]">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-200">Gunakan Testnet / Sandbox Mode</span>
              <span className="text-[11px] text-slate-400">Gunakan akun demo exchange untuk uji coba tanpa risiko</span>
            </div>
            <input
              type="checkbox"
              checked={isTestnet}
              onChange={e => setIsTestnet(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">API Key</label>
            <input
              type="text"
              placeholder={liveExchangeInfo.maskedKey ? `Tersimpan (${liveExchangeInfo.maskedKey})` : 'Masukkan API Key Anda'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full bg-[#161c28] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {/* API Secret */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">API Secret</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                placeholder="Masukkan API Secret Anda"
                value={apiSecret}
                onChange={e => setApiSecret(e.target.value)}
                className="w-full bg-[#161c28] border border-[#1f293d] rounded-lg pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div className={`p-3 rounded-lg text-xs border ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {feedback.message}
            </div>
          )}

          {/* Buttons */}
          <div className="pt-3 border-t border-[#1f293d] flex items-center justify-between">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#161c28] text-slate-300 border border-[#1f293d] hover:bg-[#1a2232] hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
              Tes Koneksi
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#161c28] transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
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
