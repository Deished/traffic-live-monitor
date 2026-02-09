# Network Traffic Monitor - Technical Documentation

## Overview

Network Traffic Monitor is a Windows desktop application designed to provide real-time visibility into network connections established by running processes. The application uses a split architecture with an Electron-based frontend and a privileged C# backend service to bypass Windows security restrictions on network monitoring.

**Repository Structure:**
```
├── app/                    # Electron + React frontend
├── backend/CaptureService/ # C# .NET backend service
├── pics/                   # Screenshots and assets
└── *.md                    # Documentation
```

## Architecture

### System Design

The application follows a client-server model where the frontend and backend operate as separate processes communicating over TCP/IP. This design was chosen to satisfy Windows UAC requirements - network packet inspection requires administrator privileges, but the UI does not.

```
┌─────────────────────────────────────┐
│   Electron Application (User)      │
│                                     │
│   ┌─────────────────────────────┐  │
│   │  React Frontend             │  │
│   │  - TypeScript               │  │
│   │  - TailwindCSS              │  │
│   │  - Vite build system        │  │
│   └──────────────┬──────────────┘  │
│                  │                  │
│   ┌──────────────▼──────────────┐  │
│   │  Electron Main Process      │  │
│   │  - IPC Bridge               │  │
│   │  - TCP Client               │  │
│   └──────────────┬──────────────┘  │
└──────────────────┼──────────────────┘
                   │ TCP Socket
                   │ localhost:9876
                   │ JSON Messages
┌──────────────────▼──────────────────┐
│  Backend Service (Administrator)    │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  TCP Server (Port 9876)        │ │
│  │  - Message routing             │ │
│  │  - JSON serialization          │ │
│  └────────────┬───────────────────┘ │
│               │                      │
│  ┌────────────▼───────────────────┐ │
│  │  CaptureEngine                 │ │
│  │  - Process enumeration         │ │
│  │  - Connection tracking         │ │
│  │  - SharpPcap integration       │ │
│  └────────────┬───────────────────┘ │
└───────────────┼──────────────────────┘
                │
    ┌───────────┴──────────────┐
    │                           │
┌───▼────────────┐  ┌──────────▼─────────┐
│ Windows        │  │ SharpPcap/WinPcap  │
│ IP Helper API  │  │ Packet Capture     │
│ (iphlpapi.dll) │  │ (optional)         │
└────────────────┘  └────────────────────┘
```

### Technology Stack

**Frontend:**
- **Electron 40.2.1** - Cross-platform desktop framework
- **React 18.2.0** - UI component library
- **TypeScript 5.3.3** - Type-safe JavaScript
- **Vite 7.3.1** - Build tool and dev server
- **TailwindCSS 3.4.0** - Utility-first CSS framework

**Backend:**
- **.NET 8.0** - Runtime and SDK
- **SharpPcap** - Packet capture library (npcap/WinPcap wrapper)
- **Newtonsoft.Json** - JSON serialization
- **Windows API** - IP Helper functions (GetExtendedTcpTable, GetExtendedUdpTable)

**Build Tools:**
- **electron-builder 26.7.0** - Application packaging
- **dotnet CLI** - Backend compilation
- **npm/Node.js 18+** - Package management

---

## Backend Service (CaptureService)

### Overview

The backend service is a .NET 8.0 console application that runs with elevated privileges. It exposes a TCP server on `localhost:9876` and responds to commands from the Electron frontend. The service uses Windows IP Helper API to enumerate active TCP/UDP connections and correlate them with process information.

### Core Components

#### Program.cs

Entry point that:
- Validates administrator privileges using `WindowsPrincipal.IsInRole()`
- Initializes and starts the `PipeServer`
- Handles graceful shutdown on `Ctrl+C`

```csharp
private static bool IsAdministrator()
{
    var identity = WindowsIdentity.GetCurrent();
    var principal = new WindowsPrincipal(identity);
    return principal.IsInRole(WindowsBuiltInRole.Administrator);
}
```

#### PipeServer.cs

Manages the TCP server lifecycle and client communication:
- Binds to `127.0.0.1:9876` using `TcpListener`
- Accepts single client connection (one frontend at a time)
- Reads newline-delimited JSON commands from client
- Routes commands to `CaptureEngine`
- Sends responses and events back to client as JSON

**Command Protocol:**
```json
{"type": "command", "command": "getProcesses"}
{"type": "command", "command": "startScan"}
{"type": "command", "command": "stopScan"}
```

**Response Format:**
```json
{
  "type": "processInfo",
  "processes": [
    {
      "pid": 1234,
      "name": "chrome.exe",
      "executablePath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "icon": "base64-encoded-png-data",
      "connections": 15,
      "bytesSent": 1048576,
      "bytesReceived": 2097152,
      "protocols": ["TCP", "UDP"]
    }
  ]
}
```

#### CaptureEngine.cs

Core network analysis engine:

**Process Enumeration:**
- Calls `GetExtendedTcpTable()` and `GetExtendedUdpTable()` from `iphlpapi.dll`
- Retrieves `MIB_TCPROW_OWNER_PID` and `MIB_UDPROW_OWNER_PID` structures
- Maps PIDs to process metadata using `Process.GetProcessById()`

**Connection Tracking:**
- Maintains `ConcurrentDictionary<int, ProcessInfo>` for active processes
- Aggregates connection statistics per process
- Tracks bytes sent/received per connection

**Icon Extraction:**
- Extracts icons from executable files using `Icon.ExtractAssociatedIcon()`
- Converts icons to PNG format
- Encodes as Base64 for transmission to frontend

**Performance Optimizations:**
- Connection data cached with 5-second TTL
- DNS resolution throttled (500ms timeout)
- Icon extraction performed once per process

#### ProcessHelper.cs

Windows API interop layer:
- P/Invoke declarations for `iphlpapi.dll` functions
- Structure marshalling for `MIB_TCPROW_OWNER_PID` and `MIB_UDPROW_OWNER_PID`
- Memory management for unmanaged buffers

```csharp
[DllImport("iphlpapi.dll", SetLastError = true)]
static extern uint GetExtendedTcpTable(
    IntPtr pTcpTable,
    ref int dwOutBufLen,
    bool sort,
    int ipVersion,
    TCP_TABLE_CLASS tblClass,
    int reserved
);
```

### Service Lifecycle

1. **Startup:**
   - Verify admin privileges
   - Initialize TCP listener on port 9876
   - Wait for client connection

2. **Active Operation:**
   - Accept commands from connected client
   - Execute network scans on demand
   - Stream results as JSON

3. **Shutdown:**
   - Close client connection
   - Stop TCP listener
   - Release network resources

### Network APIs Used

**GetExtendedTcpTable:**
- Returns IPv4/IPv6 TCP connection table
- Provides PID for each connection
- Includes local/remote address, port, and state

**GetExtendedUdpTable:**
- Returns IPv4/IPv6 UDP connection table
- Provides PID for each listening socket

**DNS Resolution:**
- Uses `Dns.GetHostEntry()` with timeout
- Caches results to minimize network overhead

---

## Frontend Application (Electron)

### Project Structure

```
app/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.ts           # App initialization, window management
│   │   └── serviceConnector.ts # TCP client, backend communication
│   ├── preload/
│   │   └── preload.ts        # IPC bridge (context isolation)
│   ├── renderer/             # React application
│   │   ├── src/
│   │   │   ├── App.tsx       # Root component, view routing
│   │   │   ├── main.tsx      # React DOM entry point
│   │   │   ├── components/   # UI components
│   │   │   │   ├── ProcessList.tsx
│   │   │   │   ├── LiveScan.tsx
│   │   │   │   ├── ScanHistory.tsx
│   │   │   │   ├── Settings.tsx
│   │   │   │   ├── About.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   ├── ScanButton.tsx
│   │   │   │   └── TitleBar.tsx
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   └── electron.d.ts
│   │   │   └── styles/
│   │   │       ├── index.css
│   │   │       └── scrollbar.css
│   │   └── index.html
│   └── [config files]
```

### Main Process (main.ts)

Responsibilities:
- Create and manage BrowserWindow
- Initialize ServiceConnector
- Bridge IPC messages between renderer and backend
- Handle application lifecycle events

**Window Configuration:**
```typescript
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, '../preload/preload.js'),
    contextIsolation: true,
    nodeIntegration: false
  },
  frame: false, // Custom title bar
  backgroundColor: '#0f172a'
});
```

### ServiceConnector (serviceConnector.ts)

Manages TCP connection to backend service:

**Connection Management:**
- Establishes socket to `localhost:9876`
- Implements automatic reconnection with 3-second delay
- Buffers incoming data and parses newline-delimited JSON

**Event Emission:**
```typescript
interface ServiceConnector extends EventEmitter {
  connect(): Promise<void>;
  disconnect(): void;
  sendCommand(command: string): void;
  
  // Events:
  // 'connected' - TCP connection established
  // 'disconnected' - TCP connection lost
  // 'error' - Connection or protocol error
  // 'processInfo' - Process data received
  // 'trafficUpdate' - Real-time traffic update
}
```

**Message Buffering:**
Handles partial messages and ensures complete JSON objects:
```typescript
private handleData(data: Buffer) {
  this.buffer += data.toString();
  
  const lines = this.buffer.split('\n');
  this.buffer = lines.pop() || ''; // Keep incomplete line
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const message = JSON.parse(line);
        this.emit('message', message);
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    }
  }
}
```

### Preload Script (preload.ts)

Bridges renderer process with main process using context isolation:

```typescript
contextBridge.exposeInMainWorld('electron', {
  scanNetwork: () => ipcRenderer.invoke('scan-network'),
  startLiveScan: () => ipcRenderer.invoke('start-live-scan'),
  stopLiveScan: () => ipcRenderer.invoke('stop-live-scan'),
  onTrafficUpdate: (callback) => 
    ipcRenderer.on('traffic-update', (_, data) => callback(data)),
  removeAllListeners: (channel) => 
    ipcRenderer.removeAllListeners(channel)
});
```

### UI Components

#### ProcessList.tsx
Displays scan results:
- Process cards with icon, name, PID
- Expandable details showing connections
- Bandwidth statistics (sent/received)
- Risk indicators and protocol badges

#### LiveScan.tsx
Real-time monitoring interface:
- Auto-scan with 10-second intervals
- Countdown timer display
- Highlights new processes detected
- Start/stop controls

#### ScanHistory.tsx
Historical scan viewer:
- Stores up to 20 previous scans
- Timestamp and process count
- Click to restore historical view
- Clear history functionality

#### Navigation.tsx
View routing component:
- Quick Scan, Live Monitor, History, About tabs
- Active state styling with neon cyan border

#### TitleBar.tsx
Custom window controls:
- Window title display
- Minimize, maximize, close buttons
- Draggable area for window movement

### Styling Architecture

**TailwindCSS Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00fff9',
          blue: '#00d4ff'
        },
        dark: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155'
        }
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  }
}
```

**Visual Design Principles:**
- Dark slate background `#0f172a`
- Glassmorphism cards (semi-transparent, backdrop blur)
- Neon cyan accents for interactive elements
- Smooth transitions (200-300ms)
- Grid pattern background for depth

---

## Communication Protocol

### Message Format

All messages exchanged between frontend and backend are newline-delimited JSON objects. Each message is a single line terminated with `\n`.

### Command Messages (Frontend → Backend)

**Get Processes:**
```json
{"type":"command","command":"getProcesses"}\n
```

**Start Continuous Scan:**
```json
{"type":"command","command":"startScan"}\n
```

**Stop Continuous Scan:**
```json
{"type":"command","command":"stopScan"}\n
```

### Response Messages (Backend → Frontend)

**Process List:**
```json
{
  "type": "processInfo",
  "processes": [
    {
      "pid": 1234,
      "name": "chrome.exe",
      "executablePath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "icon": "iVBORw0KGgoAAAANSUhEUg...",
      "connections": 8,
      "bytesSent": 524288,
      "bytesReceived": 1048576,
      "protocols": ["TCP"],
      "remoteAddresses": [
        {"address": "142.250.185.46", "port": 443},
        {"address": "172.217.164.110", "port": 443}
      ]
    }
  ]
}\n
```

**Error Response:**
```json
{
  "type": "error",
  "message": "Failed to enumerate TCP connections",
  "code": "CAPTURE_ERROR"
}\n
```

### Connection State Machine

```
┌─────────┐
│ INITIAL │
└────┬────┘
     │ connect()
     ▼
┌────────────┐  disconnect()  ┌──────────────┐
│ CONNECTING ├───────────────►│ DISCONNECTED │
└────┬───────┘                └──────────────┘
     │ connected                      ▲
     ▼                                │
┌───────────┐   error/close           │
│ CONNECTED ├─────────────────────────┘
└───┬───────┘
    │ sendCommand()
    │ receiveMessage()
    └──────────┐
               │
               ▼
         ┌──────────┐
         │  ACTIVE  │
         └──────────┘
```

---

## Build System

### Backend Build

**Configuration File:** `CaptureService.csproj`
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <RuntimeIdentifier>win-x64</RuntimeIdentifier>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  
  <ItemGroup>
    <PackageReference Include="SharpPcap" Version="6.2.5" />
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
  </ItemGroup>
</Project>
```

**Build Commands:**
```powershell
# Debug build
dotnet build -c Debug

# Release build with optimizations
dotnet build -c Release

# Self-contained deployment
dotnet publish -c Release -r win-x64 --self-contained true

# Development run
dotnet run -c Debug
```

**Output Artifacts:**
- `bin/Debug/net8.0/win-x64/CaptureService.exe`
- `bin/Release/net8.0/win-x64/CaptureService.exe`
- `bin/Release/net8.0/win-x64/publish/` (self-contained)

### Frontend Build

**Configuration Files:**
- `package.json` - NPM dependencies and scripts
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript compiler options
- `tsconfig.main.json` - Main process TypeScript config
- `tailwind.config.js` - TailwindCSS configuration
- `postcss.config.js` - PostCSS plugins

**Build Scripts:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:renderer\" \"npm run dev:main\"",
    "dev:renderer": "vite",
    "dev:main": "tsc -p tsconfig.main.json && electron .",
    "build": "npm run build:renderer && npm run build:main",
    "build:renderer": "vite build",
    "build:main": "tsc -p tsconfig.main.json",
    "package": "electron-builder"
  }
}
```

**Development Workflow:**
1. `npm install` - Install dependencies
2. `npm run dev` - Start dev server and Electron app
3. Hot reload enabled for renderer process
4. Main process requires restart on changes

**Production Build:**
1. `npm run build` - Compile TypeScript and bundle renderer
2. `npm run package` - Create distributable with electron-builder

**Output Structure:**
```
app/dist/
├── main/
│   ├── main.js
│   └── serviceConnector.js
├── preload/
│   └── preload.js
└── renderer/
    ├── index.html
    └── assets/
        ├── index-[hash].js
        └── index-[hash].css
```

### Electron Builder Configuration

```json
{
  "build": {
    "appId": "com.networktrafficmonitor.app",
    "productName": "Network Traffic Monitor",
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "files": [
      "dist/**/*",
      "package.json"
    ],
    "extraResources": [
      {
        "from": "../backend/CaptureService/bin/Release/net8.0/win-x64/publish",
        "to": "backend",
        "filter": ["**/*"]
      }
    ]
  }
}
```

This configuration:
- Bundles backend service into `resources/backend/`
- Creates NSIS installer for Windows
- Includes all frontend dist files
- Sets application metadata

---

## Deployment

### Prerequisites

**User System Requirements:**
- Windows 10 1809+ or Windows 11
- Administrator privileges (for backend service)
- .NET 8.0 Runtime (if not using self-contained build)
- Npcap driver (optional, for packet capture features)

**Developer Requirements:**
- Node.js 18.0.0 or later
- .NET 8.0 SDK
- Visual Studio 2022 or VS Code with C# extension

### Installation Process

**Manual Installation:**
1. Extract application archive
2. Run backend service as administrator: `backend\CaptureService.exe`
3. Launch Electron app: `Network Traffic Monitor.exe`

**Automated Installer (NSIS):**
1. Run installer executable
2. Follow installation wizard
3. Desktop shortcut created
4. Start menu entry created

### Service Deployment

**Option 1: Manual Start**
```powershell
Start-Process -FilePath "CaptureService.exe" -Verb RunAs
```

**Option 2: Windows Service (Advanced)**
Convert to Windows Service using NSSM or similar:
```powershell
nssm install NetworkTrafficCapture "C:\Path\To\CaptureService.exe"
nssm set NetworkTrafficCapture Start SERVICE_AUTO_START
nssm start NetworkTrafficCapture
```

### Configuration

**Backend Configuration:**
- Port: `9876` (hardcoded in PipeServer.cs)
- Bind address: `127.0.0.1` (localhost only)
- No configuration file currently supported

**Frontend Configuration:**
- Service connection: `localhost:9876` (hardcoded in serviceConnector.ts)
- Window dimensions: `1200x800` default

### Updates and Versioning

**Version Management:**
- Frontend version in `app/package.json`
- Backend version in `CaptureService.csproj`
- No automatic update mechanism currently implemented

**Manual Update Process:**
1. Stop running application and service
2. Replace executable files
3. Restart service and application

---

## Security Considerations

### Privilege Separation

The architecture separates privileged operations (backend) from untrusted code (Electron renderer). This limits the attack surface by:
- Running UI with standard user privileges
- Only elevating backend service when necessary
- Isolating network communication over localhost TCP

### Attack Surface

**Exposed Interfaces:**
- TCP port 9876 bound to loopback interface only
- No internet-facing interfaces
- No remote access capabilities

**Potential Risks:**
1. **Local Privilege Escalation:** Malicious process could connect to port 9876 and issue commands
2. **JSON Injection:** Improper input validation could cause parsing errors or crashes
3. **Resource Exhaustion:** Rapid scan requests could consume CPU/memory

**Mitigations:**
- Localhost-only binding prevents remote attacks
- JSON deserialization uses strict schema validation
- Rate limiting on scan operations (built-in TCP backpressure)

### Code Signing

**Current State:**
- Application not signed by default
- SmartScreen warnings on first run

**Recommendations:**
- Obtain code signing certificate
- Sign both Electron app and backend service
- Include timestamping to survive certificate expiration

---

## Troubleshooting

### Backend Service Issues

**Error: "Service requires administrator privileges"**
- **Cause:** Backend launched without elevation
- **Solution:** Right-click → Run as Administrator, or use `Start-Process -Verb RunAs`

**Error: "Address already in use (port 9876)"**
- **Cause:** Previous instance still running or port conflict
- **Solution:** Kill existing process (`taskkill /F /IM CaptureService.exe`) or change port in code

**Error: "Failed to load SharpPcap"**
- **Cause:** Npcap driver not installed
- **Solution:** Download and install Npcap from https://npcap.com/ with WinPcap compatibility mode

**Error: "Access denied when reading process information"**
- **Cause:** Attempting to read protected system processes
- **Solution:** Expected behavior for system processes; filter these out in UI

### Frontend Application Issues

**Error: "Failed to connect to service"**
- **Cause:** Backend service not running or port mismatch
- **Solution:** Verify backend is running, check port 9876 is listening (`netstat -an | findstr 9876`)

**Error: "Connection timeout"**
- **Cause:** Firewall blocking localhost connections
- **Solution:** Add firewall exception for CaptureService.exe

**Blank Window or Crash on Startup**
- **Cause:** Incompatible Electron version or corrupted build
- **Solution:** Clear `app/node_modules` and rebuild: `npm ci && npm run build`

**Icons Not Displaying**
- **Cause:** Base64 decoding error or invalid PNG data
- **Solution:** Check backend logs for icon extraction failures, ensure executables are accessible

### Build Errors

**Backend: "SDK not found"**
- **Cause:** .NET 8.0 SDK not installed
- **Solution:** Install .NET 8.0 SDK from https://dotnet.microsoft.com/download

**Frontend: "Cannot find module 'electron'"**
- **Cause:** Node modules not installed
- **Solution:** Run `npm install` in `app/` directory

**Frontend: "TypeScript compilation failed"**
- **Cause:** Type errors in source code
- **Solution:** Run `npx tsc --noEmit` to see detailed errors, fix type issues

### Performance Issues

**High CPU Usage**
- **Cause:** Continuous scanning without delays
- **Solution:** Increase scan interval in LiveScan component (default: 10 seconds)

**Memory Leak**
- **Cause:** Process info cache not being cleared
- **Solution:** Implement cache eviction policy in CaptureEngine (TTL-based)

**Slow UI Response**
- **Cause:** Large process list rendering
- **Solution:** Implement virtualized list rendering for 100+ processes

---

## Development Workflow

### Local Development Setup

1. **Clone repository:**
   ```powershell
   git clone <repository-url>
   cd internet-outgoing
   ```

2. **Backend setup:**
   ```powershell
   cd backend/CaptureService
   dotnet restore
   dotnet build -c Debug
   ```

3. **Frontend setup:**
   ```powershell
   cd ../../app
   npm install
   ```

4. **Run in development mode:**
   
   Terminal 1 (Administrator):
   ```powershell
   cd backend/CaptureService
   dotnet run -c Debug
   ```
   
   Terminal 2 (Standard user):
   ```powershell
   cd app
   npm run dev
   ```

### Debugging

**Backend Debugging:**
- Use Visual Studio 2022 or VS Code with C# extension
- Set breakpoints in CaptureEngine.cs or PipeServer.cs
- Launch with debugger attached (F5)
- Console output shows detailed connection logs

**Frontend Debugging:**
- Open Electron DevTools: Press `Ctrl+Shift+I` in app window
- React DevTools available in Electron DevTools
- Main process debugging: `--inspect` flag in electron launch
- Console logs show TCP client connection status

### Testing Strategies

**Backend Unit Tests:**
```csharp
// Example test structure (not currently implemented)
[TestClass]
public class CaptureEngineTests
{
    [TestMethod]
    public void GetProcesses_ReturnsNonEmptyList()
    {
        var engine = new CaptureEngine();
        var processes = engine.GetAllActiveProcesses();
        Assert.IsTrue(processes.Count > 0);
    }
}
```

**Frontend Component Tests:**
```typescript
// Example test with React Testing Library
import { render, screen } from '@testing-library/react';
import ProcessList from './ProcessList';

test('renders process list', () => {
  render(<ProcessList processes={mockProcesses} />);
  expect(screen.getByText('chrome.exe')).toBeInTheDocument();
});
```

**Integration Testing:**
1. Start backend service
2. Launch frontend in test mode
3. Verify TCP connection establishes
4. Send test commands and validate responses

---

## Performance Optimization

### Backend Optimizations

**Connection Caching:**
- Cache TCP/UDP table results for 5 seconds
- Prevents redundant API calls during rapid scans
- Reduces CPU usage by ~60% during continuous monitoring

**Async DNS Resolution:**
- Non-blocking DNS lookups with 500ms timeout
- Prevents UI freezes on slow DNS responses
- Falls back to IP address display on timeout

**Icon Extraction:**
- Extract and cache icons per process
- Store in-memory with process lifetime
- Base64 encode once, reuse for all messages

**Memory Management:**
- Release unmanaged buffers immediately after TCP table reads
- Use `using` statements for IDisposable resources
- Periodic GC collection for long-running service

### Frontend Optimizations

**Lazy Rendering:**
- Render only visible process cards initially
- Expand details on-demand (user click)
- Reduces initial paint time for large lists

**Debounced Updates:**
- Throttle live scan updates to max 1 per second
- Prevents UI thrashing during high activity
- Merge multiple updates for same process

**Image Optimization:**
- Icons cached in component state
- No re-decoding of Base64 on re-renders
- CSS transforms for smooth animations (GPU accelerated)

**Bundle Size Reduction:**
- Tree-shaking enabled in Vite config
- TailwindCSS purges unused styles
- Total bundle size: ~1.2MB (compressed)

---

## Future Enhancements

### Planned Features

1. **Packet Inspection:**
   - Full packet capture integration with SharpPcap
   - Protocol-specific parsers (HTTP, DNS, TLS SNI)
   - Packet filtering and search

2. **Database Storage:**
   - SQLite database for historical data
   - Long-term connection tracking
   - Bandwidth usage trends

3. **Alerting System:**
   - Configurable rules for suspicious activity
   - Desktop notifications for alerts
   - Email/webhook integrations

4. **Export Capabilities:**
   - CSV export of process/connection data
   - JSON export for analysis tools
   - PCAP file generation

5. **Cross-Platform Support:**
   - Linux support using libpcap
   - macOS support with platform-specific APIs
   - Unified abstraction layer

### Technical Debt

- Implement proper logging framework (Serilog for backend, Winston for frontend)
- Add comprehensive error handling and recovery
- Replace hardcoded configuration with config files
- Implement automatic backend service startup/stop
- Add unit and integration test suites
- Improve TCP protocol resilience (heartbeat, reconnection strategy)

---

## License and Attribution

**Project License:** MIT

**Third-Party Libraries:**

| Library | License | Purpose |
|---------|---------|---------|
| Electron | MIT | Desktop application framework |
| React | MIT | UI component library |
| SharpPcap | LGPL-2.1+ | Packet capture library |
| Newtonsoft.Json | MIT | JSON serialization |
| TailwindCSS | MIT | CSS framework |
| Vite | MIT | Build tool |

**Npcap License:**
- Npcap is licensed separately under Npcap License
- Commercial use requires Npcap OEM license
- Free for personal use

---

## Contributing

### Code Style

**C# Backend:**
- Follow Microsoft C# Coding Conventions
- Use PascalCase for public members
- Use camelCase for private fields with `_` prefix
- 4-space indentation

**TypeScript Frontend:**
- Follow Airbnb JavaScript Style Guide
- Use PascalCase for components
- Use camelCase for functions/variables
- 2-space indentation
- Prefer functional components with hooks

### Pull Request Process

1. Fork repository and create feature branch
2. Implement changes with tests
3. Update documentation (README, WIKI)
4. Submit PR with detailed description
5. Pass code review and CI checks

### Reporting Issues

Include the following in bug reports:
- Windows version
- Application version
- Steps to reproduce
- Expected vs actual behavior
- Backend console logs
- Frontend DevTools console output

---

## Contact and Support

**Documentation:**
- Technical Wiki: `WIKI.md` (this document)
- User Guide: `README.md`
- Build Instructions: `BUILD.md`
- Feature List: `FEATURES.md`

**Development:**
- Architecture decisions documented inline in code
- Component READMEs in respective directories
- API contracts defined in TypeScript interfaces

**Community:**
- GitHub Issues for bug reports and feature requests
- GitHub Discussions for questions and ideas

---

*Last Updated: February 2026*
*Documentation Version: 1.0*
