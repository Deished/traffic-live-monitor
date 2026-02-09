declare global {
  interface Window {
    electron: {
      startScan: () => Promise<{ success: boolean; error?: string }>;
      stopScan: () => Promise<{ success: boolean; error?: string }>;
      getProcesses: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      windowMinimize: () => void;
      windowMaximize: () => void;
      windowClose: () => void;
      onTrafficUpdate: (callback: (data: any) => void) => void;
      onProcessDetected: (callback: (data: any) => void) => void;
      removeTrafficUpdateListener: () => void;
      removeProcessDetectedListener: () => void;
    };
  }
}

export {};
