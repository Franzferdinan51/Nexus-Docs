#!/bin/bash

echo "============================================"
echo "Building NexusDocs Phone Companion for macOS"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Or use: brew install node"
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

# Check for Xcode Command Line Tools
if ! xcode-select -v &> /dev/null; then
    echo "Xcode Command Line Tools not found."
    echo "Installing..."
    xcode-select --install
fi

echo ""
echo "Building macOS DMG..."
echo ""
npm run build:mac

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
echo "You can find your macOS DMG in the dist folder."
echo ""

# Code signing (optional, requires Apple Developer ID)
echo "Note: For distribution, you may want to code-sign the app."
echo "See: https://www.electron.build/code-signing"
echo ""
