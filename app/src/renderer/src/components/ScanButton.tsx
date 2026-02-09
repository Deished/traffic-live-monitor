import React, { useState } from 'react';

interface ScanButtonProps {
  isScanning: boolean;
  isLoading: boolean;
  onScan: () => void;
  onStop: () => void;
}

const ScanButton: React.FC<ScanButtonProps> = ({ isScanning, isLoading, onScan, onStop }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (isLoading) return;
    if (isScanning) {
      onStop();
    } else {
      onScan();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isLoading}
        className={`
          scan-button relative
          w-48 h-48 rounded-full
          glass border-2
          flex items-center justify-center
          transition-all duration-300 ease-out
          ${isScanning 
            ? 'border-red-500 hover:border-red-400' 
            : 'border-neon-cyan hover:border-neon-cyan/80'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isScanning && !isLoading ? 'animate-scan-pulse' : ''}
          ${isHovered && !isLoading ? 'scale-105 neon-glow-strong' : 'neon-glow'}
        `}
      >
        <div className="relative z-10 flex flex-col items-center">
          {isLoading ? (
            <>
              <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mb-4"></div>
              <span className="text-sm font-medium text-neon-cyan">INITIALIZING...</span>
            </>
          ) : isScanning ? (
            <>
              <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
              </svg>
              <span className="text-xl font-bold text-red-500">STOP</span>
            </>
          ) : (
            <>
              <svg className="w-16 h-16 text-neon-cyan mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xl font-bold text-neon-cyan">SCAN</span>
            </>
          )}
        </div>
      </button>

      {!isScanning && !isLoading && (
        <p className="text-slate-400 text-sm animate-fade-in">
          Click to analyze outgoing network traffic
        </p>
      )}

      {isScanning && (
        <div className="flex items-center gap-2 animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-green-500 text-sm font-medium">MONITORING ACTIVE</span>
        </div>
      )}
    </div>
  );
};

export default ScanButton;
