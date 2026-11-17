// src/components/ChartView.jsx
import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  CandlestickSeries, 
  LineSeries, 
  createSeriesMarkers 
} from 'lightweight-charts';
import { Maximize2, Layers, BarChart3, Activity } from 'lucide-react';

export function ChartView({ 
  candles = [], 
  markers = [], 
  activeSymbol = 'BTC/USDT',
  currentPrice = 0
}) {
  const containerRef = useRef(null);
  const rsiContainerRef = useRef(null);
  const chartRef = useRef(null);
  const rsiChartRef = useRef(null);

  const candleSeriesRef = useRef(null);
  const emaFastSeriesRef = useRef(null);
  const emaSlowSeriesRef = useRef(null);
  const bbUpperSeriesRef = useRef(null);
  const bbLowerSeriesRef = useRef(null);
  const rsiSeriesRef = useRef(null);
  const markersRef = useRef(null);

  // Indicators toggle
  const [showEMA, setShowEMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [timeframe, setTimeframe] = useState('1m');

  // Chart setup
  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    if (rsiChartRef.current) {
      rsiChartRef.current.remove();
      rsiChartRef.current = null;
    }

    const chartOptions = {
      layout: {
        background: { color: '#0d121c' },
        textColor: '#848e9c',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' }
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#475569', width: 1, style: 2 },
        horzLine: { color: '#475569', width: 1, style: 2 }
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        rightOffset: 12,
        barSpacing: 9
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        autoScale: true
      }
    };

    // Main Chart
    const mainChart = createChart(containerRef.current, {
      ...chartOptions,
      height: 380
    });
    chartRef.current = mainChart;

    const candleSeries = mainChart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderUpColor: '#10b981',
      borderDownColor: '#f43f5e',
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e'
    });
    candleSeriesRef.current = candleSeries;

    // Fast EMA Line (9)
    const emaFast = mainChart.addSeries(LineSeries, {
      color: '#38bdf8',
      lineWidth: 2,
      title: 'EMA 9',
      crosshairMarkerVisible: false
    });
    emaFastSeriesRef.current = emaFast;

    // Slow EMA Line (21)
    const emaSlow = mainChart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      title: 'EMA 21',
      crosshairMarkerVisible: false
    });
    emaSlowSeriesRef.current = emaSlow;

    // Bollinger Bands Upper & Lower
    const bbUpper = mainChart.addSeries(LineSeries, {
      color: 'rgba(168, 85, 247, 0.5)',
      lineWidth: 1,
      lineStyle: 2,
      title: 'BB Upper',
      crosshairMarkerVisible: false
    });
    bbUpperSeriesRef.current = bbUpper;

    const bbLower = mainChart.addSeries(LineSeries, {
      color: 'rgba(168, 85, 247, 0.5)',
      lineWidth: 1,
      lineStyle: 2,
      title: 'BB Lower',
      crosshairMarkerVisible: false
    });
    bbLowerSeriesRef.current = bbLower;

    // RSI Subgraph
    if (rsiContainerRef.current) {
      const rsiChart = createChart(rsiContainerRef.current, {
        ...chartOptions,
        height: 100,
        timeScale: {
          ...chartOptions.timeScale,
          visible: false
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.08)',
          scaleMargins: { top: 0.1, bottom: 0.1 }
        }
      });
      rsiChartRef.current = rsiChart;

      const rsiSeries = rsiChart.addSeries(LineSeries, {
        color: '#a855f7',
        lineWidth: 2,
        title: 'RSI 14',
        crosshairMarkerVisible: false
      });
      rsiSeriesRef.current = rsiSeries;

      // Guides
      rsiChart.addSeries(LineSeries, {
        color: 'rgba(244, 63, 94, 0.4)',
        lineWidth: 1,
        lineStyle: 2,
        crosshairMarkerVisible: false
      }).setData([{ time: 0, value: 70 }, { time: 2147483647, value: 70 }]);

      rsiChart.addSeries(LineSeries, {
        color: 'rgba(16, 185, 129, 0.4)',
        lineWidth: 1,
        lineStyle: 2,
        crosshairMarkerVisible: false
      }).setData([{ time: 0, value: 30 }, { time: 2147483647, value: 30 }]);

      mainChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range && rsiChart) rsiChart.timeScale().setVisibleLogicalRange(range);
      });
      rsiChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range && mainChart) mainChart.timeScale().setVisibleLogicalRange(range);
      });
    }

    const handleResize = () => {
      if (containerRef.current && mainChart) {
        mainChart.applyOptions({ width: containerRef.current.clientWidth });
      }
      if (rsiContainerRef.current && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({ width: rsiContainerRef.current.clientWidth });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) chartRef.current.remove();
      if (rsiChartRef.current) rsiChartRef.current.remove();
    };
  }, []);

  // Update Data
  useEffect(() => {
    if (!candleSeriesRef.current || !candles || candles.length === 0) return;

    const formattedCandles = candles.map(c => ({
      time: c.time,
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close)
    })).sort((a, b) => a.time - b.time);

    candleSeriesRef.current.setData(formattedCandles);

    // EMA
    if (emaFastSeriesRef.current) {
      if (showEMA) {
        emaFastSeriesRef.current.setData(calculateEmaData(formattedCandles, 9));
        emaFastSeriesRef.current.applyOptions({ visible: true });
      } else {
        emaFastSeriesRef.current.applyOptions({ visible: false });
      }
    }

    if (emaSlowSeriesRef.current) {
      if (showEMA) {
        emaSlowSeriesRef.current.setData(calculateEmaData(formattedCandles, 21));
        emaSlowSeriesRef.current.applyOptions({ visible: true });
      } else {
        emaSlowSeriesRef.current.applyOptions({ visible: false });
      }
    }

    // BB
    if (bbUpperSeriesRef.current && bbLowerSeriesRef.current) {
      if (showBB) {
        const { upper, lower } = calculateBollingerData(formattedCandles, 20, 2);
        bbUpperSeriesRef.current.setData(upper);
        bbLowerSeriesRef.current.setData(lower);
        bbUpperSeriesRef.current.applyOptions({ visible: true });
        bbLowerSeriesRef.current.applyOptions({ visible: true });
      } else {
        bbUpperSeriesRef.current.applyOptions({ visible: false });
        bbLowerSeriesRef.current.applyOptions({ visible: false });
      }
    }

    // RSI
    if (rsiSeriesRef.current && rsiChartRef.current) {
      if (showRSI) {
        rsiSeriesRef.current.setData(calculateRsiData(formattedCandles, 14));
      }
    }

    // Markers
    if (markers && markers.length > 0 && candleSeriesRef.current) {
      try {
        const sortedMarkers = [...markers]
          .map(m => ({
            time: m.time,
            position: m.position || 'aboveBar',
            color: m.color || '#2962ff',
            shape: m.shape || 'arrowUp',
            text: m.text || ''
          }))
          .sort((a, b) => a.time - b.time);

        if (!markersRef.current) {
          markersRef.current = createSeriesMarkers(candleSeriesRef.current, sortedMarkers);
        } else {
          markersRef.current.setMarkers(sortedMarkers);
        }
      } catch (err) {}
    }
  }, [candles, markers, showEMA, showBB, showRSI]);

  function calculateEmaData(candleList, period) {
    if (candleList.length < period) return [];
    const k = 2 / (period + 1);
    let ema = candleList.slice(0, period).reduce((sum, c) => sum + c.close, 0) / period;
    const res = [{ time: candleList[period - 1].time, value: +ema.toFixed(2) }];
    for (let i = period; i < candleList.length; i++) {
      ema = candleList[i].close * k + ema * (1 - k);
      res.push({ time: candleList[i].time, value: +ema.toFixed(2) });
    }
    return res;
  }

  function calculateBollingerData(candleList, period = 20, mult = 2) {
    if (candleList.length < period) return { upper: [], lower: [] };
    const upper = [];
    const lower = [];
    for (let i = period - 1; i < candleList.length; i++) {
      const slice = candleList.slice(i - period + 1, i + 1);
      const mean = slice.reduce((sum, c) => sum + c.close, 0) / period;
      const variance = slice.reduce((acc, c) => acc + Math.pow(c.close - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      upper.push({ time: candleList[i].time, value: +(mean + mult * stdDev).toFixed(2) });
      lower.push({ time: candleList[i].time, value: +(mean - mult * stdDev).toFixed(2) });
    }
    return { upper, lower };
  }

  function calculateRsiData(candleList, period = 14) {
    if (candleList.length <= period) return [];
    const result = [];
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = candleList[i].close - candleList[i - 1].close;
      if (diff >= 0) gains += diff; else losses += Math.abs(diff);
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < candleList.length; i++) {
      const diff = candleList[i].close - candleList[i - 1].close;
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
      }
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push({ time: candleList[i].time, value: +(100 - (100 / (1 + rs))).toFixed(2) });
    }
    return result;
  }

  const handleResetZoom = () => {
    if (chartRef.current) chartRef.current.timeScale().fitContent();
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Chart Header Toolbar */}
      <div className="px-4 py-2.5 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 bg-[#0c101b]/80">
        {/* Left: Timeframe pills */}
        <div className="flex items-center gap-1.5">
          <div className="flex bg-white/[0.04] p-0.5 rounded-xl border border-white/[0.06]">
            {['1m', '5m', '15m', '1h'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/[0.08] mx-1 hidden sm:block" />

          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 pl-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{activeSymbol} Live Chart</span>
          </div>
        </div>

        {/* Right: Technical Indicator Toggles */}
        <div className="flex items-center gap-1.5">
          {/* EMA */}
          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
              showEMA
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:text-slate-300'
            }`}
            title="Toggle EMA 9 & EMA 21"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>EMA (9/21)</span>
          </button>

          {/* Bollinger Bands */}
          <button
            onClick={() => setShowBB(!showBB)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
              showBB
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:text-slate-300'
            }`}
            title="Toggle Bollinger Bands"
          >
            <span>BB (20, 2)</span>
          </button>

          {/* RSI */}
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
              showRSI
                ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:text-slate-300'
            }`}
            title="Toggle RSI Subchart"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>RSI 14</span>
          </button>

          {/* Fit zoom */}
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            title="Fit to Window"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Chart Body */}
      <div className="relative w-full bg-[#0d121c]">
        <div ref={containerRef} className="w-full" style={{ height: 380 }} />
        
        {/* Floating Indicator Legend */}
        {showEMA && (
          <div className="absolute top-3 left-4 z-10 flex items-center gap-3 text-[11px] font-mono bg-[#0c101b]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/[0.06] pointer-events-none">
            <span className="text-sky-400 flex items-center gap-1">
              <span className="h-1.5 w-3 bg-sky-400 inline-block rounded" />
              EMA 9
            </span>
            <span className="text-amber-400 flex items-center gap-1">
              <span className="h-1.5 w-3 bg-amber-400 inline-block rounded" />
              EMA 21
            </span>
          </div>
        )}
      </div>

      {/* Synchronized RSI Pane */}
      {showRSI && (
        <div className="border-t border-white/[0.06] relative bg-[#090d16]">
          <div className="absolute top-1.5 left-4 z-10 text-[10px] font-mono text-purple-400 font-semibold pointer-events-none">
            RSI 14 — Overbought [70] / Oversold [30]
          </div>
          <div ref={rsiContainerRef} className="w-full" style={{ height: 100 }} />
        </div>
      )}
    </div>
  );
}
