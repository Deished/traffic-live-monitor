# Build Instructions

## Prerequisites

### Backend (C# Service)
- .NET 6.0 SDK or later
- Npcap driver (https://npcap.com/#download)
- Administrator privileges

### Frontend (Electron App)
- Node.js 18+ and npm

## Building the Backend Service

1. Navigate to the backend directory:
```bash
cd backend/CaptureService
```

2. Restore dependencies:
```bash
dotnet restore
```

3. Build the project:
```bash
dotnet build -c Release
```

4. The executable will be in: `bin/Release/net6.0/CaptureService.exe`

## Building the Electron App

1. Navigate to the app directory:
```bash
cd app
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm run package
```

## Running the Application

### Development Mode

1. Start the backend service (as Administrator):
```bash
cd backend/CaptureService
dotnet run
```

2. In a new terminal, start the Electron app:
```bash
cd app
npm run dev
```

### Production Mode

1. Build both components (see above)
2. Run the service as Administrator
3. Run the packaged Electron app

## Troubleshooting

### "No capture devices found"
- Install Npcap from https://npcap.com/#download
- Make sure to install in WinPcap compatibility mode

### "Service requires administrator privileges"
- Right-click the service executable and select "Run as administrator"

### Connection timeout
- Ensure the backend service is running before starting the Electron app
- Check Windows Firewall settings

## Next Steps

- Install Npcap driver
- Test the backend service independently
- Run the full application

## Security Notes

- The capture service requires administrator privileges
- Named pipe communication is used for local IPC
- No external network connections are made (all traffic monitoring is local)
