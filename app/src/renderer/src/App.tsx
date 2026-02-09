import React, { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Navigation from './components/Navigation';
import ScanButton from './components/ScanButton';
import ProcessList from './components/ProcessList';
import LiveScan from './components/LiveScan';
import ScanHistory from './components/ScanHistory';
import About from './components/About';
import Settings from './components/Settings';
import { ProcessInfo, TrafficUpdate } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'scan' | 'live' | 'history' | 'about' | 'settings'>('scan');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [scanHistory, setScanHistory] = useState<Array<{timestamp: number, processes: ProcessInfo[]}>>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [totalBandwidth, setTotalBandwidth] = useState({ sent: 0, received: 0 });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    // Listen for traffic updates
    window.electron.onTrafficUpdate((data: TrafficUpdate) => {
      // Update process list with new traffic data
      setProcesses((prev) => {
        const updated = [...prev];
        const processIndex = updated.findIndex((p) => p.pid === data.processId);
        if (processIndex !== -1) {
          updated[processIndex] = {
            ...updated[processIndex],
            bytesSent: updated[processIndex].bytesSent + data.bytesOut,
            bytesReceived: updated[processIndex].bytesReceived + data.bytesIn,
          };
        }
        return updated;
      });

      // Update total bandwidth
      setTotalBandwidth((prev) => ({
        sent: prev.sent + data.bytesOut,
        received: prev.received + data.bytesIn,
      }));
    });

    // Listen for new processes
    window.electron.onProcessDetected((data: ProcessInfo) => {
      setProcesses((prev) => {
        // Check if process already exists
        const exists = prev.find((p) => p.pid === data.pid);
        if (exists) {
          return prev.map((p) => (p.pid === data.pid ? data : p));
        }
        return [...prev, data];
      });
    });

    return () => {
      window.electron.removeTrafficUpdateListener();
      window.electron.removeProcessDetectedListener();
    };
  }, []);

  const handleStartScan = async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const result = await window.electron.startScan();
      if (result.success) {
        setIsScanning(true);
        // Fetch initial process list
        setTimeout(async () => {
          const processResult = await window.electron.getProcesses();
          if (processResult.success && processResult.data) {
            setProcesses(processResult.data);
            // Save to history
            setScanHistory(prev => [{timestamp: Date.now(), processes: processResult.data!}, ...prev].slice(0, 20));
          }
        }, 2000);
      } else {
        setError(result.error || 'Failed to start scan');
      }
    } catch (err) {
      setError('Failed to connect to capture service');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopScan = async () => {
    setIsLoading(true);
    setIsScanning(false); // Reset immediately
    try {
      await window.electron.stopScan();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleRefreshScan = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(undefined);

    try {
      // Get fresh process list without restarting capture
      const processResult = await window.electron.getProcesses();
      if (processResult.success && processResult.data) {
        setProcesses(processResult.data);
        // Save to history
        setScanHistory(prev => [{timestamp: Date.now(), processes: processResult.data!}, ...prev].slice(0, 20));
      } else {
        setError(processResult.error || 'Failed to refresh scan');
      }
    } catch (err) {
      setError('Failed to refresh scan data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleProcessClick = (process: ProcessInfo) => {
    setSelectedProcessId(selectedProcessId === process.pid ? undefined : process.pid);
  };

  const handleViewHistoryScan = (historicProcesses: ProcessInfo[]) => {
    setProcesses(historicProcesses);
    setCurrentView('scan');
    setIsScanning(false);
  };

  const handleClearHistory = () => {
    setScanHistory([]);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const renderContent = () => {
    switch (currentView) {
      case 'live':
        return <LiveScan onProcessClick={handleProcessClick} selectedProcessId={selectedProcessId} />;
      
      case 'history':
        return <ScanHistory history={scanHistory} onViewScan={handleViewHistoryScan} onClearHistory={handleClearHistory} />;
      
      case 'about':
        return <About />;
      
      case 'settings':
        return <Settings theme={theme} onThemeChange={setTheme} scanHistory={scanHistory} />;
      
      case 'scan':
      default:
        return (
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm animate-fade-in">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {isScanning && (
              <div className="mb-6 glass rounded-lg p-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-xs text-slate-500">Active Processes</span>
                      <p className="text-2xl font-bold text-neon-cyan">{processes.length}</p>
                    </div>
                    <div className="w-px h-12 bg-slate-700"></div>
                    <div>
                      <span className="text-xs text-slate-500">Total Sent</span>
                      <p className="text-xl font-semibold text-green-400">{formatBytes(totalBandwidth.sent)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Total Received</span>
                      <p className="text-xl font-semibold text-blue-400">{formatBytes(totalBandwidth.received)}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRefreshScan}
                    disabled={isLoading}
                    className="glass glass-hover px-4 py-2 rounded-lg flex items-center gap-2 text-neon-cyan hover:border-neon-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh scan data"
                  >
                    <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm font-semibold">Refresh</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              {!isScanning && processes.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <ScanButton
                    isScanning={isScanning}
                    isLoading={isLoading}
                    onScan={handleStartScan}
                    onStop={handleStopScan}
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col overflow-hidden">
                  {!isScanning && processes.length > 0 && (
                    <div className="mb-4 glass rounded-lg p-4 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div>
                            <span className="text-xs text-slate-500">Captured Processes</span>
                            <p className="text-2xl font-bold text-neon-cyan">{processes.length}</p>
                          </div>
                          <div className="w-px h-12 bg-slate-700"></div>
                          <div>
                            <span className="text-xs text-slate-500">Status</span>
                            <p className="text-lg font-semibold text-yellow-400">Scan Stopped</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleRefreshScan}
                            disabled={isLoading}
                            className="glass glass-hover px-4 py-2 rounded-lg flex items-center gap-2 text-neon-cyan hover:border-neon-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh scan data"
                          >
                            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-sm font-semibold">Refresh</span>
                          </button>
                          <button
                            onClick={handleStartScan}
                            disabled={isLoading}
                            className="glass glass-hover px-4 py-2 rounded-lg flex items-center gap-2 text-green-400 hover:border-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Start new scan"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-semibold">Start New Scan</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1 flex gap-4 overflow-hidden">
                    <div className="flex-1 overflow-hidden">
                      <ProcessList
                        processes={processes}
                        onProcessClick={handleProcessClick}
                        selectedProcessId={selectedProcessId}
                      />
                    </div>

                    {isScanning && (
                      <div className="w-64 flex flex-col gap-4">
                        <button
                          onClick={handleStopScan}
                          disabled={isLoading}
                          className="glass glass-hover px-6 py-3 rounded-lg border-red-500 hover:border-red-400 text-red-500 font-semibold transition-all disabled:opacity-50"
                        >
                          ⏹️ STOP SCAN
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      <TitleBar />
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      <div className="flex-1 grid-bg overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;