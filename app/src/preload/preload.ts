import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // Scan controls
  startScan: () => ipcRenderer.invoke('start-scan'),
  stopScan: () => ipcRenderer.invoke('stop-scan'),
  getProcesses: () => ipcRenderer.invoke('get-processes'),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),

  // Event listeners
  onTrafficUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on('traffic-update', (_event, data) => callback(data));
  },
  onProcessDetected: (callback: (data: any) => void) => {
    ipcRenderer.on('process-detected', (_event, data) => callback(data));
  },

  // Remove listeners
  removeTrafficUpdateListener: () => {
    ipcRenderer.removeAllListeners('traffic-update');
  },
  removeProcessDetectedListener: () => {
    ipcRenderer.removeAllListeners('process-detected');
  },
});
