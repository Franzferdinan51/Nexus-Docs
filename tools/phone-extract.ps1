#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Phone Forensics Extraction Script for Windows
.DESCRIPTION
    Extracts data from Android device via ADB for forensics purposes.
    Exports contacts, call logs, SMS, and device info to CSV/JSON formats.
.NOTES
    Requires: ADB installed, USB debugging enabled
    Run as: Standard user (no admin/root required)
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "$PSScriptRoot\extracted-data",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("json", "csv", "both")]
    [string]$Format = "both",
    
    [Parameter(Mandatory=$false)]
    [string]$DeviceAddress,
    
    [Parameter(Mandatory=$false)]
    [switch]$All,
    
    [Parameter(Mandatory=$false)]
    [switch]$Contacts,
    
    [Parameter(Mandatory=$false)]
    [switch]$Sms,
    
    [Parameter(Mandatory=$false)]
    [switch]$Calls,
    
    [Parameter(Mandatory=$false)]
    [switch]$DeviceInfo,
    
    [Parameter(Mandatory=$false)]
    [switch]$Apps,
    
    [Parameter(Mandatory=$false)]
    [switch]$Photos,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Setup UTF-8 output
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Determine what to extract
$ExtractContacts = $All -or $Contacts
$ExtractSms = $All -or $Sms
$ExtractCalls = $All -or $Calls
$ExtractDeviceInfo = $All -or $DeviceInfo
$ExtractApps = $All -or $Apps
$ExtractPhotos = $All -or $Photos

# If nothing specified, default to all
if (-not ($All -or $Contacts -or $Sms -or $Calls -or $DeviceInfo -or $Apps -or $Photos)) {
    $ExtractContacts = $true
    $ExtractSms = $true
    $ExtractCalls = $true
    $ExtractDeviceInfo = $true
    $ExtractApps = $true
    $ExtractPhotos = $true
}

# Helper functions
function Write-Status {
    param([string]$Message)
    Write-Host "[EXTracting] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-VerboseMsg {
    param([string]$Message)
    if ($Verbose) {
        Write-Host "[VERBOSE] $Message" -ForegroundColor Gray
    }
}

# Connect to device
function Connect-Device {
    if ($DeviceAddress) {
        Write-Host "Connecting to $DeviceAddress..." -ForegroundColor Yellow
        & adb connect $DeviceAddress 2>&1 | Out-Null
        Start-Sleep -Seconds 2
    }
    
    $devices = & adb devices 2>&1
    $device = $devices | Select-String -Pattern "^([0-9.:]+)\s+device$" | Select-Object -First 1
    
    if (-not $device) {
        throw "No device connected. Run wireless-adb-setup.ps1 first or connect via USB."
    }
    
    $deviceAddr = ($device.Line -split '\s+')[0]
    Write-Success "Connected to: $deviceAddr"
    return $deviceAddr
}

# Create output directory
function Initialize-OutputDir {
    if (Test-Path $OutputDir) {
        Write-VerboseMsg "Output directory exists: $OutputDir"
    }
    else {
        New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
        Write-VerboseMsg "Created output directory: $OutputDir"
    }
}

# Export to JSON
function Export-ToJson {
    param(
        [object]$Data,
        [string]$Filename
    )
    
    $path = Join-Path $OutputDir $Filename
    $Data | ConvertTo-Json -Depth 10 | Out-File -FilePath $path -Encoding UTF8
    Write-Success "Exported: $path"
}

# Export to CSV
function Export-ToCsv {
    param(
        [object]$Data,
        [string]$Filename
    )
    
    $path = Join-Path $OutputDir $Filename
    $Data | Export-Csv -Path $path -NoTypeInformation -Encoding UTF8
    Write-Success "Exported: $path"
}

# Extract device info
function Get-DeviceInfo {
    Write-Status "Device Information..."
    
    $info = @{}
    
    # Basic info
    $info.model = & adb -s $DeviceAddress shell "getprop ro.product.model" 2>&1
    $info.manufacturer = & adb -s $DeviceAddress shell "getprop ro.product.manufacturer" 2>&1
    $info.brand = & adb -s $DeviceAddress shell "getprop ro.product.brand" 2>&1
    $info.device = & adb -s $DeviceAddress shell "getprop ro.product.device" 2>&1
    $info.android_version = & adb -s $DeviceAddress shell "getprop ro.build.version.release" 2>&1
    $info.sdk_version = & adb -s $DeviceAddress shell "getprop ro.build.version.sdk" 2>&1
    $info.security_patch = & adb -s $DeviceAddress shell "getprop ro.build.version.security_patch" 2>&1
    $info.serial = & adb -s $DeviceAddress shell "getprop ro.serialno" 2>&1
    $info.imsi = & adb -s $DeviceAddress shell "getprop persist.radio.imei" 2>&1
    $info.phone_number = & adb -s $DeviceAddress shell "service call iphonesubinfo 1 | grep -o '[0-9a-f]\{8\} ' | tail -n 4 | sed 's/ //g' | xargs printf '%d\n' 2>&1" 2>&1
    
    # Storage info
    $df = & adb -s $DeviceAddress shell "df /data" 2>&1
    if ($df -match '(\d+)\s+(\d+)\s+(\d+)\s+(\d+)%') {
        $info.storage_total = [int]$matches[1] * 1024
        $info.storage_used = [int]$matches[2] * 1024
        $info.storage_free = [int]$matches[3] * 1024
    }
    
    # Battery info
    $battery = & adb -s $DeviceAddress shell "dumpsys battery" 2>&1
    if ($battery -match 'level:\s+(\d+)') { $info.battery_level = $matches[1] }
    if ($battery -match 'status:\s+(\d+)') { $info.battery_status = $matches[1] }
    if ($battery -match 'temperature:\s+([\d.]+)') { $info.battery_temp = $matches[1] }
    
    # Network info
    $ip = & adb -s $DeviceAddress shell "ip addr show wlan0" 2>&1 | Select-String -Pattern 'inet\s+([0-9.]+)'
    if ($ip) { $info.wifi_ip = ($ip.Line -split '\s+')[1] -split '/'[0] }
    
    $info.extracted_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
    
    if ($Format -eq "json" -or $Format -eq "both") {
        Export-ToJson -Data $info -Filename "device-info.json"
    }
    
    if ($Format -eq "csv" -or $Format -eq "both") {
        $info.GetEnumerator() | ForEach-Object {
            [PSCustomObject]@{ Property = $_.Key; Value = $_.Value }
        } | Export-ToCsv -Filename "device-info.csv"
    }
    
    return $info
}

# Extract contacts
function Get-Contacts {
    Write-Status "Contacts..."
    
    # Check if contacts provider exists
    $test = & adb -s $DeviceAddress shell "content query --uri content://contacts/phones" 2>&1
    
    if ($test -match "Error" -or $LASTEXITCODE -ne 0) {
        Write-Warn "Cannot access contacts. May need permissions or device is encrypted."
        return @()
    }
    
    $contacts = @()
    
    # Get contacts with phone numbers
    $raw = & adb -s $DeviceAddress shell "content query --uri content://contacts/phones --projection _id,name,number,primary_phone_type" 2>&1
    
    if ($raw) {
        foreach ($line in $raw -split "`n") {
            if ($line -match '_id=([^,]+).*name=([^,]+).*number=([^,]+)') {
                $contacts += [PSCustomObject]@{
                    id = $matches[1].Trim()
                    name = $matches[2].Trim()
                    phone = $matches[3].Trim()
                }
            }
        }
    }
    
    # Also get emails
    $raw = & adb -s $DeviceAddress shell "content query --uri content://contacts/emails --projection _id,name,address,type" 2>&1
    
    if ($raw) {
        foreach ($line in $raw -split "`n") {
            if ($line -match '_id=([^,]+).*name=([^,]+).*address=([^,]+)') {
                $contacts += [PSCustomObject]@{
                    id = $matches[1].Trim()
                    name = $matches[2].Trim()
                    email = $matches[3].Trim()
                }
            }
        }
    }
    
    if ($Format -eq "json" -or $Format -eq "both") {
        Export-ToJson -Data $contacts -Filename "contacts.json"
    }
    
    if ($Format -eq "csv" -or $Format -eq "both") {
        Export-ToCsv -Data $contacts -Filename "contacts.csv"
    }
    
    Write-Success "Extracted $($contacts.Count) contacts"
    return $contacts
}

# Extract SMS
function Get-SmsMessages {
    Write-Status "SMS Messages..."
    
    $test = & adb -s $DeviceAddress shell "content query --uri content://sms" 2>&1
    
    if ($test -match "Error" -or $LASTEXITCODE -ne 0) {
        Write-Warn "Cannot access SMS. May need permissions or device is encrypted."
        return @()
    }
    
    $messages = @()
    
    $raw = & adb -s $DeviceAddress shell "content query --uri content://sms --projection _id,address,date,type,body" 2>&1
    
    if ($raw) {
        foreach ($line in $raw -split "`n") {
            if ($line -match '_id=([^,]+).*address=([^,]+).*date=([^,]+).*type=([^,]+).*body=([^$]+)') {
                $typeMap = @{
                    "1" = "Inbox"
                    "2" = "Sent"
                    "3" = "Draft"
                    "4" = "Inbox"
                }
                $type = if ($typeMap.ContainsKey($matches[4].Trim())) { $typeMap[$matches[4].Trim()] } else { $matches[4].Trim() }
                
                $messages += [PSCustomObject]@{
                    id = $matches[1].Trim()
                    address = $matches[2].Trim()
                    date = $matches[3].Trim()
                    type = $type
                    body = $matches[5].Trim()
                }
            }
        }
    }
    
    if ($Format -eq "json" -or $Format -eq "both") {
        Export-ToJson -Data $messages -Filename "sms.json"
    }
    
    if ($Format -eq "csv" -or $Format -eq "both") {
        Export-ToCsv -Data $messages -Filename "sms.csv"
    }
    
    Write-Success "Extracted $($messages.Count) SMS messages"
    return $messages
}

# Extract call logs
function Get-CallLogs {
    Write-Status "Call Logs..."
    
    $test = & adb -s $DeviceAddress shell "content query --uri content://call_log/calls" 2>&1
    
    if ($test -match "Error" -or $LASTEXITCODE -ne 0) {
        Write-Warn "Cannot access call logs. May need permissions."
        return @()
    }
    
    $calls = @()
    
    $raw = & adb -s $DeviceAddress shell "content query --uri content://call_log/calls --projection _id,number,date,duration,type" 2>&1
    
    if ($raw) {
        foreach ($line in $raw -split "`n") {
            if ($line -match '_id=([^,]+).*number=([^,]+).*date=([^,]+).*duration=([^,]+).*type=([^$]+)') {
                $typeMap = @{
                    "1" = "Incoming"
                    "2" = "Outgoing"
                    "3" = "Missed"
                    "4" = "Voicemail"
                    "5" = "Rejected"
                    "6" = "Blocked"
                }
                $type = if ($typeMap.ContainsKey($matches[5].Trim())) { $typeMap[$matches[5].Trim()] } else { $matches[5].Trim() }
                
                $calls += [PSCustomObject]@{
                    id = $matches[1].Trim()
                    number = $matches[2].Trim()
                    date = $matches[3].Trim()
                    duration_seconds = $matches[4].Trim()
                    type = $type
                }
            }
        }
    }
    
    if ($Format -eq "json" -or $Format -eq "both") {
        Export-ToJson -Data $calls -Filename "call-logs.json"
    }
    
    if ($Format -eq "csv" -or $Format -eq "both") {
        Export-ToCsv -Data $calls -Filename "call-logs.csv"
    }
    
    Write-Success "Extracted $($calls.Count) call logs"
    return $calls
}

# Extract installed apps
function Get-InstalledApps {
    Write-Status "Installed Apps..."
    
    $apps = @()
    
    # System apps
    $raw = & adb -s $DeviceAddress shell "pm list packages -s" 2>&1
    
    if ($raw) {
        foreach ($line in $raw -split "`n") {
            if ($line -match 'package:(.+)') {
                $pkg = $matches[1]
                $apps += [PSCustomObject]@{
                    package = $pkg
                    type = "system"
                }
            }
        }
    }
    
    # User apps
    $raw = & adb -s $DeviceAddress shell "pm list packages -3" 2>&1
    
    if ($raw) {
        foreach ($line in $raw -split "`n") {
            if ($line -match 'package:(.+)') {
                $pkg = $matches[1]
                $apps += [PSCustomObject]@{
                    package = $pkg
                    type = "user"
                }
            }
        }
    }
    
    if ($Format -eq "json" -or $Format -eq "both") {
        Export-ToJson -Data $apps -Filename "installed-apps.json"
    }
    
    if ($Format -eq "csv" -or $Format -eq "both") {
        Export-ToCsv -Data $apps -Filename "installed-apps.csv"
    }
    
    Write-Success "Extracted $($apps.Count) installed apps"
    return $apps
}

# Extract photos metadata (not actual files)
function Get-PhotosMetadata {
    Write-Status "Photos (metadata only)..."
    
    $photos = @()
    
    # Get photo count
    $dcim = & adb -s $DeviceAddress shell "ls -la /sdcard/DCIM/Camera/ 2>/dev/null | wc -l" 2>&1
    $downloads = & adb -s $DeviceAddress shell "ls -la /sdcard/Download/ 2>/dev/null | wc -l" 2>&1
    $pictures = & adb -s $DeviceAddress shell "ls -la /sdcard/Pictures/ 2>/dev/null | wc -l" 2>&1
    
    $photos += [PSCustomObject]@{
        location = "DCIM/Camera"
        file_count = [int]$dcim.Trim() - 2  # Subtract . and ..
    }
    
    $photos += [PSCustomObject]@{
        location = "Download"
        file_count = [int]$downloads.Trim() - 2
    }
    
    $photos += [PSCustomObject]@{
        location = "Pictures"
        file_count = [int]$pictures.Trim() - 2
    }
    
    if ($Format -eq "json" -or $Format -eq "both") {
        Export-ToJson -Data $photos -Filename "photos.json"
    }
    
    if ($Format -eq "csv" -or $Format -eq "both") {
        Export-ToCsv -Data $photos -Filename "photos.csv"
    }
    
    Write-Success "Extracted photo metadata"
    return $photos
}

# Main execution
Write-Host @"

========================================
  PHONE EXTRACTION SCRIPT
  Forensics Data Extractor (Windows)
========================================

"@ -ForegroundColor Magenta

Write-Host "Output Directory: $OutputDir"
Write-Host "Export Format: $Format"
Write-Host ""

# Connect to device
$DeviceAddress = Connect-Device

# Initialize output
Initialize-OutputDir

# Extract data
Write-Host ""
Write-Host "Starting extraction..." -ForegroundColor Yellow
Write-Host ""

try {
    if ($ExtractDeviceInfo) {
        Get-DeviceInfo
    }
    
    if ($ExtractContacts) {
        Get-Contacts
    }
    
    if ($ExtractSms) {
        Get-SmsMessages
    }
    
    if ($ExtractCalls) {
        Get-CallLogs
    }
    
    if ($ExtractApps) {
        Get-InstalledApps
    }
    
    if ($ExtractPhotos) {
        Get-PhotosMetadata
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "EXTRACTION COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Data saved to: $OutputDir"
    Write-Host ""
    
    # Show summary
    Get-ChildItem $OutputDir | ForEach-Object {
        Write-Host "  - $($_.Name) ($([math]::Round($_.Length / 1KB, 1)) KB)"
    }
}
catch {
    Write-Error "Extraction failed: $_"
    exit 1
}

exit 0