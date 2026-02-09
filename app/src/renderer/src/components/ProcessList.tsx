import React from 'react';
import { ProcessInfo } from '../types';

interface ProcessListProps {
  processes: ProcessInfo[];
  onProcessClick: (process: ProcessInfo) => void;
  selectedProcessId?: number;
}

const ProcessList: React.FC<ProcessListProps> = ({ processes, onProcessClick, selectedProcessId }) => {
  if (processes.length === 0) {
    return null;
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getProtocolColor = (protocol: string): string => {
    const colors: Record<string, string> = {
      'HTTP': 'bg-blue-500/20 text-blue-400 border-blue-400/30',
      'HTTPS': 'bg-green-500/20 text-green-400 border-green-400/30',
      'TCP': 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30',
      'UDP': 'bg-purple-500/20 text-purple-400 border-purple-400/30',
      'DNS': 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30',
    };
    return colors[protocol.toUpperCase()] || 'bg-slate-500/20 text-slate-400 border-slate-400/30';
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neon-cyan">
          Active Processes
          <span className="ml-2 text-sm text-slate-400">({processes.length})</span>
        </h2>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
        {processes.map((process) => (
          <div
            key={process.pid}
            onClick={() => onProcessClick(process)}
            className={`
              glass glass-hover p-4 rounded-lg cursor-pointer
              transition-all duration-300 animate-slide-up
              ${selectedProcessId === process.pid ? 'border-neon-cyan neon-glow' : ''}
            `}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-slate-800/50 flex items-center justify-center overflow-hidden">
                {process.icon ? (
                  <img 
                    src={`data:image/png;base64,${process.icon}`} 
                    alt={process.name}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                )}
              </div>

              {/* Process Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white truncate">{process.name}</h3>
                  <span className="text-xs text-slate-500">PID: {process.pid}</span>
                </div>

                {/* Protocols */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {(process.protocols || []).map((protocol, idx) => (
                    <span
                      key={`${process.pid}-${protocol}-${idx}`}
                      className={`text-xs px-2 py-0.5 rounded border ${getProtocolColor(protocol)}`}
                    >
                      {protocol}
                    </span>
                  ))}
                  
                  {/* Risk Badge */}
                  {process.riskLevel && process.riskLevel !== 'Low' && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded border font-semibold ${
                        process.riskLevel === 'High'
                          ? 'bg-red-500/20 text-red-400 border-red-400/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
                      }`}
                    >
                      ⚠️ {process.riskLevel} Risk
                    </span>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {formatBytes(process.bytesSent)} ↑
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                    {formatBytes(process.bytesReceived)} ↓
                  </span>
                  <span>{process.connections} connections</span>
                  {process.riskLevel && (
                    <span className="text-slate-500">•</span>
                  )}
                  {process.riskLevel && (
                    <span
                      className={`font-medium ${
                        process.riskLevel === 'Low'
                          ? 'text-green-400'
                          : process.riskLevel === 'Medium'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {process.riskLevel} Risk
                    </span>
                  )}
                </div>
              </div>

              {/* Chevron */}
              <div className={`transition-transform duration-300 ${selectedProcessId === process.pid ? 'rotate-90' : ''}`}>
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedProcessId === process.pid && (
              <div className="mt-4 pt-4 border-t border-slate-700/50 animate-slide-up">
                <div className="space-y-4">
                  {/* Security Information */}
                  {(process.riskLevel || process.isSigned !== undefined) && (
                    <div className="glass rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-neon-cyan">Security Analysis</span>
                        <span
                          className={`text-xs px-2 py-1 rounded border font-semibold ${
                            process.riskLevel === 'Low'
                              ? 'bg-green-500/20 text-green-400 border-green-400/30'
                              : process.riskLevel === 'Medium'
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
                              : 'bg-red-500/20 text-red-400 border-red-400/30'
                          }`}
                        >
                          {process.riskLevel} Risk
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400">Digital Signature:</span>
                          <span className={process.isSigned ? 'text-green-400' : 'text-yellow-400'}>
                            {process.isSigned ? '✓ Signed' : '✗ Not Signed'}
                          </span>
                        </div>
                        
                        {process.publisher && (
                          <div className="flex items-start gap-2 text-xs">
                            <span className="text-slate-400">Publisher:</span>
                            <span className="text-slate-300 flex-1">{process.publisher}</span>
                          </div>
                        )}
                        
                        {process.securityWarnings && process.securityWarnings.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-700/50">
                            <span className="text-xs text-slate-400 block mb-2">Security Warnings:</span>
                            <ul className="space-y-1">
                              {process.securityWarnings.map((warning, idx) => (
                                <li key={idx} className="text-xs text-yellow-400 flex items-start gap-2">
                                  <span className="mt-0.5">⚠️</span>
                                  <span className="flex-1">{warning}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-xs text-slate-500">Executable Path:</span>
                    <p className="text-xs text-slate-300 font-mono mt-1 break-all">{process.executablePath}</p>
                  </div>

                  {process.connectionDetails && process.connectionDetails.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-neon-cyan">Connection Details</span>
                        <span className="text-xs text-slate-500">{process.connectionDetails.length} connections</span>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {process.connectionDetails.map((conn, idx) => (
                          <div key={`${process.pid}-conn-${idx}`} className="glass p-3 rounded-lg">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              {/* Protocol & Service */}
                              <div className="col-span-2 flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded border ${getProtocolColor(conn.protocol)}`}>
                                  {conn.protocol}
                                </span>
                                {conn.serviceName && (
                                  <span className="text-slate-400 font-mono text-xs">
                                    {conn.serviceName}
                                  </span>
                                )}
                                {conn.state && conn.state !== 'LISTENING' && (
                                  <span className="text-slate-400 font-mono">{conn.state}</span>
                                )}
                              </div>
                              
                              {/* Source */}
                              <div>
                                <div className="text-slate-500 mb-1">Source</div>
                                <div className="font-mono text-green-400">
                                  {conn.localAddress}:{conn.localPort}
                                </div>
                              </div>
                              
                              {/* Destination */}
                              <div>
                                <div className="text-slate-500 mb-1">Destination</div>
                                <div className="space-y-1">
                                  {conn.hostName && (
                                    <div className="font-mono text-neon-cyan text-xs">
                                      {conn.hostName}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 group">
                                    <div className="font-mono text-blue-400">
                                      {conn.remoteAddress}
                                      {conn.remotePort > 0 && `:${conn.remotePort}`}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(conn.remoteAddress);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-700/50 rounded"
                                      title="Copy IP address"
                                    >
                                      <svg className="w-3 h-3 text-slate-400 hover:text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!process.connectionDetails || process.connectionDetails.length === 0) && process.destinations && process.destinations.length > 0 && (
                    <div>
                      <span className="text-xs text-slate-500">Recent Destinations:</span>
                      <div className="mt-2 space-y-1">
                        {process.destinations.slice(0, 5).map((dest, idx) => (
                          <div key={`${process.pid}-dest-${idx}`} className="text-xs font-mono text-slate-300 bg-slate-800/30 px-2 py-1 rounded">
                            {dest}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessList;
