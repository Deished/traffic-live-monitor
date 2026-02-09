import React, { useState, useEffect } from 'react';
import { ProcessInfo } from '../types';
import ProcessList from './ProcessList';

interface LiveScanProps {
  onProcessClick: (process: ProcessInfo) => void;
  selectedProcessId?: number;
}

const LiveScan: React.FC<LiveScanProps> = ({ onProcessClick, selectedProcessId }) => {
  const [isActive, setIsActive] = useState(false);
  const [newProcesses, setNewProcesses] = useState<ProcessInfo[]>([]);
  const [previousPids, setPreviousPids] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const scanForNew = async () => {
    setIsLoading(true);
    try {
      const result = await window.electron.getProcesses();
      if (result.success && result.data) {
        const currentPids = new Set(result.data.map((p: ProcessInfo) => p.pid));
        const newProcs = result.data.filter((p: ProcessInfo) => !previousPids.has(p.pid));
        
        if (newProcs.length > 0) {
          setNewProcesses(prev => {
            // Remove duplicates by PID
            const existingPids = new Set(prev.map(p => p.pid));
            const uniqueNewProcs = newProcs.filter(p => !existingPids.has(p.pid));
            return [...uniqueNewProcs, ...prev].slice(0, 50); // Keep last 50
          });
        }
        
        setPreviousPids(currentPids);
      }
    } catch (error) {
      console.error('Live scan error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isActive) return;

    // Initial scan
    scanForNew();

    // Then scan every 5 seconds
    const scanInterval = setInterval(() => {
      scanForNew();
    }, 5000);

    return () => clearInterval(scanInterval);
  }, [isActive, previousPids]);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await window.electron.startScan();
      // Initial scan to set baseline
      const result = await window.electron.getProcesses();
      if (result.success && result.data) {
        setPreviousPids(new Set(result.data.map((p: ProcessInfo) => p.pid)));
      }
      setIsActive(true);
      setNewProcesses([]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsActive(false);
    try {
      await window.electron.stopScan();
    } catch (error) {
      console.error(error);
    }
    setPreviousPids(new Set());
  };

  const clearHistory = () => {
    setNewProcesses([]);
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="glass rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Live Network Monitor</h2>
            <p className="text-sm text-slate-400">Detects new applications with network activity every 5 seconds</p>
          </div>
          
          {isActive && (
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-neon-cyan animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm font-semibold text-neon-cyan">Scanning...</div>
                <div className="text-xs text-slate-500">Active monitoring</div>
              </div>
            </div>

          )}
        </div>

        <div className="flex items-center gap-3">
          {!isActive ? (
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-blue-500 text-white rounded-lg font-semibold hover:shadow-neon transition-all disabled:opacity-50"
            >
              {isLoading ? 'Starting...' : '▶️ Start Live Monitor'}
            </button>
          ) : (
            <>
              <button
                onClick={handleStop}
                className="px-6 py-3 bg-red-500/20 border border-red-500 text-red-400 rounded-lg font-semibold hover:bg-red-500/30 transition-all"
              >
                ⏹️ Stop Monitor
              </button>
              <button
                onClick={clearHistory}
                className="px-4 py-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-all"
              >
                🗑️ Clear History
              </button>
            </>
          )}
        </div>
      </div>

      {/* New Processes */}
      {newProcesses.length > 0 ? (
        <div className="flex-1 overflow-hidden">
          <ProcessList
            processes={newProcesses}
            onProcessClick={onProcessClick}
            selectedProcessId={selectedProcessId}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">👀</div>
            <h3 className="text-xl text-slate-400 mb-2">
              {isActive ? 'Monitoring for new connections...' : 'Ready to monitor'}
            </h3>
            <p className="text-sm text-slate-500">
              {isActive 
                ? 'New applications will appear here when detected'
                : 'Click "Start Live Monitor" to begin'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScan;
