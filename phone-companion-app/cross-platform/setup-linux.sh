#!/bin/bash
# NexusDocs Camera Streamer - Linux Setup

echo "🔧 Setting up NexusDocs Camera Streamer for Linux..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Install with: sudo apt install python3"
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Install system dependencies (Ubuntu/Debian)
if command -v apt &> /dev/null; then
    echo "📦 Installing system packages..."
    sudo apt update
    sudo apt install -y python3-pip python3-venv libgl1-mesa-glx
fi

# Install Python packages
echo "`n📦 Installing Python packages..."
python3 -m pip install --upgrade pip
python3 -m pip install opencv-python
python3 -m pip install websockets
python3 -m pip install numpy

# Make script executable
chmod +x camera-streamer.py

# Create systemd service for auto-start
echo "`n🔄 Creating systemd service..."
sudo bash -c "cat > /etc/systemd/system/nexusdocs-camera.service << 'EOF'
[Unit]
Description=NexusDocs Camera Streamer
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(which python3) $(pwd)/camera-streamer.py --server ws://localhost:8080 --device-id linux-cam
Restart=always

[Install]
WantedBy=multi-user.target
EOF
"

echo "`n✅ Setup complete!"
echo ""
echo "📝 Usage:"
echo "   python3 camera-streamer.py --server ws://YOUR_SERVER_IP:8080 --device-id my-camera"
echo ""
echo "🔄 Auto-start service:"
echo "   sudo systemctl enable nexusdocs-camera"
echo "   sudo systemctl start nexusdocs-camera"
