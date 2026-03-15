# NexusDocs Phone Companion - Desktop App

📱 **Cross-platform desktop application for streaming your phone camera to NexusDocs**

A native Electron desktop app that provides a user-friendly interface for managing camera streaming, WebSocket configuration, and system integration. Available for Windows, Linux, and macOS.

![Platform Support](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Electron](https://img.shields.io/badge/Electron-28.0-purple)

---

## ✨ Features

- 🎥 **Camera Selection** - Choose from multiple available cameras
- ⚙️ **Resolution & FPS Settings** - Configure stream quality (VGA to 4K, 15-60 FPS)
- 🔌 **WebSocket Server** - Built-in WebSocket server for client connections
- 📲 **System Tray Integration** - Quick access from system tray
- 🚀 **Auto-Start on Boot** - Launch automatically when your system starts
- ▶️ **Start/Stop Streaming** - One-click streaming control
- 🟢 **Connection Status** - Real-time connection indicator
- 📝 **Activity Log** - Track all application events
- 🎨 **Modern UI** - Beautiful gradient interface with intuitive controls

---

## 📋 Requirements

### All Platforms

- **Node.js** v18.x or higher ([Download](https://nodejs.org/))
- **npm** v9.x or higher (included with Node.js)

### Windows

- Windows 10/11 (64-bit)
- Visual C++ Redistributable (usually pre-installed)

### Linux

- Ubuntu 20.04+ / Debian 11+ / Fedora 35+ / Pop!_OS 22.04+
- Build tools: `build-essential`
- OpenCV libraries: `libopencv-dev`

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y build-essential libopencv-dev python3-opencv

# Fedora
sudo dnf install -y gcc gcc-c++ make opencv opencv-devel
```

### macOS

- macOS 10.13 (High Sierra) or higher
- Xcode Command Line Tools

```bash
xcode-select --install
```

---

## 🚀 Installation

### From Pre-built Binaries (Recommended)

1. **Download** the appropriate installer for your platform:
   - **Windows**: `NexusDocs Phone Companion Setup X.X.X.exe`
   - **Linux**: `NexusDocs-Phone-Companion-X.X.X.AppImage`
   - **macOS**: `NexusDocs Phone Companion-X.X.X.dmg`

2. **Install/Run**:
   - **Windows**: Run the installer and follow the prompts
   - **Linux**: Make executable and run:
     ```bash
     chmod +x NexusDocs-Phone-Companion-X.X.X.AppImage
     ./NexusDocs-Phone-Companion-X.X.X.AppImage
     ```
   - **macOS**: Open the DMG and drag to Applications folder

### Build from Source

1. **Clone or navigate to the electron directory**:
   ```bash
   cd /Users/duckets/Desktop/Nexus-Docs/phone-companion-app/electron
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run in development mode**:
   ```bash
   npm start
   ```

---

## 🛠️ Building from Source

### Windows

```batch
build-windows.bat
```

Or manually:
```batch
npm install
npm run build:windows
```

**Output**: `dist/NexusDocs Phone Companion Setup X.X.X.exe`

### Linux

```bash
chmod +x build-linux.sh
./build-linux.sh
```

Or manually:
```bash
npm install
npm run build:linux
```

**Output**: `dist/NexusDocs-Phone-Companion-X.X.X.AppImage`

### macOS

```bash
chmod +x build-macos.sh
./build-macos.sh
```

Or manually:
```bash
npm install
npm run build:mac
```

**Output**: `dist/NexusDocs Phone Companion-X.X.X.dmg`

### Build All Platforms

```bash
npm run build:all
```

---

## 📖 Usage

### First Launch

1. **Open the application** from your Start Menu (Windows), Applications folder (macOS), or run the AppImage (Linux)

2. **Select your camera** from the dropdown menu

3. **Configure settings**:
   - **Resolution**: Choose from VGA (640x480) to 4K (3840x2160)
   - **Frame Rate**: 15, 24, 30, or 60 FPS
   - **WebSocket Port**: Default is 8765 (change if needed)
   - **WebSocket Host**: Default is `localhost`

4. **Enable auto-start** (optional) to launch on system boot

5. **Click "Start Streaming"** to begin

### System Tray

The app runs in the system tray for quick access:

- **Windows**: Bottom-right corner
- **Linux**: Top bar or system tray (varies by DE)
- **macOS**: Menu bar (top-right)

**Right-click** the tray icon to:
- Show/Hide the app window
- Start/Stop streaming
- Quit the application

### Activity Log

The built-in log shows:
- ✅ Application events (startup, config changes)
- ⚠️ Warnings (camera issues, connection problems)
- ❌ Errors (failed operations)
- ℹ️ Info messages (streaming status)

---

## ⚙️ Configuration

Configuration is automatically saved to:

- **Windows**: `%APPDATA%\nexusdocs-phone-companion\config.json`
- **Linux**: `~/.config/nexusdocs-phone-companion/config.json`
- **macOS**: `~/Library/Application Support/nexusdocs-phone-companion/config.json`

### Configuration Options

```json
{
  "websocketPort": 8765,
  "resolution": {
    "width": 1280,
    "height": 720
  },
  "fps": 30,
  "autoStart": false,
  "cameraId": "default"
}
```

---

## 🔧 Troubleshooting

### App Won't Start

**Problem**: Application crashes on launch

**Solutions**:
1. Check Node.js version: `node --version` (must be v18+)
2. Reinstall dependencies: `npm install --force`
3. Check for error logs in the application directory

### Camera Not Detected

**Problem**: No cameras appear in dropdown

**Solutions**:
1. **Windows**: Check Device Manager → Cameras
2. **Linux**: Run `ls /dev/video*` to list cameras
3. **macOS**: System Preferences → Security & Privacy → Camera
4. Restart the application
5. Check camera permissions in system settings

### WebSocket Connection Failed

**Problem**: Status shows "Disconnected"

**Solutions**:
1. Check if port 8765 is available:
   ```bash
   # Linux/macOS
   lsof -i :8765
   
   # Windows
   netstat -ano | findstr :8765
   ```
2. Try a different port (e.g., 8766)
3. Check firewall settings
4. Ensure no other app is using the port

### Build Fails

**Problem**: `npm run build` fails

**Solutions**:

**Windows**:
```batch
npm install --global windows-build-tools
npm install
```

**Linux**:
```bash
sudo apt-get install -y build-essential libopencv-dev
npm install
```

**macOS**:
```bash
xcode-select --install
npm install
```

### Auto-Start Not Working

**Problem**: App doesn't launch on boot

**Solutions**:
1. **Windows**: Check Startup folder (`shell:startup`)
2. **Linux**: Verify `~/.config/autostart/nexusdocs-phone-companion.desktop`
3. **macOS**: Check `~/Library/LaunchAgents/com.nexusdocs.phone-companion.plist`
4. Re-enable auto-start in app settings

### Performance Issues

**Problem**: Laggy video or high CPU usage

**Solutions**:
1. Lower resolution (try 720p instead of 4K)
2. Reduce FPS (30 FPS is usually sufficient)
3. Close other camera applications
4. Check system resources (Task Manager / Activity Monitor)

---

## 📁 Project Structure

```
electron/
├── package.json          # Dependencies and build config
├── main.js               # Main Electron process
├── preload.js            # Secure IPC bridge
├── renderer.js           # UI logic and event handling
├── index.html            # Application UI
├── build-windows.bat     # Windows build script
├── build-linux.sh        # Linux build script
├── build-macos.sh        # macOS build script
└── README.md             # This file
```

---

## 🔐 Security Notes

- **Context Isolation**: Enabled for secure IPC communication
- **Node Integration**: Disabled in renderer process
- **Preload Script**: Exposes only necessary APIs
- **WebSocket**: Local connections only by default

For production use:
- Enable WebSocket authentication
- Use HTTPS/WSS for remote connections
- Implement proper access control
- Code-sign the application

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on all platforms
5. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🆘 Support

**Issues**: Report bugs and request features on GitHub  
**Documentation**: Check the [Wiki](#) for detailed guides  
**Discord**: Join our community server for real-time help

---

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- WebSocket library: [ws](https://github.com/websockets/ws)
- Icons: [Heroicons](https://heroicons.com/)
- Inspired by the NexusDocs Phone Companion Python script

---

**Made with ❤️ for the NexusDocs Community**

*Last Updated: March 14, 2026*
