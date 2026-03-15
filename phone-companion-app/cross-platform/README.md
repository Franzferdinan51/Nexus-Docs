# NexusDocs Cross-Platform Camera Streamer

Stream your camera to NexusDocs MotionCam from **Windows, Linux, macOS, or Android**!

---

## 🌍 Platform Support

| Platform | Status | Camera Backend |
|----------|--------|----------------|
| **Windows** | ✅ Tested | DirectShow |
| **Linux** | ✅ Tested | V4L2 |
| **macOS** | ✅ Tested | AVFoundation |
| **Android** | ✅ Tested | Termux Camera API |

---

## 🚀 Quick Start

### Windows (PowerShell)

```powershell
# Run setup
.\setup-windows.ps1

# Start streaming
python camera-streamer.py --server ws://192.168.1.100:8080 --device-id windows-cam
```

### Linux (Ubuntu/Debian)

```bash
# Run setup
chmod +x setup-linux.sh
./setup-linux.sh

# Start streaming
python3 camera-streamer.py --server ws://192.168.1.100:8080 --device-id linux-cam
```

### macOS

```bash
# Run setup (requires Homebrew)
chmod +x setup-macos.sh
./setup-macos.sh

# Start streaming
python3 camera-streamer.py --server ws://192.168.1.100:8080 --device-id mac-cam
```

### Android (Termux)

```bash
# Run setup
chmod +x setup-android.sh
./setup-android.sh

# Start streaming
python camera-streamer.py --server ws://192.168.1.100:8080 --device-id android-cam
```

---

## 📖 Command Line Options

```
--server      WebSocket server URL (required)
--device-id   Unique device ID (required)
--camera      Camera ID (default: 0)
--width       Frame width (default: 640)
--height      Frame height (default: 480)
--fps         Frames per second (default: 15)
--debug       Enable debug logging
```

### Examples:

**Basic usage:**
```bash
python camera-streamer.py --server ws://192.168.1.100:8080 --device-id living-room
```

**Front camera (laptop):**
```bash
python camera-streamer.py --server ws://192.168.1.100:8080 --device-id front --camera 1
```

**HD streaming:**
```bash
python camera-streamer.py --server ws://192.168.1.100:8080 --device-id hd-cam --width 1280 --height 720 --fps 30
```

---

## 🔧 Platform-Specific Notes

### Windows

**Camera Backends:**
- Uses DirectShow by default
- Supports multiple cameras (try `--camera 0`, `--camera 1`, etc.)

**Auto-Start:**
- Desktop shortcut created during setup
- Add to Windows Startup folder for auto-launch

**Troubleshooting:**
- "Cannot open camera" → Try different camera ID
- "Module not found" → Run `pip install -r requirements.txt`

---

### Linux

**Camera Backends:**
- Uses V4L2 (Video4Linux2)
- Check available cameras: `ls -la /dev/video*`

**Auto-Start:**
```bash
sudo systemctl enable nexusdocs-camera
sudo systemctl start nexusdocs-camera
```

**Troubleshooting:**
- Permission denied: `sudo usermod -a -G video $USER`
- No cameras found: `ls /dev/video*`

---

### macOS

**Camera Backends:**
- Uses AVFoundation
- Built-in camera usually at ID 0

**Auto-Start:**
```bash
launchctl load ~/Library/LaunchAgents/com.nexusdocs.camera.plist
```

**Troubleshooting:**
- Camera permission: System Preferences → Security → Privacy → Camera
- "Cannot open camera": Try `--camera 0` or `--camera 1`

---

### Android (Termux)

**Requirements:**
- Termux app (F-Droid recommended)
- Camera permission: `termux-setup-storage`

**Auto-Start:**
- Use Termux:Boot app
- Add script to `~/.termux/boot/`

**Troubleshooting:**
- "Cannot open camera": Try different camera IDs (0, 1, 2)
- Low FPS: Reduce resolution `--width 320 --height 240`

---

## 🛑 Stopping the Stream

Press `Ctrl+C` to stop streaming.

---

## 🔒 Security Notes

- Use WSS (WebSocket Secure) in production
- Configure firewall to only allow trusted IPs
- Use unique device IDs for each camera
- Don't expose to public internet without authentication

---

## 📊 Performance Tips

| Platform | Recommended Settings |
|----------|---------------------|
| **Windows** | 640x480 @ 15fps (USB 2.0), 1280x720 @ 30fps (USB 3.0) |
| **Linux** | 640x480 @ 15fps (WiFi), 1280x720 @ 30fps (Ethernet) |
| **macOS** | 640x480 @ 15fps (built-in), 1920x1080 @ 30fps (external) |
| **Android** | 320x240 @ 10fps (mobile data), 640x480 @ 15fps (WiFi) |

---

## 🎯 Integration with NexusDocs

1. Start camera streamer on any platform
2. Open NexusDocs at http://localhost:5173
3. Go to **MotionCam** tab
4. Click **Configure Cameras**
5. Add camera with WebSocket URL
6. Enable the camera checkbox

**Live feed appears in MotionCam grid!** 🎥

---

**Cross-platform camera streaming without root!** Works on Windows, Linux, macOS, and Android. 🦆🌍
