import React from 'react';
import { ProcessInfo } from '../types';

interface ScanHistoryProps {
  history: Array<{ timestamp: number; processes: ProcessInfo[] }>;
  onViewScan: (processes: ProcessInfo[]) => void;
  onClearHistory: () => void;
}

const ScanHistory: React.FC<ScanHistoryProps> = ({ history, onViewScan, onClearHistory }) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <div className="glass rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Scan History</h2>
            <p className="text-sm text-slate-400">View previous network scans</p>
          </div>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="px-4 py-2 bg-red-500/20 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
            >
              Clear History
            </button>
          )}
        </div>
      </div>

      {history.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {history.map((scan, index) => (
            <div
              key={scan.timestamp}
              className="glass p-4 rounded-lg hover:border-neon-cyan transition-all cursor-pointer"
              onClick={() => onViewScan(scan.processes)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-neon-cyan">
                      Scan #{history.length - index}
                    </span>
                    <span className="text-xs text-slate-500">{formatDate(scan.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>📦 {scan.processes.length} processes detected</span>
                    <span>
                      📊 {scan.processes.reduce((sum, p) => sum + p.connections, 0)} total connections
                    </span>
                  </div>
                </div>
                <div className="text-neon-cyan text-xl">→</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl text-slate-400 mb-2">No scan history</h3>
            <p className="text-sm text-slate-500">
              Perform a quick scan to see results here
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanHistory;
