export interface ConnectionInfo {
  protocol: string;
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  state: string;
  hostName?: string;
  serviceName?: string;
  bytesSent: number;
  bytesReceived: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  executablePath: string;
  icon?: string;
  connections: number;
  bytesSent: number;
  bytesReceived: number;
  protocols: string[];
  destinations?: string[];
  connectionDetails?: ConnectionInfo[];
  isSigned: boolean;
  publisher?: string;
  riskLevel: string;
  securityWarnings: string[];
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

export interface ScanState {
  isScanning: boolean;
  isLoading: boolean;
  error?: string;
}
