#!/usr/bin/env bash
#
# Wireless ADB Setup Script for Linux/macOS
# 
# Sets up wireless ADB connection to Android device without requiring root access.
# Guides through USB debugging setup, enables wireless ADB, and saves connection config.
#
# Usage: ./wireless-adb-setup.sh [--config <path>]
#
# Requirements: ADB (Android Debug Bridge) installed
# Run as: Standard user (no root required)

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Default config path
CONFIG_PATH="$(dirname "$0")/adb-config.json"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --config)
            CONFIG_PATH="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Functions
log_step() {
    echo -e "\n${CYAN}[STEP]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_info() {
    echo -e "${WHITE}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux" ;;
        Darwin*)    echo "macos" ;;
        *)          echo "unknown" ;;
    esac
}

# Check if ADB is installed
check_adb_installed() {
    log_step "Checking ADB installation..."
    
    if command -v adb &> /dev/null; then
        local version
        version=$(adb version 2>&1 | head -1)
        log_success "ADB is installed"
        log_info "$version"
        return 0
    else
        log_warn "ADB not found in PATH"
        return 1
    fi
}

# Show ADB installation instructions
show_install_instructions() {
    local os="$1"
    echo ""
    echo "ADB is not installed. Please install it:"
    echo ""
    
    case "$os" in
        linux)
            echo "  # Ubuntu/Debian:"
            echo "  sudo apt install adb"
            echo ""
            echo "  # Fedora:"
            echo "  sudo dnf install android-tools"
            echo ""
            echo "  # Arch Linux:"
            echo "  sudo pacman -S android-tools"
            ;;
        macos)
            echo "  # Using Homebrew:"
            echo "  brew install --cask android-platform-tools"
            echo ""
            echo "  # Or download from:"
            echo "  https://developer.android.com/studio/releases/platform-tools"
            ;;
    esac
    
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
}

# Get connected USB device
get_usb_device() {
    local devices
    devices=$(adb devices 2>&1)
    
    # Look for USB device (not IP:port)
    local usb_serial
    usb_serial=$(echo "$devices" | grep -E "^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)?\s+device$" | head -1 | awk '{print $1}')
    
    if [[ -n "$usb_serial" ]]; then
        echo "$usb_serial"
        return 0
    fi
    return 1
}

# Guide user through USB debugging setup
setup_usb_debugging() {
    log_step "Setting up USB debugging on your phone..."
    
    echo ""
    echo "To enable USB debugging:"
    echo "  1. Go to Settings > About Phone"
    echo "  2. Tap 'Build Number' 7 times to enable Developer Options"
    echo "  3. Go to Settings > System > Developer Options (or Settings > Developer Options)"
    echo "  4. Enable 'USB Debugging'"
    echo "  5. Connect your phone to this computer via USB"
    echo "  6. On your phone, tap 'Allow' when prompted to trust this computer"
    echo ""
    
    read -p "Press Enter when your phone is connected via USB and USB Debugging is enabled..."
    
    log_step "Detecting USB-connected device..."
    
    local device_serial
    if device_serial=$(get_usb_device); then
        log_success "Connected to device: $device_serial"
        echo "$device_serial"
    else
        log_warn "No USB device found. Make sure:"
        echo "  - USB Debugging is enabled on your phone"
        echo "  - Your phone is connected via USB"
        echo "  - You authorized this computer on your phone"
        echo ""
        
        read -p "Retry? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            setup_usb_debugging
        else
            log_error "No USB device detected"
            exit 1
        fi
    fi
}

# Get phone IP address
get_phone_ip() {
    local serial="$1"
    
    log_step "Getting phone IP address..."
    
    # Method 1: ip addr show wlan0
    local ip_output
    ip_output=$(adb -s "$serial" shell "ip addr show wlan0" 2>&1)
    
    if [[ $? -eq 0 ]]; then
        local ip
        ip=$(echo "$ip_output" | grep -oP 'inet \K[0-9.]+' | head -1)
        if [[ -n "$ip" ]]; then
            log_success "Phone IP: $ip"
            echo "$ip"
            return 0
        fi
    fi
    
    # Method 2: netcfg
    ip_output=$(adb -s "$serial" shell "netcfg" 2>&1)
    ip=$(echo "$ip_output" | grep -oP 'wlan0\s+up\s+\K[0-9.]+' | head -1)
    if [[ -n "$ip" ]]; then
        log_success "Phone IP: $ip"
        echo "$ip"
        return 0
    fi
    
    # Method 3: ifconfig
    ip_output=$(adb -s "$serial" shell "ifconfig wlan0" 2>&1)
    ip=$(echo "$ip_output" | grep -oP 'inet \K[0-9.]+' | head -1)
    if [[ -n "$ip" ]]; then
        log_success "Phone IP: $ip"
        echo "$ip"
        return 0
    fi
    
    # Fallback: Manual entry
    echo ""
    log_warn "Could not automatically detect IP. Please check your phone:"
    echo "  Go to Settings > Network & Internet > Wi-Fi > [Connected Network]"
    echo "  Or Settings > Connections > Wi-Fi > [Connected Network]"
    echo ""
    read -p "Enter your phone's IP address (e.g., 192.168.1.100): " ip
    
    echo "$ip"
}

# Enable wireless ADB
enable_wireless_adb() {
    local serial="$1"
    local ip="$2"
    
    log_step "Enabling wireless ADB on port 5555..."
    
    adb -s "$serial" tcpip 5555 2>&1
    
    if [[ $? -ne 0 ]]; then
        log_error "Failed to enable wireless ADB"
        exit 1
    fi
    
    log_success "Wireless ADB enabled on port 5555"
    sleep 2
    
    echo "${ip}:5555"
}

# Connect wirelessly
connect_wireless() {
    local address="$1"
    
    log_step "Connecting wirelessly to $address..."
    
    adb connect "$address" 2>&1
    
    if [[ $? -ne 0 ]]; then
        log_error "Failed to connect wirelessly"
        exit 1
    fi
    
    sleep 2
    
    # Verify connection
    local devices
    devices=$(adb devices 2>&1)
    
    if echo "$devices" | grep -q "^${address}\s+device$"; then
        log_success "Connected wirelessly to $address"
        return 0
    else
        log_warn "Connection may have failed. Checking devices..."
        echo "$devices"
        return 1
    fi
}

# Save configuration to JSON
save_config() {
    local ip="$1"
    local port="$2"
    local config_path="$3"
    
    log_step "Saving connection configuration..."
    
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Create JSON using printf for portability
    printf '{"device_ip": "%s", "device_port": %d, "full_address": "%s:%d", "created_at": "%s", "last_used": "%s"}' \
        "$ip" "$port" "$ip" "$port" "$timestamp" "$timestamp" > "$config_path"
    
    log_success "Configuration saved to: $config_path"
}

# Show reconnect instructions
show_reconnect_instructions() {
    local ip="$1"
    
    echo ""
    echo "========================================"
    echo -e "${GREEN}WIRELESS ADB SETUP COMPLETE!${NC}"
    echo "========================================"
    echo ""
    echo "To reconnect in the future (after rebooting phone or disconnecting):"
    echo ""
    echo "  adb connect ${ip}:5555"
    echo ""
    echo "Or use the saved config:"
    echo "  adb connect $CONFIG_PATH"
    echo ""
    echo "To disconnect:"
    echo "  adb disconnect ${ip}:5555"
    echo ""
    echo "To see connected devices:"
    echo "  adb devices"
    echo ""
    echo "To use ADB with the device:"
    echo "  adb -s ${ip}:5555 <command>"
    echo ""
    echo "========================================"
    echo ""
    echo "NOTE: Wireless ADB will persist until:"
    echo "  - You restart your phone"
    echo "  - You disable Developer Options > Wireless Debugging"
    echo "  - You factory reset your phone"
    echo ""
    echo "To revert to USB-only:"
    echo "  adb -s ${ip}:5555 usb"
    echo ""
}

# Main execution
main() {
    echo ""
    echo "========================================"
    echo -e "${CYAN}  WIRELESS ADB SETUP SCRIPT${NC}"
    echo -e "${CYAN}  For Linux/macOS${NC}"
    echo "========================================"
    echo ""
    
    local os
    os=$(detect_os)
    log_info "Detected OS: $os"
    
    # Check if ADB is installed
    if ! check_adb_installed; then
        show_install_instructions "$os"
    fi
    
    # Start ADB server
    log_step "Starting ADB server..."
    adb start-server 2>&1 | grep -v "^daemon" || true
    log_success "ADB server started"
    
    # Setup USB debugging and get device
    local serial
    serial=$(setup_usb_debugging)
    
    # Get phone IP
    local phone_ip
    phone_ip=$(get_phone_ip "$serial")
    
    # Enable wireless ADB
    local wireless_address
    wireless_address=$(enable_wireless_adb "$serial" "$phone_ip")
    
    # Connect wirelessly
    if connect_wireless "$wireless_address"; then
        # Save config
        save_config "$phone_ip" 5555 "$CONFIG_PATH"
        
        # Show instructions
        show_reconnect_instructions "$phone_ip"
    else
        log_warn "Wireless connection may not have succeeded"
        echo "Try: adb connect ${phone_ip}:5555"
    fi
}

# Run main
main "$@"