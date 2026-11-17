// src/components/ChartView.jsx
import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  CandlestickSeries, 
  LineSeries, 
  createSeriesMarkers 
} from 'lightweight-charts';
import { Maximize2, Eye, EyeOff, Layers, BarChart2 } from 'lucide-react';

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

  // Indicators toggle state
  const [showEMA, setShowEMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [timeframe, setTimeframe] = useState('1m');

  // Initialize Main Chart & RSI Subgraph
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up old charts if any
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
        background: { color: '#121721' },
        textColor: '#848e9c',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11
      },
      grid: {
        vertLines: { color: '#1a2232' },
        horzLines: { color: '#1a2232' }
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#475569', width: 1, style: 2 },
        horzLine: { color: '#475569', width: 1, style: 2 }
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#1f293d',
        rightOffset: 12,
        barSpacing: 10
      },
      rightPriceScale: {
        borderColor: '#1f293d',
        autoScale: true
      }
    };

    // 1. Create Main Candlestick Chart
    const mainChart = createChart(containerRef.current, {
      ...chartOptions,
      height: 380
    });
    chartRef.current = mainChart;

    const candleSeries = mainChart.addSeries(CandlestickSeries, {
      upColor: '#00c076',
      downColor: '#ff4d4f',
      borderUpColor: '#00c076',
      borderDownColor: '#ff4d4f',
      wickUpColor: '#00c076',
      wickDownColor: '#ff4d4f'
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

    // Bollinger Upper
    const bbUpper = mainChart.addSeries(LineSeries, {
      color: 'rgba(168, 85, 247, 0.6)',
      lineWidth: 1,
      lineStyle: 2,
      title: 'BB Upper',
      crosshairMarkerVisible: false
    });
    bbUpperSeriesRef.current = bbUpper;

    // Bollinger Lower
    const bbLower = mainChart.addSeries(LineSeries, {
      color: 'rgba(168, 85, 247, 0.6)',
      lineWidth: 1,
      lineStyle: 2,
      title: 'BB Lower',
      crosshairMarkerVisible: false
    });
    bbLowerSeriesRef.current = bbLower;

    // 2. Create RSI Subgraph Chart
    if (rsiContainerRef.current) {
      const rsiChart = createChart(rsiContainerRef.current, {
        ...chartOptions,
        height: 110,
        timeScale: {
          ...chartOptions.timeScale,
          visible: false // hide time axis on subchart to avoid clutter
        },
        rightPriceScale: {
          borderColor: '#1f293d',
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

      // Overbought 70 guide line
      rsiChart.addSeries(LineSeries, {
        color: 'rgba(239, 68, 68, 0.5)',
        lineWidth: 1,
        lineStyle: 2,
        crosshairMarkerVisible: false
      }).setData([
        { time: 0, value: 70 },
        { time: 2147483647, value: 70 }
      ]);

      // Oversold 30 guide line
      rsiChart.addSeries(LineSeries, {
        color: 'rgba(34, 197, 94, 0.5)',
        lineWidth: 1,
        lineStyle: 2,
        crosshairMarkerVisible: false
      }).setData([
        { time: 0, value: 30 },
        { time: 2147483647, value: 30 }
      ]);

      // Synchronize time scales
      mainChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range && rsiChart) {
          rsiChart.timeScale().setVisibleLogicalRange(range);
        }
      });

      rsiChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range && mainChart) {
          mainChart.timeScale().setVisibleLogicalRange(range);
        }
      });
    }

    // Handle Window Resize
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

  // Update Data when candles change
  useEffect(() => {
    if (!candleSeriesRef.current || !candles || candles.length === 0) return;

    // Format and sort candles
    const formattedCandles = candles.map(c => ({
      time: c.time,
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close)
    })).sort((a, b) => a.time - b.time);

    candleSeriesRef.current.setData(formattedCandles);

    // Compute Fast EMA (9)
    if (emaFastSeriesRef.current) {
      if (showEMA) {
        const ema9Data = calculateEmaData(formattedCandles, 9);
        emaFastSeriesRef.current.setData(ema9Data);
        emaFastSeriesRef.current.applyOptions({ visible: true });
      } else {
        emaFastSeriesRef.current.applyOptions({ visible: false });
      }
    }

    // Compute Slow EMA (21)
    if (emaSlowSeriesRef.current) {
      if (showEMA) {
        const ema21Data = calculateEmaData(formattedCandles, 21);
        emaSlowSeriesRef.current.setData(ema21Data);
        emaSlowSeriesRef.current.applyOptions({ visible: true });
      } else {
        emaSlowSeriesRef.current.applyOptions({ visible: false });
      }
    }

    // Compute Bollinger Bands (20, 2)
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

    // Compute RSI Series (14)
    if (rsiSeriesRef.current && rsiChartRef.current) {
      if (showRSI) {
        const rsiData = calculateRsiData(formattedCandles, 14);
        rsiSeriesRef.current.setData(rsiData);
      }
    }

    // Update Markers
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
      } catch (err) {
        // ignore marker errors silently
      }
    }
  }, [candles, markers, showEMA, showBB, showRSI]);

  // Indicator Calculations
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

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = candleList[i].close - candleList[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
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
      const rsi = +(100 - (100 / (1 + rs))).toFixed(2);
      result.push({ time: candleList[i].time, value: rsi });
    }

    return result;
  }

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  return (
    <div className="bg-[#121721] rounded-xl border border-[#1f293d] overflow-hidden flex flex-col shadow-lg">
      {/* Chart Toolbar */}
      <div className="px-4 py-2 border-b border-[#1f293d] flex flex-wrap items-center justify-between gap-3 bg-[#151b27]">
        {/* Left: Timeframe pills */}
        <div className="flex items-center gap-1">
          {['1m', '5m', '15m', '1h'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f293d]'
              }`}
            >
              {tf}
            </button>
          ))}
          <div className="h-4 w-px bg-[#1f293d] mx-1" />
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 pl-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            {activeSymbol} Live Chart
          </span>
        </div>

        {/* Right: Technical Indicator Toggles */}
        <div className="flex items-center gap-2">
          {/* EMA Toggle */}
          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-all ${
              showEMA
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                : 'bg-[#1a2232] border-[#1f293d] text-slate-500 hover:text-slate-400'
            }`}
            title="Toggle EMA 9 & EMA 21"
          >
            <Layers className="h-3.5 w-3.5" />
            EMA (9/21)
          </button>

          {/* Bollinger Bands Toggle */}
          <button
            onClick={() => setShowBB(!showBB)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-all ${
              showBB
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
                : 'bg-[#1a2232] border-[#1f293d] text-slate-500 hover:text-slate-400'
            }`}
            title="Toggle Bollinger Bands (20, 2)"
          >
            BB (20, 2)
          </button>

          {/* RSI Toggle */}
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-all ${
              showRSI
                ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                : 'bg-[#1a2232] border-[#1f293d] text-slate-500 hover:text-slate-400'
            }`}
            title="Toggle RSI Subchart"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            RSI 14
          </button>

          {/* Fit view */}
          <button
            onClick={handleResetZoom}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1f293d] transition-colors"
            title="Reset Zoom / Fit Chart"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Candlestick Chart Container */}
      <div className="relative w-full">
        <div ref={containerRef} className="w-full" style={{ height: 380 }} />
        {/* Visual indicators legend */}
        {showEMA && (
          <div className="absolute top-2 left-3 z-10 flex items-center gap-3 text-[11px] font-mono bg-[#121721]/80 backdrop-blur px-2 py-0.5 rounded border border-[#1f293d]/50 pointer-events-none">
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

      {/* RSI Subgraph Container */}
      {showRSI && (
        <div className="border-t border-[#1f293d] relative bg-[#0f141f]">
          <div className="absolute top-1 left-3 z-10 text-[10px] font-mono text-purple-400 font-semibold pointer-events-none">
            RSI (14) — Overbought [70] / Oversold [30]
          </div>
          <div ref={rsiContainerRef} className="w-full" style={{ height: 110 }} />
        </div>
      )}
    </div>
  );
}
