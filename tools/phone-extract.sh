#!/bin/bash
# NexusDocs Phone Forensics Extraction
# Extract data from Android phone WITHOUT root

set -e

echo "📱 NexusDocs Phone Forensics Extraction"
echo "========================================"
echo ""

# Load saved connection or get from user
if [ -f ~/.nexusdocs-phone-connection ]; then
    DEVICE=$(cat ~/.nexusdocs-phone-connection)
    echo "💾 Using saved connection: $DEVICE"
else
    echo "🔌 Connect to phone first:"
    echo "   ./wireless-adb-setup.sh"
    echo ""
    read -p "Enter phone IP:port (e.g., 192.168.1.100:5555): " DEVICE
fi

# Test connection
echo ""
echo "📡 Testing connection..."
if ! adb -s $DEVICE shell getprop ro.product.model &> /dev/null; then
    echo "❌ Cannot connect to $DEVICE"
    echo "   Run: adb connect $DEVICE"
    exit 1
fi

PHONE_MODEL=$(adb -s $DEVICE shell getprop ro.product.model)
PHONE_ANDROID=$(adb -s $DEVICE shell getprop ro.build.version.release)

echo "✅ Connected to: $PHONE_MODEL (Android $PHONE_ANDROID)"
echo ""

# Create output directory
OUTPUT_DIR="phone-extract-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTPUT_DIR"

echo "📁 Output directory: $OUTPUT_DIR"
echo ""

# Extract SMS
echo "📨 Extracting SMS messages..."
adb -s $DEVICE shell content query --uri content://sms/ --projection _id,address,body,date,type > "$OUTPUT_DIR/sms.txt" 2>/dev/null || echo "⚠️ SMS extraction failed (may need permission)"
echo "   Saved: $OUTPUT_DIR/sms.txt"

# Extract Call Logs
echo "📞 Extracting call logs..."
adb -s $DEVICE shell content query --uri content://call_log/calls --projection _id,number,date,duration,type > "$OUTPUT_DIR/call_logs.txt" 2>/dev/null || echo "⚠️ Call log extraction failed"
echo "   Saved: $OUTPUT_DIR/call_logs.txt"

# Extract Contacts
echo "👥 Extracting contacts..."
adb -s $DEVICE shell content query --uri content://contacts/phones --projection _id,data,name > "$OUTPUT_DIR/contacts.txt" 2>/dev/null || echo "⚠️ Contacts extraction failed"
echo "   Saved: $OUTPUT_DIR/contacts.txt"

# Extract Photos
echo "📸 Extracting photos..."
mkdir -p "$OUTPUT_DIR/photos"
adb -s $DEVICE pull /sdcard/DCIM/Camera/ "$OUTPUT_DIR/photos/" 2>/dev/null || echo "⚠️ Photo extraction failed (folder may not exist)"
echo "   Saved: $OUTPUT_DIR/photos/"

# Extract Downloads
echo "📥 Extracting downloads..."
mkdir -p "$OUTPUT_DIR/downloads"
adb -s $DEVICE pull /sdcard/Download/ "$OUTPUT_DIR/downloads/" 2>/dev/null || echo "⚠️ Downloads extraction failed"
echo "   Saved: $OUTPUT_DIR/downloads/"

# Extract Installed Apps
echo "📱 Extracting installed apps list..."
adb -s $DEVICE shell pm list packages -f > "$OUTPUT_DIR/installed_apps.txt"
echo "   Saved: $OUTPUT_DIR/installed_apps.txt"

# Extract Device Info
echo "💻 Extracting device info..."
adb -s $DEVICE shell getprop > "$OUTPUT_DIR/device_info.txt"
echo "   Saved: $OUTPUT_DIR/device_info.txt"

# Extract WiFi Networks
echo "📶 Extracting WiFi networks..."
adb -s $DEVICE shell dumpsys wifi > "$OUTPUT_DIR/wifi_info.txt" 2>/dev/null || echo "⚠️ WiFi info extraction failed"
echo "   Saved: $OUTPUT_DIR/wifi_info.txt"

# Summary
echo ""
echo "=========================================="
echo "✅ Extraction Complete!"
echo ""
echo "📁 Output: $OUTPUT_DIR/"
echo ""
echo "📊 Extracted:"
echo "   - SMS messages"
echo "   - Call logs"
echo "   - Contacts"
echo "   - Photos (DCIM/Camera)"
echo "   - Downloads"
echo "   - Installed apps"
echo "   - Device info"
echo "   - WiFi info"
echo ""
echo "💡 To convert to JSON:"
echo "   python3 -c \"import json; print(json.dumps(open('$OUTPUT_DIR/sms.txt').read()))\" > $OUTPUT_DIR/sms.json"
echo ""
echo "🔧 Useful Commands:"
echo "   adb -s $DEVICE shell content query --uri content://sms/inbox"
echo "   adb -s $DEVICE shell content query --uri content://call_log/calls"
echo "   adb -s $DEVICE shell pm list packages"
echo ""
