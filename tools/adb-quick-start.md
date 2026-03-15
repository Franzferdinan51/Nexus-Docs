# ADB Quick Start Guide

Wireless ADB setup for phone forensics **WITHOUT ROOT**.

---

## 🚀 One-Time Setup

### 1. Install ADB

**Ubuntu/Debian:**
```bash
sudo apt install adb
```

**macOS:**
```bash
brew install android-platform-tools
```

**Windows:**
1. Download from https://developer.android.com/studio/releases/platform-tools
2. Extract to `C:\platform-tools`
3. Add to PATH

---

### 2. Enable Developer Options on Phone

1. Go to **Settings → About Phone**
2. Tap **Build Number** 7 times
3. Go to **Settings → Developer Options**
4. Enable **USB Debugging**

---

### 3. Run Wireless Setup

```bash
cd /Users/duckets/Desktop/Nexus-Docs/tools
chmod +x wireless-adb-setup.sh
./wireless-adb-setup.sh
```

Follow the prompts:
1. Connect phone via USB
2. Enable USB debugging when prompted
3. Script will enable wireless ADB
4. Disconnect USB

---

## 📡 Daily Use

### Connect Wirelessly

```bash
adb connect 192.168.1.100:5555
```

(Replace with your phone's IP)

### Verify Connection

```bash
adb devices
```

Should show:
```
List of devices attached
192.168.1.100:5555    device
```

---

## 🔧 Common Commands (No Root Required)

### Get Device Info
```bash
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
```

### Extract SMS
```bash
adb shell content query --uri content://sms/
adb shell content query --uri content://sms/inbox
adb shell content query --uri content://sms/sent
```

### Extract Call Logs
```bash
adb shell content query --uri content://call_log/calls
```

### Extract Contacts
```bash
adb shell content query --uri content://contacts/phones
```

### List Installed Apps
```bash
adb shell pm list packages
adb shell pm list packages -f  # with APK paths
```

### Pull Files
```bash
adb pull /sdcard/DCIM/Camera/ ./photos/
adb pull /sdcard/Download/ ./downloads/
adb pull /sdcard/WhatsApp/Media/ ./whatsapp/
```

### Push Files
```bash
adb push file.txt /sdcard/Download/
```

### Screenshot
```bash
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

### Screen Record
```bash
adb shell screenrecord /sdcard/video.mp4
# Press Ctrl+C to stop
adb pull /sdcard/video.mp4
```

---

## 📱 Phone Forensics Script

Use the automated extraction script:

```bash
chmod +x phone-extract.sh
./phone-extract.sh
```

This extracts:
- SMS messages
- Call logs
- Contacts
- Photos
- Downloads
- Installed apps
- Device info
- WiFi info

---

## ⚠️ Troubleshooting

### "No devices found"
```bash
adb kill-server
adb start-server
adb connect 192.168.1.100:5555
```

### "Unauthorized"
- Check phone screen for "Allow USB debugging?" prompt
- Tap "Allow"

### "Connection refused"
- Ensure phone and computer are on same WiFi
- Check firewall settings
- Restart wireless ADB:
  ```bash
  adb usb
  adb tcpip 5555
  adb connect 192.168.1.100:5555
  ```

### "Permission denied"
Some content providers require additional permissions. Try:
```bash
adb shell appops set com.android.providers.telephony READ_SMS allow
```

---

## 🔒 Security Notes

- Wireless ADB is only secure on trusted networks
- Disable wireless ADB when not in use:
  ```bash
  adb usb
  ```
- Don't expose ADB to public networks
- Use unique device IDs for each phone

---

## 📚 Additional Resources

- ADB Documentation: https://developer.android.com/studio/command-line/adb
- Content Provider URIs: https://developer.android.com/guide/topics/providers/content-provider-basics
- ADB Shell Commands: https://developer.android.com/studio/command-line/shell

---

**No root required!** Works on most Android phones with USB debugging enabled. 🦆
