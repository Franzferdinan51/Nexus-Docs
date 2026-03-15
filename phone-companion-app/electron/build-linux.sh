#!/bin/bash

echo "============================================"
echo "Building NexusDocs Phone Companion for Linux"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Or use: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

echo "Node.js version:"
node --version
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "npm version:"
npm --version
echo ""

# Install dependencies
echo "Installing dependencies..."
echo ""
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to install dependencies!"
    exit 1
fi

echo ""
echo "Dependencies installed successfully!"
echo ""

# Install additional build tools if needed
echo "Checking for build tools..."
if ! command -v make &> /dev/null || ! command -v g++ &> /dev/null; then
    echo "Installing build-essential..."
    sudo apt-get update
    sudo apt-get install -y build-essential
fi

# Install OpenCV dependencies
echo "Installing OpenCV dependencies..."
sudo apt-get install -y libopencv-dev python3-opencv

echo ""
echo "Building Linux AppImage..."
echo ""
npm run build:linux

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Build failed!"
    echo "Check the error messages above."
    exit 1
fi

echo ""
echo "============================================"
echo "Build completed successfully!"
echo "============================================"
echo ""
echo "Output directory: dist/"
echo ""
echo "You can find your Linux AppImage in the dist folder."
echo "Make it executable with: chmod +x dist/*.AppImage"
echo ""
