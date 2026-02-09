import { EventEmitter } from 'events';
import * as net from 'net';

const TCP_HOST = 'localhost';
const TCP_PORT = 9876;
const RECONNECT_DELAY = 3000;

export interface ProcessInfo {
  pid: number;
  name: string;
  executablePath: string;
  icon?: string; // base64 encoded
  connections: number;
  bytesSent: number;
  bytesReceived: number;
  protocols: string[];
}

export interface TrafficUpdate {
  processId: number;
  protocol: string;
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  bytesIn: number;
  bytesOut: number;
  timestamp: number;
}

export class ServiceConnector extends EventEmitter {
  private client: net.Socket | null = null;
  private connected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private buffer: string = '';

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    return new Promise((resolve, reject) => {
      console.log(`Attempting to connect to: ${TCP_HOST}:${TCP_PORT}`);
      
      this.client = net.connect(TCP_PORT, TCP_HOST, () => {
        console.log('Connected to capture service');
        this.connected = true;
        this.buffer = '';
        resolve();
      });

      this.client.on('data', (data) => {
        this.handleData(data);
      });

      this.client.on('error', (error: any) => {
        console.error('Service connection error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        this.connected = false;
        if (!this.reconnectTimer) {
          reject(error);
        }
      });

      this.client.on('close', () => {
        console.log('Connection to service closed');
        this.connected = false;
        this.scheduleReconnect();
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.connected) {
          this.client?.destroy();
          reject(new Error('Connection timeout - Make sure the capture service is running as Administrator'));
        }
      }, 10000);
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
    this.connected = false;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log('Attempting to reconnect to service...');
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, RECONNECT_DELAY);
  }

  private handleData(data: Buffer): void {
    this.buffer += data.toString();
    
    // Process complete JSON messages (separated by newlines)
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep incomplete message in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          console.log('Parsed message:', JSON.stringify(message).substring(0, 200));
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
          console.error('Line length:', line.length);
          console.error('Line preview:', line.substring(0, 100));
        }
      }
    }
  }

  private handleMessage(message: any): void {
    console.log('handleMessage - message.type:', message.type, 'message.Type:', message.Type);
    const messageType = message.type || message.Type;
    
    switch (messageType) {
      case 'traffic-update':
        this.emit('traffic-update', message.data || message.Data);
        break;
      case 'process-detected':
        this.emit('process-detected', message.data || message.Data);
        break;
      case 'processes-response':
        this.emit('processes-response', message.data || message.Data);
        break;
      case 'scan-status':
        this.emit('scan-status', message.data || message.Data);
        break;
      default:
        console.warn('Unknown message type:', messageType);
    }
  }

  async startScan(): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to service');
    }
    return this.sendCommand({ command: 'start' });
  }

  async stopScan(): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to service');
    }
    return this.sendCommand({ command: 'stop' });
  }

  async getProcesses(): Promise<ProcessInfo[]> {
    if (!this.connected) {
      throw new Error('Not connected to service');
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);

      const handler = (data: any) => {
        clearTimeout(timeout);
        this.removeListener('processes-response', handler);
        resolve(data.processes || []);
      };

      this.once('processes-response', handler);
      this.sendCommand({ command: 'get-processes' });
    });
  }

  private sendCommand(command: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.connected) {
        reject(new Error('Not connected'));
        return;
      }

      const message = JSON.stringify(command) + '\n';
      this.client.write(message, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}
