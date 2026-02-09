import React from 'react';

interface ScanHistoryItem {
  timestamp: number;
  processes: any[];
}

interface SettingsProps {
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  scanHistory: ScanHistoryItem[];
}

const Settings: React.FC<SettingsProps> = ({ theme, onThemeChange, scanHistory }) => {
  const exportToCSV = () => {
    if (scanHistory.length === 0) {
      alert('No scan history to export');
      return;
    }

    // Prepare CSV data
    const csvRows: string[] = [];
    
    // CSV Headers
    csvRows.push('Scan Timestamp,Process Name,PID,Executable Path,Risk Level,Digital Signature,Publisher,Connections,Protocols,Remote Address,Remote Port,Hostname,Service');
    
    // Process each scan in history
    scanHistory.forEach((scan) => {
      const scanDate = new Date(scan.timestamp).toISOString();
      
      scan.processes.forEach((process) => {
        if (process.connectionDetails && process.connectionDetails.length > 0) {
          // Export each connection as a separate row
          process.connectionDetails.forEach((conn: any) => {
            const row = [
              scanDate,
              `"${process.name || ''}"`,
              process.pid || '',
              `"${(process.executablePath || '').replace(/"/g, '""')}"`,
              process.riskLevel || 'Unknown',
              process.isSigned ? 'Signed' : 'Not Signed',
              `"${(process.publisher || 'N/A').replace(/"/g, '""')}"`,
              process.connections || 0,
              `"${(process.protocols || []).join(', ')}"`,
              conn.remoteAddress || '',
              conn.remotePort || '',
              `"${(conn.hostName || '').replace(/"/g, '""')}"`,
              conn.serviceName || ''
            ];
            csvRows.push(row.join(','));
          });
        } else {
          // Process with no connection details
          const row = [
            scanDate,
            `"${process.name || ''}"`,
            process.pid || '',
            `"${(process.executablePath || '').replace(/"/g, '""')}"`,
            process.riskLevel || 'Unknown',
            process.isSigned ? 'Signed' : 'Not Signed',
            `"${(process.publisher || 'N/A').replace(/"/g, '""')}"`,
            process.connections || 0,
            `"${(process.protocols || []).join(', ')}"`,
            '', '', '', ''
          ];
          csvRows.push(row.join(','));
        }
      });
    });

    // Create CSV content
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `network-scan-history-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="glass rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
          <p className="text-sm text-slate-400">Customize your network monitoring experience</p>
        </div>

        {/* Theme Settings */}
        <div className="glass rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🎨</span>
            <span>Appearance</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-3">Theme</label>
              <div className="flex gap-4">
                <button
                  onClick={() => onThemeChange('dark')}
                  className={`
                    flex-1 p-4 rounded-lg border-2 transition-all
                    ${theme === 'dark'
                      ? 'border-neon-cyan bg-neon-cyan/10'
                      : 'border-slate-700 hover:border-slate-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
                      <span className="text-2xl">🌙</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white">Dark Mode</div>
                      <div className="text-xs text-slate-400">Easy on the eyes</div>
                    </div>
                    {theme === 'dark' && (
                      <div className="ml-auto">
                        <svg className="w-6 h-6 text-neon-cyan" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => onThemeChange('light')}
                  className={`
                    flex-1 p-4 rounded-lg border-2 transition-all
                    ${theme === 'light'
                      ? 'border-neon-cyan bg-neon-cyan/10'
                      : 'border-slate-700 hover:border-slate-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-300 flex items-center justify-center">
                      <span className="text-2xl">☀️</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white">Light Mode</div>
                      <div className="text-xs text-slate-400">Bright and clear</div>
                    </div>
                    {theme === 'light' && (
                      <div className="ml-auto">
                        <svg className="w-6 h-6 text-neon-cyan" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Export Settings */}
        <div className="glass rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Data Export</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-4">
                Export your scan history to a CSV file for analysis in Excel or other tools.
              </p>
              
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div>
                  <div className="font-medium text-white">Scan History</div>
                  <div className="text-sm text-slate-400">
                    {scanHistory.length} scan{scanHistory.length !== 1 ? 's' : ''} available
                  </div>
                </div>
                <button
                  onClick={exportToCSV}
                  disabled={scanHistory.length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-neon-cyan to-blue-500 text-white rounded-lg font-semibold hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export to CSV</span>
                </button>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-400 mb-1">CSV Export Information</div>
                  <div className="text-xs text-slate-400">
                    The exported file includes: scan timestamps, process details, security information, 
                    connection data, and DNS resolutions. Each connection is listed as a separate row for detailed analysis.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="glass rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>ℹ️</span>
            <span>Application Info</span>
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-700/50">
              <span className="text-slate-400">Version</span>
              <span className="text-white font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-700/50">
              <span className="text-slate-400">Theme</span>
              <span className="text-white capitalize">{theme}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Scan History</span>
              <span className="text-white">{scanHistory.length} records</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
