import React from 'react';

interface TitleBarProps {}

const TitleBar: React.FC<TitleBarProps> = () => {
  const handleMinimize = () => {
    window.electron.windowMinimize();
  };

  const handleMaximize = () => {
    window.electron.windowMaximize();
  };

  const handleClose = () => {
    window.electron.windowClose();
  };

  return (
    <div className="h-8 bg-slate-900/80 backdrop-blur-md border-b border-neon-cyan/10 flex items-center justify-between px-4 select-none drag">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
        <span className="text-xs font-medium text-neon-cyan">NETWORK TRAFFIC MONITOR</span>
      </div>
      
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-800/50 transition-colors rounded"
          title="Minimize"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 10h12v2H4z" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-800/50 transition-colors rounded"
          title="Maximize"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center hover:bg-red-500/20 transition-colors rounded"
          title="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
