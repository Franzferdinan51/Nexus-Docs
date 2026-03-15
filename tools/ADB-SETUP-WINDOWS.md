# ADB Setup for Windows

This guide covers installing Android Debug Bridge (ADB) on Windows systems.

## What is ADB?

ADB (Android Debug Bridge) is a versatile command-line tool that lets you communicate with Android devices. It enables:
- Installing and debugging apps
- Accessing Unix shells
- Transferring files
- Performing wireless debugging
- Accessing device internals

---

## Installation Methods

### Method 1: Standalone Platform Tools (Recommended)

**Official Android SDK Platform Tools**

1. **Download** the SDK Platform Tools:
   - Visit: https://developer.android.com/studio/releases/platform-tools
   - Click "Download SDK Platform-Tools for Windows"

2. **Extract** the ZIP file:
   - Right-click the downloaded file
   - Select "Extract All..."
   - Choose a location like `C:\adb` (avoid Program Files)

3. **Add to PATH** (optional but recommended):
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Go to "Advanced" tab → "Environment Variables"
   - Under "System variables", find and select "Path"
   - Click "Edit" → "New"
   - Add the path (e.g., `C:\adb`)
   - Click "OK" all the way out

4. **Verify** installation:
   ```powershell
   adb version
   ```

---

### Method 2: Using Chocolatey

If you have [Chocolatey](https://chocolatey.org/) installed:

```powershell
# Run as Administrator
choco install adb

# Verify
adb version
```

---

### Method 3: Using Winget

```powershell
# Run in PowerShell
winget install Google.PlatformTools

# Verify
adb version
```

---

### Method 4: Via Android Studio

1. Download Android Studio: https://developer.android.com/studio
2. During installation, ensure "Android SDK" is selected
3. ADB will be installed at:
   ```
   C:\Users\<YourName>\AppData\Local\Android\Sdk\platform-tools\
   ```

4. Add to PATH:
   ```
   C:\Users\<YourName>\AppData\Local\Android\Sdk\platform-tools
   ```

---

## Enable Developer Options on Your Phone

Before using ADB, you must enable Developer Options on your Android device:

1. **Open Settings** on your Android device

2. **Find Build Number**:
   - Stock Android: Settings → About Phone → Build Number
   - Samsung: Settings → About Phone → Software Info → Build Number
   - Xiaomi: Settings → My Device → All Specs → Build Number

3. **Tap Build Number** 7 times
   - You'll see: "You are now a developer!"

4. **Enable USB Debugging**:
   - Go to Settings → System → Developer Options
   - Or Settings → Developer Options (varies by device)
   - Toggle "USB Debugging" to ON

5. **Authorize your computer**:
   - Connect your phone via USB
   - Look for a popup: "Allow USB debugging?"
   - Check "Always allow from this computer"
   - Tap "Allow"

---

## Verify Connection

### USB Connection

```powershell
# List connected devices
adb devices

# Should show something like:
# List of devices attached
# XXXXXXXX    device
```

### Wireless Connection

```powershell
# Connect via IP (after enabling wireless debugging)
adb connect 192.168.1.100:5555

# Verify connection
adb devices
```

---

## Troubleshooting

### "ADB is not recognized"

- **Solution**: Add ADB to your PATH (see Method 1, step 3)
- Or use full path: `C:\adb\adb.exe devices`

### "No devices found"

- **Check**: Is USB Debugging enabled on phone?
- **Check**: Did you authorize this computer on your phone?
- **Try**: Different USB cable (some are charge-only)
- **Try**: Different USB port (prefer USB 2.0 ports)

### "Device unauthorized"

- **Solution**: Disconnect and reconnect USB, tap "Allow" on phone

### " daemon not running; starting now at tcp:5037"

- **Solution**: This is normal on first run. ADB will start automatically.

---

## Common ADB Commands

```powershell
# Device information
adb shell getprop ro.product.model
adb shell getprop ro.android.version

# File transfer
adb pull /sdcard/DCIM/ C:\Photos\
adb push C:\file.txt /sdcard/Download/

# Install app
adb install app.apk

# Uninstall app
adb uninstall com.package.name

# Reboot device
adb reboot
adb reboot bootloader  # Bootloader mode
adb reboot recovery    # Recovery mode

# Shell access
adb shell
adb shell dumpsys battery
```

---

## Wireless ADB (No USB Cable)

Once connected via USB:

```powershell
# Enable wireless debugging on device
adb tcpip 5555

# Disconnect USB and connect via IP
adb connect 192.168.1.100:5555

# To disconnect
adb disconnect 192.168.1.100:5555
```

Or use the provided `wireless-adb-setup.ps1` script for guided setup.

---

## Security Notes

1. **Only enable USB Debugging when needed**
2. **Don't use wireless ADB on public networks**
3. **Revoke USB debugging authorizations when selling device**
4. **Keep your ADB installation updated**

---

## Resources

- Official ADB Documentation: https://developer.android.com/studio/command-line/adb
- XDA Developers ADB Guide: https://www.xda-developers.com/adb/
- Platform Tools Download: https://developer.android.com/studio/releases/platform-tools