import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import { ServiceConnector } from './serviceConnector';

let mainWindow: BrowserWindow | null = null;
let serviceConnector: ServiceConnector | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0a0e1a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  serviceConnector = new ServiceConnector();

  // Forward traffic updates to renderer
  serviceConnector.on('traffic-update', (data: any) => {
    mainWindow?.webContents.send('traffic-update', data);
  });

  serviceConnector.on('process-detected', (data: any) => {
    mainWindow?.webContents.send('process-detected', data);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    serviceConnector?.disconnect();
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('start-scan', async () => {
  try {
    if (!serviceConnector) {
      throw new Error('Service connector not initialized');
    }
    await serviceConnector.connect();
    await serviceConnector.startScan();
    return { success: true };
  } catch (error) {
    console.error('Failed to start scan:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('stop-scan', async () => {
  try {
    if (!serviceConnector) {
      throw new Error('Service connector not initialized');
    }
    await serviceConnector.stopScan();
    return { success: true };
  } catch (error) {
    console.error('Failed to stop scan:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-processes', async () => {
  try {
    if (!serviceConnector) {
      throw new Error('Service connector not initialized');
    }
    const processes = await serviceConnector.getProcesses();
    return { success: true, data: processes };
  } catch (error) {
    console.error('Failed to get processes:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window-close', () => {
  mainWindow?.close();
});
