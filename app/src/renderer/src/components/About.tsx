import React from 'react';

const About: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full glass rounded-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-cyan to-blue-500 flex items-center justify-center">
            <span className="text-4xl">🌐</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Network Traffic Monitor</h1>
          <p className="text-neon-cyan text-sm">v1.0.0</p>
        </div>

        <div className="space-y-6 text-slate-300">
          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span>ℹ️</span> About
            </h3>
            <p className="text-sm leading-relaxed">
              A powerful network traffic monitoring tool designed to inspect all outgoing traffic (TCP, UDP, HTTP, etc.) 
              from your PC to the external world with a futuristic and intuitive user interface.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span>✨</span> Features
            </h3>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-neon-cyan">•</span>
                <span>Real-time network traffic monitoring with process detection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-cyan">•</span>
                <span>Quick scan for immediate network activity analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-cyan">•</span>
                <span>Live monitor to detect new applications every 10 seconds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-cyan">•</span>
                <span>Scan history to review previous network captures</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-cyan">•</span>
                <span>Detailed connection information with protocol detection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neon-cyan">•</span>
                <span>Application icon extraction and bandwidth statistics</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span>🛠️</span> Technology Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Electron', 'React', 'TypeScript', '.NET 8.0', 'SharpPcap', 'TailwindCSS'].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-slate-800/50 border border-slate-700 rounded-full text-xs"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs text-center text-slate-500">
              Made with ❤️ • Requires Administrator privileges for packet capture
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
