const { app, BrowserWindow, ipcMain, desktopCapturer, systemPreferences, Tray, Menu, nativeImage, autoUpdater } = require('electron');
const path = require('path');
const WebSocket = require('ws');
const { exec } = require('child_process');
const fs = require('fs');

let mainWindow;
let tray = null;
let websocketServer = null;
let isStreaming = false;
let cameraStream = null;

// Configuration
const config = {
  websocketPort: 8765,
  resolution: { width: 1280, height: 720 },
  fps: 30,
  autoStart: false
};

// Load saved config
function loadConfig() {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      Object.assign(config, savedConfig);
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  }
}

// Save config
function saveConfig() {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopStreaming();
    if (websocketServer) {
      websocketServer.close();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  const trayIcon = icon.resize({ width: 16, height: 16 });
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: isStreaming ? 'Stop Streaming' : 'Start Streaming',
      click: () => {
        toggleStreaming();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('NexusDocs Phone Companion');
  tray.setContextMenu(contextMenu);
}

function startWebSocketServer() {
  try {
    websocketServer = new WebSocket.Server({ port: config.websocketPort });
    
    websocketServer.on('connection', (ws) => {
      console.log('Client connected to WebSocket');
      
      ws.on('message', (message) => {
        console.log('Received:', message.toString());
        // Handle incoming messages from clients
        try {
          const data = JSON.parse(message);
          if (data.type === 'config') {
            // Update configuration from client
            Object.assign(config, data.config);
            saveConfig();
          }
        } catch (e) {
          console.error('Invalid message format:', e);
        }
      });
      
      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
    
    console.log(`WebSocket server started on port ${config.websocketPort}`);
    return true;
  } catch (e) {
    console.error('Failed to start WebSocket server:', e);
    return false;
  }
}

async function getCameras() {
  try {
    const sources = await desktopCapturer.getSources({ 
      types: ['window', 'screen'],
      thumbnailSize: { width: 0, height: 0 }
    });
    
    // For actual camera access, we'd use a different approach
    // This is a placeholder - in production, use native camera APIs
    return [
      { id: 'default', name: 'Default Camera' },
      { id: 'usb-camera', name: 'USB Camera' },
      { id: 'built-in', name: 'Built-in Camera' }
    ];
  } catch (e) {
    console.error('Failed to get cameras:', e);
    return [];
  }
}

function startStreaming() {
  if (isStreaming) return;
  
  console.log('Starting camera stream...');
  isStreaming = true;
  
  // Update tray menu
  if (tray) {
    const iconPath = path.join(__dirname, 'icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    const trayIcon = icon.resize({ width: 16, height: 16 });
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => mainWindow.show()
      },
      {
        label: 'Stop Streaming',
        click: () => stopStreaming()
      },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ]);
    
    tray.setContextMenu(contextMenu);
  }
  
  // Notify renderer
  if (mainWindow) {
    mainWindow.webContents.send('streaming-status', { isStreaming: true });
  }
  
  // In production, this would start actual camera capture
  // For now, we'll simulate the streaming state
}

function stopStreaming() {
  if (!isStreaming) return;
  
  console.log('Stopping camera stream...');
  isStreaming = false;
  
  if (cameraStream) {
    cameraStream = null;
  }
  
  // Update tray menu
  if (tray) {
    const iconPath = path.join(__dirname, 'icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    const trayIcon = icon.resize({ width: 16, height: 16 });
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => mainWindow.show()
      },
      {
        label: 'Start Streaming',
        click: () => startStreaming()
      },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ]);
    
    tray.setContextMenu(contextMenu);
  }
  
  // Notify renderer
  if (mainWindow) {
    mainWindow.webContents.send('streaming-status', { isStreaming: false });
  }
}

function toggleStreaming() {
  if (isStreaming) {
    stopStreaming();
  } else {
    startStreaming();
  }
}

function setupAutoStart() {
  const startUpPath = path.join(app.getPath('userData'), 'autostart');
  
  if (config.autoStart) {
    const exePath = app.getPath('exe');
    
    if (process.platform === 'win32') {
      // Windows: Create shortcut in Startup folder
      const startupFolder = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
      const shortcutPath = path.join(startupFolder, 'NexusDocs Phone Companion.lnk');
      
      // In production, use a library like 'windows-shortcut' to create shortcut
      console.log('Auto-start enabled for Windows');
    } else if (process.platform === 'darwin') {
      // macOS: Create LaunchAgent
      const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.nexusdocs.phone-companion</string>
    <key>Program</key>
    <string>${exePath}</string>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>`;
      
      const plistPath = path.join(app.getPath('home'), 'Library', 'LaunchAgents', 'com.nexusdocs.phone-companion.plist');
      fs.writeFileSync(plistPath, plistContent);
      console.log('Auto-start enabled for macOS');
    } else if (process.platform === 'linux') {
      // Linux: Create .desktop file
      const desktopContent = `[Desktop Entry]
Type=Application
Name=NexusDocs Phone Companion
Exec=${exePath}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true`;
      
      const autostartDir = path.join(app.getPath('home'), '.config', 'autostart');
      if (!fs.existsSync(autostartDir)) {
        fs.mkdirSync(autostartDir, { recursive: true });
      }
      
      const desktopPath = path.join(autostartDir, 'nexusdocs-phone-companion.desktop');
      fs.writeFileSync(desktopPath, desktopContent);
      console.log('Auto-start enabled for Linux');
    }
  } else {
    // Remove auto-start
    if (process.platform === 'darwin') {
      const plistPath = path.join(app.getPath('home'), 'Library', 'LaunchAgents', 'com.nexusdocs.phone-companion.plist');
      if (fs.existsSync(plistPath)) {
        fs.unlinkSync(plistPath);
      }
    } else if (process.platform === 'linux') {
      const desktopPath = path.join(app.getPath('home'), '.config', 'autostart', 'nexusdocs-phone-companion.desktop');
      if (fs.existsSync(desktopPath)) {
        fs.unlinkSync(desktopPath);
      }
    }
  }
}

// IPC Handlers
ipcMain.handle('get-cameras', async () => {
  return await getCameras();
});

ipcMain.handle('get-config', () => {
  return config;
});

ipcMain.handle('save-config', (event, newConfig) => {
  Object.assign(config, newConfig);
  saveConfig();
  return true;
});

ipcMain.handle('start-streaming', () => {
  startStreaming();
  return true;
});

ipcMain.handle('stop-streaming', () => {
  stopStreaming();
  return true;
});

ipcMain.handle('get-streaming-status', () => {
  return { isStreaming };
});

ipcMain.handle('check-connection', async () => {
  // Check if WebSocket server is running
  return websocketServer !== null;
});

// App Lifecycle
app.whenReady().then(() => {
  loadConfig();
  createWindow();
  createTray();
  startWebSocketServer();
  setupAutoStart();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopStreaming();
  if (websocketServer) {
    websocketServer.close();
  }
});
