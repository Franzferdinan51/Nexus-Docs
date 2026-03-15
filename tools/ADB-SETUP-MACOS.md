# ADB Setup for macOS

This guide covers installing Android Debug Bridge (ADB) on macOS systems.

## What is ADB?

ADB (Android Debug Bridge) is a versatile command-line tool that lets you communicate with Android devices. It enables:
- Installing and debugging apps
- Accessing Unix shells
- Transferring files
- Performing wireless debugging
- Accessing device internals

---

## Installation Methods

### Method 1: Homebrew (Recommended)

If you have [Homebrew](https://brew.sh/) installed:

```bash
# Install ADB
brew install --cask android-platform-tools

# Verify
adb version
```

To update later:
```bash
brew upgrade android-platform-tools
```

---

### Method 2: Manual Installation

If you prefer to install manually:

1. **Download** the SDK Platform Tools:
   ```bash
   cd ~/Downloads
   curl -O https://dl.google.com/android/repository/platform-tools-latest-darwin.zip
   ```

2. **Extract** the archive:
   ```bash
   unzip platform-tools-latest-darwin.zip
   ```

3. **Move** to a permanent location:
   ```bash
   mkdir -p ~/android-sdk/platform-tools
   mv platform-tools/* ~/android-sdk/platform-tools/
   ```

4. **Add to PATH** (add to ~/.zshrc or ~/.bash_profile):
   ```bash
   echo 'export PATH="$HOME/android-sdk/platform-tools:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

5. **Verify**:
   ```bash
   adb version
   ```

---

### Method 3: Via Android Studio

1. Download Android Studio: https://developer.android.com/studio
2. During installation, ensure "Android SDK" is selected
3. ADB will be installed at:
   ```
   ~/Library/Android/sdk/platform-tools/
   ```

4. Add to PATH:
   ```
   ~/Library/Android/sdk/platform-tools
   ```

---

### Method 4: MacPorts

```bash
# Install MacPorts first if needed
sudo port install android-platform-tools

# Verify
adb version
```

---

## Enable Developer Options on Your Phone

Before using ADB, you must enable Developer Options on your Android device:

1. **Open Settings** on your Android device

2. **Find Build Number**:
   - Stock Android: Settings → About Phone → Build Number
   - Samsung: Settings → About Phone → Software Info → Build Number
   - Pixel: Settings → About Phone → Build Number

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

```bash
# List connected devices
adb devices

# Should show something like:
# List of devices attached
# XXXXXXXX    device
```

### Wireless Connection

```bash
# Connect via IP (after enabling wireless debugging)
adb connect 192.168.1.100:5555

# Verify connection
adb devices
```

---

## macOS-Specific Notes

### Allowing ADB on macOS (First Time)

When you first connect a device:
1. macOS may show a dialog about the app being blocked
2. Go to **System Settings** → **Privacy & Security**
3. Look for the blocked ADB connection
4. Click "Allow" or "Open Anyway"

### USB-C to USB-A Adapters

If using a USB-C Mac with a USB-A cable:
- Use Apple's official adapter or a quality third-party
- Some adapters don't support data transfer

### Time Machine/Filesystem Issues

```bash
# If you get permission errors
# Check System Settings > Privacy & Security > Files and Folders
# Ensure Terminal or iTerm2 has Full Disk Access if needed
```

---

## Troubleshooting

### "adb: command not found"

- **Solution**: Add ADB to your PATH (see Method 2 or 3)
- Or use full path: `~/android-sdk/platform-tools/adb`

### "No devices found"

- **Check**: Is USB Debugging enabled on phone?
- **Check**: Did you authorize this computer on your phone?
- **Try**: Different USB cable (some are charge-only)
- **Try**: Different USB-C adapter
- **Check**: Run `system_profiler SPUSBDataType` to see if device detected

### "Device unauthorized"

- **Solution**: Disconnect and reconnect USB, tap "Allow" on phone

### Permission Denied on Mojave+

```bash
# On macOS 10.14+, you may need to grant permissions:
# Go to System Settings → Privacy & Security → Developer Tools
# Enable terminal or your shell
```

### Homebrew "cask" not found

```bash
# If you get this error, update Homebrew:
brew update
brew upgrade
```

---

## Common ADB Commands

```bash
# Device information
adb shell getprop ro.product.model
adb shell getprop ro.android.version

# File transfer (from Mac to phone)
adb push ~/file.txt /sdcard/Download/

# File transfer (from phone to Mac)
adb pull /sdcard/DCIM/ ~/Photos/

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

```bash
# Enable wireless debugging on device
adb tcpip 5555

# Disconnect USB and connect via IP
adb connect 192.168.1.100:5555

# To disconnect
adb disconnect 192.168.1.100:5555
```

Or use the provided `wireless-adb-setup.sh` script for guided setup.

---

## Security Notes

1. **Only enable USB Debugging when needed**
2. **Don't use wireless ADB on public networks**
3. **Revoke USB debugging authorizations when selling device**
4. **Keep your ADB installation updated**
5. **macOS may prompt for permissions on first device connection**

---

## Running Without Root

These scripts are designed to work WITHOUT root on macOS:

- `wireless-adb-setup.sh` - Sets up wireless ADB connection
- `phone-extract.sh` - Extracts forensics data

Both work with standard user permissions after the initial setup.

---

## Scripts Included

This toolkit includes:

| Script | Platform | Purpose |
|--------|----------|---------|
| `wireless-adb-setup.ps1` | Windows | Guided wireless ADB setup |
| `wireless-adb-setup.sh` | Linux/macOS | Guided wireless ADB setup |
| `phone-extract.ps1` | Windows | Phone data extraction |
| `phone-extract.sh` | Linux/macOS | Phone data extraction |

---

## Resources

- Official ADB Documentation: https://developer.android.com/studio/command-line/adb
- Homebrew: https://brew.sh/
- Platform Tools Download: https://developer.android.com/studio/releases/platform-tools
- XDA Developers ADB Guide: https://www.xda-developers.com/adb/