#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Wireless ADB Setup Script for Windows
.DESCRIPTION
    Sets up wireless ADB connection to Android device without requiring root access.
    Guides through USB debugging setup, enables wireless ADB, and saves connection config.
.NOTES
    Requires: ADB (Android Debug Bridge) installed
    Run as: Standard user (no admin/root required)
#>

[CmdletBinding()]
param(
    [string]$ConfigPath = "$PSScriptRoot\adb-config.json"
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n[STEP] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Gray
}

function Test-AdbInstalled {
    Write-Step "Checking ADB installation..."
    
    try {
        $adbVersion = & adb version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "ADB is installed"
            Write-Info $adbVersion[0]
            return $true
        }
    }
    catch {
        Write-Warn "ADB not found in PATH"
    }
    
    Write-Host "`nADB is not installed. Please install it:" -ForegroundColor Yellow
    Write-Host "  1. Download Android SDK Platform Tools: https://developer.android.com/studio/releases/platform-tools"
    Write-Host "  2. Extract to a folder (e.g., C:\adb)"
    Write-Host "  3. Add that folder to your PATH environment variable"
    Write-Host "`nOr use Chocolatey: choco install adb"
    
    $installChoice = Read-Host "`nContinue anyway? (y/n)"
    if ($installChoice -ne 'y') {
        exit 1
    }
    return $false
}

function Get-AdbDevices {
    $devices = & adb devices 2>&1
    return $devices | Select-String -Pattern "^([0-9.]+):(\d+)\s+device$" | ForEach-Object {
        $match = $_.Line -match '^(?<ip>[0-9.]+):(?<port>\d+)\s+device$'
        if ($match) {
            [PSCustomObject]@{
                IP = $matches.ip
                Port = $matches.port
            }
        }
    }
}

function Connect-USBAndEnableWireless {
    Write-Step "Setting up USB debugging on your phone..."
    
    Write-Host @"

To enable USB debugging:
1. Go to Settings > About Phone
2. Tap "Build Number" 7 times to enable Developer Options
3. Go to Settings > Developer Options
4. Enable "USB Debugging"
5. Connect your phone to this computer via USB
6. On your phone, tap "Allow" when prompted to trust this computer

"@ -ForegroundColor White
    
    Write-Host "Press any key when your phone is connected via USB and USB Debugging is enabled..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    Write-Step "Detecting USB-connected device..."
    
    $devices = & adb devices 2>&1
    $usbDevice = $devices | Select-String -Pattern "^([a-zA-Z0-9]+)\s+device$"
    
    if (-not $usbDevice) {
        Write-Warn "No USB device found. Make sure:"
        Write-Host "  - USB Debugging is enabled on your phone"
        Write-Host "  - Your phone is connected via USB"
        Write-Host "  - You authorized this computer on your phone"
        
        $retry = Read-Host "`nRetry? (y/n)"
        if ($retry -eq 'y') {
            return Connect-USBAndEnableWireless
        }
        throw "No USB device detected"
    }
    
    $deviceSerial = ($usbDevice.Line -split '\s+')[0]
    Write-Success "Connected to device: $deviceSerial"
    
    return $deviceSerial
}

function Get-PhoneIPAddress {
    param([string]$Serial)
    
    Write-Step "Getting phone IP address..."
    
    # Try different methods to get IP
    $ipOutput = & adb -s $Serial shell "ip addr show wlan0" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $ipMatch = $ipOutput | Select-String -Pattern 'inet\s+([0-9.]+)'
        if ($ipMatch) {
            $ip = ($ipMatch.Line -split '\s+')[1] -split '/'[0]
            Write-Success "Phone IP: $ip"
            return $ip
        }
    }
    
    # Fallback: try netcfg
    $ipOutput = & adb -s $Serial shell "netcfg" 2>&1
    $ipMatch = $ipOutput | Select-String -Pattern 'wlan0\s+up\s+([0-9.]+)'
    if ($ipMatch) {
        $ip = ($ipMatch.Line -split '\s+')[2]
        Write-Success "Phone IP: $ip"
        return $ip
    }
    
    Write-Host "`nCould not automatically detect IP. Please check your phone:" -ForegroundColor Yellow
    Write-Host "  Go to Settings > Network & Internet > Wi-Fi > [Connected Network]"
    Write-Host "  Or Settings > Connections > Wi-Fi > [Connected Network]"
    $manualIP = Read-Host "Enter your phone's IP address (e.g., 192.168.1.100)"
    
    return $manualIP
}

function Enable-WirelessADB {
    param(
        [string]$Serial,
        [string]$IP
    )
    
    Write-Step "Enabling wireless ADB on port 5555..."
    
    & adb -s $Serial tcpip 5555 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to enable wireless ADB"
    }
    
    Write-Success "Wireless ADB enabled on port 5555"
    Start-Sleep -Seconds 2
    
    return "$IP`:5555"
}

function Connect-Wireless {
    param([string]$Address)
    
    Write-Step "Connecting wirelessly to $Address..."
    
    & adb connect $Address 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to connect wirelessly"
    }
    
    Start-Sleep -Seconds 2
    
    # Verify connection
    $devices = & adb devices 2>&1
    $wirelessDevice = $devices | Select-String -Pattern "^$Address\s+device$"
    
    if ($wirelessDevice) {
        Write-Success "Connected wirelessly to $Address"
        return $true
    }
    else {
        Write-Warn "Connection may have failed. Checking devices..."
        $devices | ForEach-Object { Write-Host $_ }
        return $false
    }
}

function Save-Config {
    param(
        [string]$IP,
        [int]$Port,
        [string]$ConfigPath
    )
    
    Write-Step "Saving connection configuration..."
    
    $config = @{
        device_ip = $IP
        device_port = $Port
        full_address = "$IP`:$Port"
        created_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
        last_used = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
    } | ConvertTo-Json -Depth 3
    
    $config | Out-File -FilePath $ConfigPath -Encoding UTF8
    
    Write-Success "Configuration saved to: $ConfigPath"
}

function Show-ReconnectInstructions {
    param([string]$IP)
    
    Write-Host @"

========================================
WIRELESS ADB SETUP COMPLETE!
========================================

To reconnect in the future (after rebooting phone or disconnecting):

  adb connect $IP`:5555

Or use the saved config:
  adb connect `$PSScriptRoot\adb-config.json

To disconnect:
  adb disconnect $IP`:5555

To see connected devices:
  adb devices

To use ADB with the device:
  adb -s $IP`:5555 <command>

========================================

NOTE: Wireless ADB will persist until:
  - You restart your phone
  - You disable Developer Options > Wireless Debugging
  - You factory reset your phone

To revert to USB-only:
  adb -s $IP`:5555 usb

"@ -ForegroundColor Green
}

# ========================================
# MAIN EXECUTION
# ========================================

Write-Host @"

========================================
  WIRELESS ADB SETUP SCRIPT
  For Windows (PowerShell)
========================================

"@ -ForegroundColor Magenta

# Check if ADB is installed
$adbAvailable = Test-AdbInstalled

# Start ADB server if not running
if ($adbAvailable) {
    Write-Step "Starting ADB server..."
    & adb start-server 2>&1 | Out-Null
    Write-Success "ADB server started"
}

# Connect USB and enable wireless
try {
    $serial = Connect-USBAndEnableWireless
    
    # Get phone IP
    $phoneIP = Get-PhoneIPAddress -Serial $serial
    
    # Enable wireless ADB
    $wirelessAddress = Enable-WirelessADB -Serial $serial -IP $phoneIP
    
    # Connect wirelessly
    $connected = Connect-Wireless -Address $wirelessAddress
    
    if ($connected) {
        # Save config
        $port = 5555
        Save-Config -IP $phoneIP -Port $port -ConfigPath $ConfigPath
        
        # Show instructions
        Show-ReconnectInstructions -IP $phoneIP
    }
    else {
        Write-Warn "Wireless connection may not have succeeded"
        Write-Host "Try: adb connect $phoneIP`:5555"
    }
}
catch {
    Write-Error "Setup failed: $_"
    exit 1
}

exit 0