// src/components/BotLogStream.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2, ArrowDownCircle } from 'lucide-react';

export function BotLogStream({ logs = [], onClearLogs }) {
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef(null);

  const filteredLogs = logs.filter(log => {
    if (filterLevel === 'ALL') return true;
    if (filterLevel === 'SIGNAL') return log.level === 'SIGNAL';
    if (filterLevel === 'ORDER') return log.level === 'ORDER' || log.level === 'SUCCESS';
    if (filterLevel === 'ALERT') return log.level === 'ALERT' || log.level === 'RISK' || log.level === 'ERROR';
    return true;
  });

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const getBadgeStyle = (level) => {
    switch (level) {
      case 'SIGNAL':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'ORDER':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'SUCCESS':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'ALERT':
      case 'RISK':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'ERROR':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="bg-[#121721] rounded-xl border border-[#1f293d] p-3 flex flex-col shadow-lg text-xs h-[320px]">
      <div className="flex items-center justify-between border-b border-[#1f293d] pb-2 mb-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="font-bold text-slate-200">Log Aktivitas & Sinyal Real-Time</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center bg-[#161c28] p-0.5 rounded border border-[#1f293d] text-[10px]">
            {['ALL', 'SIGNAL', 'ORDER', 'ALERT'].map(level => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                  filterLevel === level
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded text-xs transition-colors ${
              autoScroll ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Auto-Scroll"
          >
            <ArrowDownCircle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Logs stream body */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 text-center py-8">
            Belum ada log aktivitas yang cocok dengan filter.
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className="flex items-start gap-2 p-1.5 rounded hover:bg-[#161c28] transition-colors leading-relaxed border-l-2 border-transparent hover:border-blue-500"
            >
              <span className="text-slate-500 text-[10px] whitespace-nowrap">{log.time}</span>
              <span className={`px-1 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${getBadgeStyle(log.level)}`}>
                {log.level}
              </span>
              <span className="text-slate-300 flex-1 break-words">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
