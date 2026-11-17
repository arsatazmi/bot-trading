# AutoTrade Pro - Trading Bot & Real-Time Web Dashboard

Aplikasi Fullstack Algorithmic Trading Bot & Web Dashboard modern dan interaktif untuk perdagangan **Multi-Aset** (Cryptocurrency, Forex, dan Komoditas) yang dilengkapi dengan simulasi Paper Trading dan konektor Live Exchange API.

---

## 🚀 Fitur Utama

### 1. 📊 Web Dashboard Interaktif & Real-Time
- **TradingView Candlestick Chart** (didukung oleh official `lightweight-charts` v5):
  - Candlestick real-time dengan update per detik.
  - Timeframe: `1m`, `5m`, `15m`, `1h`.
  - Indikator Teknis Overlay: **EMA 9**, **EMA 21**, dan **Bollinger Bands (20, 2)**.
  - Subgraph panel bawah: **RSI 14** dengan garis panduan Overbought (70) dan Oversold (30).
  - Marker visual eksekusi order langsung di atas candle chart: **🟢 BUY (Arrow Up)** & **🔴 SELL (Arrow Down)**.
- **Multi-Asset Ticker Bar**:
  - Pilihan aset crypto: `BTC/USDT`, `ETH/USDT`, `SOL/USDT`.
  - Pilihan aset forex & komoditas: `EUR/USD`, `XAU/USD` (Emas).
  - Statistik 24 jam: Harga Pasar, Perubahan (%), Tertinggi (High), Terendah (Low), Volume, serta visual flash saat terjadi pergerakan harga.
- **Live Order Book Depth Ladder**:
  - Tampilan real-time penawaran beli (Bids) dan jual (Asks) dengan visual bar kedalaman volume dan spread pasar.
- **Portofolio & Metrik Performa**:
  - Saldo Kas Tersedia (USDT), Total Ekuitas, Margin Terpakai.
  - Realized Net PnL ($ dan %), Floating Unrealized PnL.
  - Win Rate (%) dengan visual progress bar, Rasio Menang/Kalah, Profit Factor, dan Maximum Drawdown.
- **Terminal Log Real-Time (Server-Sent Events / SSE)**:
  - Streaming log keputusan bot, sinyal strategi, eksekusi order, peringatan resiko, dan status koneksi tanpa perlu me-refresh halaman.
- **Manajemen Posisi & Riwayat Transaksi**:
  - Tabel posisi terbuka dengan floating PnL dan tombol tutup manual.
  - Tabel riwayat transaksi lengkap dengan alasan exit (TP, SL, Trailing Stop, Manual).
  - Fitur **Export CSV** untuk laporan transaksi.

---

### 2. 🧠 Multi-Strategi Trading Otomatis

1. **RSI + EMA Trend Strategy**
   - Menghitung Relative Strength Index (RSI 14) dan persilangan Exponential Moving Average (EMA 9 cepat & EMA 21 lambat).
   - **Buy Trigger**: RSI berada di zona oversold (<= 32) ATAU terjadi Golden Cross (EMA Fast memotong ke atas EMA Slow dengan RSI aman < 60).
   - **Sell Trigger**: RSI overbought (>= 68) ATAU terjadi Death Cross (EMA Fast memotong ke bawah EMA Slow).

2. **Grid Trading Strategy**
   - Menentukan rentang harga batas atas dan batas bawah (misal ±4%) yang dibagi menjadi beberapa tingkatan grid.
   - Melakukan pembelian bertahap saat harga turun menyentuh grid bawah, dan otomatis menjual tiap grid saat harga memantul naik untuk menghasilkan cuan konsisten di pasar sideways.

3. **DCA (Dollar-Cost Averaging) + Martingale Strategy**
   - Melakukan order dasar awal (Base Order).
   - Jika harga terkoreksi turun per kelipatan persentase tertentu, bot otomatis membeli Safety Orders dengan volume berlipat (multiplier) untuk menurunkan harga rata-rata masuk (*average price*).
   - Seluruh posisi dilikuidasi sekaligus saat harga naik mencapai target profit dari harga rata-rata akumulasi.

4. **MACD Momentum Strategy**
   - Menggunakan kalkulasi Moving Average Convergence Divergence (12/26/9).
   - Mendeteksi kelanjutan tren momentum; sinyal Beli saat histogram berbalik positif dan MACD memotong ke atas garis sinyal.

> 💡 *Semua parameter strategi dapat disesuaikan langsung secara live melalui popup modal **"Strategi"** di dashboard.*

---

### 3. 🛡️ Manajemen Resiko Komprehensif
- **Take Profit (TP %)** & **Stop Loss (SL %)** otomatis per order.
- **Trailing Stop Loss (%)**: Mengunci keuntungan saat harga melaju naik dan menutup posisi saat harga berbalik.
- **Maksimum Posisi Terbuka**: Mencegah *over-leveraging* dan akumulasi posisi berlebih.
- **Proteksi Drawdown Maksimal**: Bot otomatis menjeda aktivitas jika total drawdown harian menyentuh batas toleransi.
- **🚨 Panic Close All (Emergency Button)**: Satu tombol darurat untuk melikuidasi seluruh posisi terbuka secara instan di harga pasar.

---

### 4. 🧪 Mode Operasional Hybrid

- **Paper Trading (Simulasi Virtual)**:
  - Saldo virtual default **$10,000 USD** (bisa di-reset kapan saja).
  - Simulasi pasar real-time dengan model Geometric Brownian Motion dan mikrotren realistis.
  - Kontrol kecepatan simulasi: **1x**, **2x**, **5x**, hingga **10x Turbo** untuk mempercepat pengujian strategi dan melihat eksekusi trading dalam hitungan detik.
  - Simulasi spread dan biaya komisi transaksi (0.075%).
- **Live Exchange API Mode**:
  - Modul konektor terintegrasi CCXT untuk **Binance**, **Bybit**, **Indodax**, dan **OKX**.
  - Mendukung akun **Testnet / Demo** maupun Mainnet.
  - Pengujian koneksi API dan pengecekan saldo secara aman langsung dari UI.

---

## 🛠️ Arsitektur & Teknologi

- **Backend & Bot Engine**:
  - Node.js & Express.
  - Background Bot Loop & Strategy Evaluator.
  - High-performance Market Simulator & Order Matching Engine.
  - Server-Sent Events (SSE) `/api/stream` untuk *sub-second real-time streaming*.
  - CCXT Integration Module.
- **Frontend**:
  - React 19 + Vite.
  - Tailwind CSS + Lucide Icons.
  - TradingView Lightweight Charts (v5.3).

---

## 📦 Menjalankan Proyek Secara Lokal

1. **Instalasi Dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan Mode Pengembangan & Web**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

3. **Build untuk Produksi**:
   ```bash
   npm run build
   npm start
   ```
