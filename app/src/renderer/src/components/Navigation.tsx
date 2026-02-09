import React from 'react';

interface NavigationProps {
  currentView: 'scan' | 'live' | 'history' | 'about' | 'settings';
  onViewChange: (view: 'scan' | 'live' | 'history' | 'about' | 'settings') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'scan' as const, label: 'Quick Scan', icon: '🔍' },
    { id: 'live' as const, label: 'Live Monitor', icon: '📡' },
    { id: 'history' as const, label: 'History', icon: '📜' },
    { id: 'about' as const, label: 'About', icon: 'ℹ️' },
    { id: 'settings' as const, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="glass border-b border-slate-700/50 px-6 py-3">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-blue-500 flex items-center justify-center">
            <span className="text-lg">🌐</span>
          </div>
          <h1 className="text-lg font-bold text-white">Traffic Monitor</h1>
        </div>
        
        <div className="flex-1 flex items-center gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2
                ${currentView === item.id
                  ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }
              `}
            >
              <span>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
