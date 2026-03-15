# NexusDocs Camera Streamer (Python/Termux)

Stream your phone's camera to NexusDocs MotionCam **WITHOUT ROOT**!

---

## 📋 Requirements

- Android phone with Termux installed
- WiFi network (phone and server on same network)
- Python 3.8+

---

## 🚀 Quick Start

### 1. Install Termux

Download from F-Droid (recommended) or Play Store:
- **F-Droid:** https://f-droid.org/en/packages/com.termux/
- **Play Store:** Search "Termux"

### 2. Setup (One-Time)

Open Termux and run:

```bash
# Clone or copy this folder to your phone
# Or manually create the files

# Run setup script
chmod +x setup-termux.sh
./setup-termux.sh
```

Or manually:

```bash
pkg update && pkg upgrade
pkg install python clang cmake libjpeg-turbo
pip install opencv-python websockets numpy
```

### 3. Configure Server URL

Edit the server URL to match your NexusDocs server:

```bash
# Example: if your server is at 192.168.1.100
python camera-streamer.py --server ws://192.168.1.100:8080 --device-id my-phone
```

### 4. Start Streaming

```bash
python camera-streamer.py --server ws://YOUR_SERVER_IP:8080 --device-id unique-id
```

### 5. Enable in MotionCam

1. Open NexusDocs at http://localhost:5173
2. Go to **MotionCam** tab
3. Click **Configure Cameras**
4. Add IP camera with URL: `ws://YOUR_PHONE_IP:8080`
5. Enable the camera

---

## 📖 Command Line Options

```
--server      WebSocket server URL (required)
--device-id   Unique device ID (required)
--camera      Camera ID (default: 0, front camera)
--width       Frame width (default: 640)
--height      Frame height (default: 480)
--fps         Frames per second (default: 15)
```

### Examples:

**Basic usage:**
```bash
python camera-streamer.py --server ws://192.168.1.100:8080 --device-id living-room
```

**Front camera, higher resolution:**
```bash
python camera-streamer.py --server ws://192.168.1.100:8080 --device-id front-cam --camera 1 --width 1280 --height 720
```

**Back camera, 30fps:**
```bash
python camera-streamer.py --server ws://192.168.1.100:8080 --device-id back-cam --camera 0 --fps 30
```

---

## 🔧 Troubleshooting

### "Cannot open camera"
- Try different camera ID: `--camera 0` or `--camera 1`
- Grant camera permission in Termux: `termux-setup-storage`

### "Connection failed"
- Check server IP is correct
- Ensure phone and server are on same WiFi network
- Check firewall allows port 8080

### "Module not found"
- Reinstall dependencies: `pip install -r requirements.txt`
- Install system packages: `pkg install clang cmake`

### Low FPS
- Reduce resolution: `--width 320 --height 240`
- Reduce FPS: `--fps 10`
- Use WiFi 5GHz for better bandwidth

---

## 🛑 Stopping the Stream

Press `Ctrl+C` in Termux to stop streaming.

---

## 📱 Auto-Start on Boot (Optional)

Create a Termux boot script:

```bash
mkdir -p ~/.termux/boot
echo '#!/bin/bash
cd /data/data/com.termux/files/home/nexusdocs
python camera-streamer.py --server ws://192.168.1.100:8080 --device-id my-phone' > ~/.termux/boot/start-camera.sh
chmod +x ~/.termux/boot/start-camera.sh
```

---

## 🔒 Security Notes

- Use HTTPS/WSS in production
- Configure firewall to only allow trusted IPs
- Use unique device IDs for each camera
- Don't expose to public internet without authentication

---

**No root required!** Works on standard Android + Termux. 🦆
