#!/bin/bash
# NexusDocs Wireless ADB Setup
# Enables wireless ADB for phone forensics WITHOUT root

set -e

echo "🔧 NexusDocs Wireless ADB Setup"
echo "================================"
echo ""

# Check if ADB is installed
if ! command -v adb &> /dev/null; then
    echo "❌ ADB not found. Install Android SDK Platform Tools:"
    echo "   Ubuntu: sudo apt install adb"
    echo "   macOS:  brew install android-platform-tools"
    echo "   Windows: Download from https://developer.android.com/studio/releases/platform-tools"
    exit 1
fi

echo "✅ ADB found: $(adb version | head -1)"
echo ""

# Step 1: Connect via USB first
echo "📱 Step 1: Connect phone via USB"
echo "   1. Connect your phone to computer via USB cable"
echo "   2. On phone, go to Settings → About Phone"
echo "   3. Tap 'Build Number' 7 times to enable Developer Options"
echo "   4. Go to Settings → Developer Options"
echo "   5. Enable 'USB Debugging'"
echo ""
read -p "Press Enter when ready..."

# List connected devices
echo ""
echo "📋 Connected devices:"
adb devices

# Get device serial
DEVICE=$(adb devices | grep -v "List" | grep "device" | head -1 | awk '{print $1}')

if [ -z "$DEVICE" ]; then
    echo "❌ No device found. Check USB connection and USB debugging."
    exit 1
fi

echo ""
echo "✅ Found device: $DEVICE"

# Step 2: Enable TCP/IP mode
echo ""
echo "🔌 Step 2: Enabling TCP/IP mode (port 5555)..."
adb -s $DEVICE tcpip 5555

sleep 2

# Step 3: Get phone's IP address
echo ""
echo "🌐 Step 3: Getting phone's IP address..."
PHONE_IP=$(adb -s $DEVICE shell ip addr show wlan0 | grep "inet " | awk '{print $2}' | cut -d/ -f1)

if [ -z "$PHONE_IP" ]; then
    # Try alternative method
    PHONE_IP=$(adb -s $DEVICE shell ifconfig wlan0 | grep "inet addr" | cut -d: -f2 | awk '{print $1}')
fi

if [ -z "$PHONE_IP" ]; then
    echo "⚠️ Could not auto-detect IP. Please enter manually:"
    read -p "Phone IP address: " PHONE_IP
fi

echo "✅ Phone IP: $PHONE_IP"

# Step 4: Disconnect USB and connect wirelessly
echo ""
echo "📡 Step 4: Connecting wirelessly..."
echo "   You can now disconnect the USB cable!"
echo ""
read -p "Disconnect USB and press Enter..."

# Connect wirelessly
adb connect $PHONE_IP:5555

# Verify connection
echo ""
echo "📋 Verifying wireless connection:"
adb devices

# Check if wireless connection succeeded
if adb -s $PHONE_IP:5555 shell getprop ro.product.model &> /dev/null; then
    echo ""
    echo "✅ SUCCESS! Wireless ADB enabled!"
    echo ""
    echo "📝 Connection Details:"
    echo "   IP Address: $PHONE_IP:5555"
    echo "   Device ID:  $DEVICE"
    echo ""
    echo "💡 Future Connections:"
    echo "   adb connect $PHONE_IP:5555"
    echo ""
    echo "🔧 Test Commands:"
    echo "   adb -s $PHONE_IP:5555 shell getprop ro.product.model"
    echo "   adb -s $PHONE_IP:5555 shell content query --uri content://sms/"
    echo ""
    
    # Save connection for future use
    echo "$PHONE_IP:5555" > ~/.nexusdocs-phone-connection
    echo "💾 Connection saved to ~/.nexusdocs-phone-connection"
else
    echo ""
    echo "❌ Wireless connection failed. Try these steps:"
    echo "   1. Make sure phone and computer are on same WiFi"
    echo "   2. Check firewall settings"
    echo "   3. Reconnect USB and try again"
    echo "   4. Restart ADB: adb kill-server && adb start-server"
    exit 1
fi
