#!/bin/bash
# NexusDocs Camera Streamer - macOS Setup

echo "🔧 Setting up NexusDocs Camera Streamer for macOS..."

# Check Homebrew
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Install from https://brew.sh"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "📦 Installing Python3..."
    brew install python3
fi

echo "✅ Python found: $(python3 --version)"

# Install Python packages
echo "`n📦 Installing Python packages..."
python3 -m pip install --upgrade pip
python3 -m pip install opencv-python
python3 -m pip install websockets
python3 -m pip install numpy

# Make script executable
chmod +x camera-streamer.py

# Create launchd agent for auto-start
LAUNCHD_PLIST="$HOME/Library/LaunchAgents/com.nexusdocs.camera.plist"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$LAUNCHD_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.nexusdocs.camera</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which python3)</string>
        <string>$(pwd)/camera-streamer.py</string>
        <string>--server</string>
        <string>ws://localhost:8080</string>
        <string>--device-id</string>
        <string>mac-cam</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

echo "`n✅ Setup complete!"
echo ""
echo "📝 Usage:"
echo "   python3 camera-streamer.py --server ws://YOUR_SERVER_IP:8080 --device-id my-camera"
echo ""
echo "🔄 Auto-start (launchd):"
echo "   launchctl load $LAUNCHD_PLIST"
echo "   launchctl unload $LAUNCHD_PLIST  # to stop"
