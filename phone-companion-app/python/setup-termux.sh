#!/bin/bash
# NexusDocs Camera Streamer - Termux Setup Script
# Run this on your Android phone in Termux

echo "🔧 Setting up NexusDocs Camera Streamer in Termux..."

# Update packages
pkg update -y
pkg upgrade -y

# Install Python and dependencies
pkg install python -y
pkg install clang -y
pkg install cmake -y
pkg install libjpeg-turbo -y

# Install Python packages
pip install --upgrade pip
pip install opencv-python
pip install websockets
pip install numpy

# Make script executable
chmod +x camera-streamer.py

echo ""
echo "✅ Setup complete!"
echo ""
echo "Usage:"
echo "  python camera-streamer.py --server ws://YOUR_SERVER_IP:8080 --device-id my-phone"
echo ""
echo "Example:"
echo "  python camera-streamer.py --server ws://192.168.1.100:8080 --device-id living-room"
