#!/usr/bin/env bash
#
# Phone Forensics Extraction Script for Linux/macOS
#
# Extracts data from Android device via ADB for forensics purposes.
# Exports contacts, call logs, SMS, and device info to CSV/JSON formats.
#
# Usage: ./phone-extract.sh [--output <dir>] [--format json|csv|both] [--device <ip:port>] [options]
#
# Options:
#   --all              Extract all data
#   --contacts        Extract contacts
#   --sms             Extract SMS messages
#   --calls           Extract call logs
#   --device-info     Extract device info
#   --apps            Extract installed apps
#   --photos          Extract photos metadata
#   --verbose         Verbose output
#
# Requirements: ADB installed, USB debugging enabled
# Run as: Standard user (no root required)

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Defaults
OUTPUT_DIR="$(dirname "$0")/extracted-data"
FORMAT="both"
DEVICE_ADDRESS=""
EXTRACT_ALL=false
EXTRACT_CONTACTS=false
EXTRACT_SMS=false
EXTRACT_CALLS=false
EXTRACT_DEVICE_INFO=false
EXTRACT_APPS=false
EXTRACT_PHOTOS=false
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --format)
            FORMAT="$2"
            shift 2
            ;;
        --device)
            DEVICE_ADDRESS="$2"
            shift 2
            ;;
        --all)
            EXTRACT_ALL=true
            shift
            ;;
        --contacts)
            EXTRACT_CONTACTS=true
            shift
            ;;
        --sms)
            EXTRACT_SMS=true
            shift
            ;;
        --calls)
            EXTRACT_CALLS=true
            shift
            ;;
        --device-info)
            EXTRACT_DEVICE_INFO=true
            shift
            ;;
        --apps)
            EXTRACT_APPS=true
            shift
            ;;
        --photos)
            EXTRACT_PHOTOS=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# If nothing specified, extract all
if [[ "$EXTRACT_ALL" == "false" && "$EXTRACT_CONTACTS" == "false" && "$EXTRACT_SMS" == "false" && "$EXTRACT_CALLS" == "false" && "$EXTRACT_DEVICE_INFO" == "false" && "$EXTRACT_APPS" == "false" && "$EXTRACT_PHOTOS" == "false" ]]; then
    EXTRACT_ALL=true
fi

# Set individual flags if --all
if [[ "$EXTRACT_ALL" == "true" ]]; then
    EXTRACT_CONTACTS=true
    EXTRACT_SMS=true
    EXTRACT_CALLS=true
    EXTRACT_DEVICE_INFO=true
    EXTRACT_APPS=true
    EXTRACT_PHOTOS=true
fi

# Helper functions
log_status() {
    echo -e "${CYAN}[EXTRACTING]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${WHITE}[VERBOSE]${NC} $1"
    fi
}

# Connect to device
connect_device() {
    if [[ -n "$DEVICE_ADDRESS" ]]; then
        echo "Connecting to $DEVICE_ADDRESS..."
        adb connect "$DEVICE_ADDRESS" 2>/dev/null
        sleep 2
    fi
    
    local devices
    devices=$(adb devices 2>&1)
    local device
    device=$(echo "$devices" | grep -E "^[0-9.:]+\s+device$" | head -1)
    
    if [[ -z "$device" ]]; then
        log_error "No device connected. Run wireless-adb-setup.sh first or connect via USB."
        exit 1
    fi
    
    local device_addr
    device_addr=$(echo "$device" | awk '{print $1}')
    log_success "Connected to: $device_addr"
    echo "$device_addr"
}

# Create output directory
init_output_dir() {
    if [[ -d "$OUTPUT_DIR" ]]; then
        log_verbose "Output directory exists: $OUTPUT_DIR"
    else
        mkdir -p "$OUTPUT_DIR"
        log_verbose "Created output directory: $OUTPUT_DIR"
    fi
}

# Export to JSON
export_json() {
    local data="$1"
    local filename="$2"
    local filepath="$OUTPUT_DIR/$filename"
    
    echo "$data" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2, ensure_ascii=False))" > "$filepath" 2>/dev/null || echo "$data" > "$filepath"
    log_success "Exported: $filepath"
}

# Export to CSV
export_csv() {
    local data="$1"
    local filename="$2"
    local filepath="$OUTPUT_DIR/$filename"
    
    echo "$data" > "$filepath"
    log_success "Exported: $filepath"
}

# Extract device info
extract_device_info() {
    log_status "Device Information..."
    
    local info_json
    info_json=$(cat <<EOF
{
    "model": "$(adb -s "$DEVICE_ADDRESS" shell getprop ro.product.model 2>/dev/null)",
    "manufacturer": "$(adb -s "$DEVICE_ADDRESS" shell getprop ro.product.manufacturer 2>/dev/null)",
    "brand": "$(adb -s "$DEVICE_ADDRESS" shell getprop ro.product.brand 2>/dev/null)",
    "device": "$(adb -s "$DEVICE_ADDRESS" shell getprop ro.product.device 2>/dev/null)",
    "android_version": "$(adb -s "$DEVICE_ADDRESS" shell getprop ro.build.version.release 2>/dev/null)",
    "sdk_version": "$(adb -s "$DEVICE_ADDRESS" shell getprop ro.build.version.sdk 2>/dev/null)",
    "security_patch": "$(adb -s "$DEVICE_ADDRESS" shell getprop ro.build.version.security_patch 2>/dev/null)",
    "serial": "$(adb -s "$DEVICE_ADDRESS" shell getprop ro.serialno 2>/dev/null)",
    "extracted_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)
    
    if [[ "$FORMAT" == "json" || "$FORMAT" == "both" ]]; then
        export_json "$info_json" "device-info.json"
    fi
    
    if [[ "$FORMAT" == "csv" || "$FORMAT" == "both" ]]; then
        local csv_data="property,value
model,$(adb -s "$DEVICE_ADDRESS" shell getprop ro.product.model 2>/dev/null)
manufacturer,$(adb -s "$DEVICE_ADDRESS" shell getprop ro.product.manufacturer 2>/dev/null)
brand,$(adb -s "$DEVICE_ADDRESS" shell getprop ro.product.brand 2>/dev/null)
device,$(adb -s "$DEVICE_ADDRESS" shell getprop ro.product.device 2>/dev/null)
android_version,$(adb -s "$DEVICE_ADDRESS" shell getprop ro.build.version.release 2>/dev/null)
sdk_version,$(adb -s "$DEVICE_ADDRESS" shell getprop ro.build.version.sdk 2>/dev/null)
security_patch,$(adb -s "$DEVICE_ADDRESS" shell getprop ro.build.version.security_patch 2>/dev/null)
serial,$(adb -s "$DEVICE_ADDRESS" shell getprop ro.serialno 2>/dev/null)"
        export_csv "$csv_data" "device-info.csv"
    fi
}

# Extract contacts
extract_contacts() {
    log_status "Contacts..."
    
    local test
    test=$(adb -s "$DEVICE_ADDRESS" shell "content query --uri content://contacts/phones" 2>&1)
    
    if echo "$test" | grep -q "Error"; then
        log_warn "Cannot access contacts. May need permissions or device is encrypted."
        return
    fi
    
    local contacts_json="["
    local first=true
    
    # Get contacts
    local raw
    raw=$(adb -s "$DEVICE_ADDRESS" shell "content query --uri content://contacts/phones" 2>&1)
    
    while IFS= read -r line; do
        if [[ "$line" =~ _id=([^,]+).*name=([^,]+).*number=([^,]+) ]]; then
            local id="${BASH_REMATCH[1]}"
            local name="${BASH_REMATCH[2]}"
            local number="${BASH_REMATCH[3]}"
            
            if [[ "$first" == "true" ]]; then
                first=false
            else
                contacts_json+=","
            fi
            
            contacts_json+=$(cat <<EOF
{"id": "$id", "name": "$name", "phone": "$number"}
EOF
)
        fi
    done <<< "$raw"
    
    contacts_json+="]"
    
    if [[ "$FORMAT" == "json" || "$FORMAT" == "both" ]]; then
        export_json "$contacts_json" "contacts.json"
    fi
    
    if [[ "$FORMAT" == "csv" || "$FORMAT" == "both" ]]; then
        local csv_data="id,name,phone
$(echo "$contacts_json" | python3 -c "import sys, json; data=json.load(sys.stdin); [print(f\"{c['id']},{c.get('name','')},{c.get('phone','')}\") for c in data]" 2>/dev/null || echo "No contacts found")"
        export_csv "$csv_data" "contacts.csv"
    fi
    
    log_success "Extracted contacts"
}

# Extract SMS
extract_sms() {
    log_status "SMS Messages..."
    
    local test
    test=$(adb -s "$DEVICE_ADDRESS" shell "content query --uri content://sms" 2>&1)
    
    if echo "$test" | grep -q "Error"; then
        log_warn "Cannot access SMS. May need permissions."
        return
    fi
    
    local messages_json="["
    local first=true
    
    local raw
    raw=$(adb -s "$DEVICE_ADDRESS" shell "content query --uri content://sms" 2>&1)
    
    while IFS= read -r line; do
        if [[ "$line" =~ _id=([^,]+).*address=([^,]+).*date=([^,]+).*type=([^,]+).*body=([^$]+) ]]; then
            local id="${BASH_REMATCH[1]}"
            local address="${BASH_REMATCH[2]}"
            local date="${BASH_REMATCH[3]}"
            local type="${BASH_REMATCH[4]}"
            local body="${BASH_REMATCH[5]}"
            
            # Map type to readable
            local type_readable
            case "$type" in
                1) type_readable="Inbox" ;;
                2) type_readable="Sent" ;;
                3) type_readable="Draft" ;;
                *) type_readable="Unknown" ;;
            esac
            
            if [[ "$first" == "true" ]]; then
                first=false
            else
                messages_json+=","
            fi
            
            messages_json+=$(cat <<EOF
{"id": "$id", "address": "$address", "date": "$date", "type": "$type_readable", "body": "$body"}
EOF
)
        fi
    done <<< "$raw"
    
    messages_json+="]"
    
    if [[ "$FORMAT" == "json" || "$FORMAT" == "both" ]]; then
        export_json "$messages_json" "sms.json"
    fi
    
    log_success "Extracted SMS messages"
}

# Extract call logs
extract_call_logs() {
    log_status "Call Logs..."
    
    local test
    test=$(adb -s "$DEVICE_ADDRESS" shell "content query --uri content://call_log/calls" 2>&1)
    
    if echo "$test" | grep -q "Error"; then
        log_warn "Cannot access call logs. May need permissions."
        return
    fi
    
    local calls_json="["
    local first=true
    
    local raw
    raw=$(adb -s "$DEVICE_ADDRESS" shell "content query --uri content://call_log/calls" 2>&1)
    
    while IFS= read -r line; do
        if [[ "$line" =~ _id=([^,]+).*number=([^,]+).*date=([^,]+).*duration=([^,]+).*type=([^$]+) ]]; then
            local id="${BASH_REMATCH[1]}"
            local number="${BASH_REMATCH[2]}"
            local date="${BASH_REMATCH[3]}"
            local duration="${BASH_REMATCH[4]}"
            local type="${BASH_REMATCH[5]}"
            
            # Map type to readable
            local type_readable
            case "$type" in
                1) type_readable="Incoming" ;;
                2) type_readable="Outgoing" ;;
                3) type_readable="Missed" ;;
                *) type_readable="Unknown" ;;
            esac
            
            if [[ "$first" == "true" ]]; then
                first=false
            else
                calls_json+=","
            fi
            
            calls_json+=$(cat <<EOF
{"id": "$id", "number": "$number", "date": "$date", "duration": "$duration", "type": "$type_readable"}
EOF
)
        fi
    done <<< "$raw"
    
    calls_json+="]"
    
    if [[ "$FORMAT" == "json" || "$FORMAT" == "both" ]]; then
        export_json "$calls_json" "call-logs.json"
    fi
    
    log_success "Extracted call logs"
}

# Extract installed apps
extract_apps() {
    log_status "Installed Apps..."
    
    local apps_json="["
    local first=true
    
    # System apps
    local raw
    raw=$(adb -s "$DEVICE_ADDRESS" shell "pm list packages -s" 2>&1)
    
    while IFS= read -r line; do
        if [[ "$line" =~ package:(.+) ]]; then
            local pkg="${BASH_REMATCH[1]}"
            
            if [[ "$first" == "true" ]]; then
                first=false
            else
                apps_json+=","
            fi
            
            apps_json+="{\"package\": \"$pkg\", \"type\": \"system\"}"
        fi
    done <<< "$raw"
    
    # User apps
    raw=$(adb -s "$DEVICE_ADDRESS" shell "pm list packages -3" 2>&1)
    
    while IFS= read -r line; do
        if [[ "$line" =~ package:(.+) ]]; then
            local pkg="${BASH_REMATCH[1]}"
            
            if [[ "$first" == "true" ]]; then
                first=false
            else
                apps_json+=","
            fi
            
            apps_json+="{\"package\": \"$pkg\", \"type\": \"user\"}"
        fi
    done <<< "$raw"
    
    apps_json+="]"
    
    if [[ "$FORMAT" == "json" || "$FORMAT" == "both" ]]; then
        export_json "$apps_json" "installed-apps.json"
    fi
    
    local count
    count=$(echo "$apps_json" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
    log_success "Extracted $count installed apps"
}

# Extract photos metadata
extract_photos() {
    log_status "Photos (metadata only)..."
    
    local photos_json="["
    
    local dcim_count
    dcim_count=$(adb -s "$DEVICE_ADDRESS" shell "ls /sdcard/DCIM/Camera/ 2>/dev/null | wc -l" 2>&1)
    local download_count
    download_count=$(adb -s "$DEVICE_ADDRESS" shell "ls /sdcard/Download/ 2>/dev/null | wc -l" 2>&1)
    local pictures_count
    pictures_count=$(adb -s "$DEVICE_ADDRESS" shell "ls /sdcard/Pictures/ 2>/dev/null | wc -l" 2>&1)
    
    photos_json+=$(cat <<EOF
{"location": "DCIM/Camera", "file_count": $dcim_count},
{"location": "Download", "file_count": $download_count},
{"location": "Pictures", "file_count": $pictures_count}
EOF
)
    
    photos_json+="]"
    
    if [[ "$FORMAT" == "json" || "$FORMAT" == "both" ]]; then
        export_json "$photos_json" "photos.json"
    fi
    
    log_success "Extracted photo metadata"
}

# Main execution
main() {
    echo ""
    echo "========================================"
    echo -e "${CYAN}  PHONE EXTRACTION SCRIPT${NC}"
    echo -e "${CYAN}  Forensics Data Extractor (Linux/macOS)${NC}"
    echo "========================================"
    echo ""
    
    echo "Output Directory: $OUTPUT_DIR"
    echo "Export Format: $FORMAT"
    echo ""
    
    # Connect to device
    DEVICE_ADDRESS=$(connect_device)
    
    # Initialize output
    init_output_dir
    
    # Extract data
    echo ""
    echo "Starting extraction..." -ForegroundColor Yellow
    echo ""
    
    if [[ "$EXTRACT_DEVICE_INFO" == "true" ]]; then
        extract_device_info
    fi
    
    if [[ "$EXTRACT_CONTACTS" == "true" ]]; then
        extract_contacts
    fi
    
    if [[ "$EXTRACT_SMS" == "true" ]]; then
        extract_sms
    fi
    
    if [[ "$EXTRACT_CALLS" == "true" ]]; then
        extract_call_logs
    fi
    
    if [[ "$EXTRACT_APPS" == "true" ]]; then
        extract_apps
    fi
    
    if [[ "$EXTRACT_PHOTOS" == "true" ]]; then
        extract_photos
    fi
    
    echo ""
    echo "========================================"
    echo -e "${GREEN}EXTRACTION COMPLETE!${NC}"
    echo "========================================"
    echo ""
    echo "Data saved to: $OUTPUT_DIR"
    echo ""
    
    # Show summary
    ls -la "$OUTPUT_DIR" | tail -n +2 | while read -r line; do
        local size
        size=$(echo "$line" | awk '{print $5}')
        local name
        name=$(echo "$line" | awk '{print $9}')
        echo "  - $name ($(echo "scale=1; $size/1024" | bc) KB)"
    done
}

# Run main
main "$@"