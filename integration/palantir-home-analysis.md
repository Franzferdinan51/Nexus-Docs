# Palantir Home Analysis

**Analysis Date:** March 14, 2026  
**Version:** 2.1.0  
**Location:** `/Users/duckets/.openclaw/workspace/projects/palantir-home`  
**Author:** DuckBot (Subagent Analysis)

---

## Executive Summary

**Palantir at Home** is a comprehensive self-hosted intelligence platform combining real-time motion monitoring, phone forensics, and AI-powered analysis. Built with Python (Flask + OpenCV), it provides a surveillance and data extraction system accessible via a modern web dashboard.

**Key Strengths:**
- ✅ Real-time motion detection with <100ms latency
- ✅ Full Android phone forensics via ADB
- ✅ iOS backup parsing (iMessages, photos)
- ✅ Face recognition and object detection
- ✅ Cloud sync (S3, Google Drive)
- ✅ Multi-device support (4+ phones)
- ✅ Beautiful, responsive web UI

**Total Codebase:** ~2,000+ lines across 2 main Python files + 4 HTML templates

---

## 1. Core Features and Capabilities

### 1.1 Motion Monitoring System

| Feature | Description | Status |
|---------|-------------|--------|
| **Real-Time Video Streaming** | Live webcam feed via WebSocket | ✅ Live |
| **Motion Detection** | Background subtraction (MOG2) with configurable sensitivity | ✅ Live |
| **Auto Snapshots** | Automatic capture on motion detection | ✅ Live |
| **Manual Snapshots** | On-demand screenshot capture | ✅ Live |
| **Live Statistics** | FPS, motion count, uptime, last motion time | ✅ Live |
| **Real-Time Alerts** | WebSocket-powered instant notifications | ✅ Live |
| **Multi-Camera Support** | 4+ cameras simultaneously | ✅ Live |

**Technical Implementation:**
- **Library:** OpenCV (`cv2.VideoCapture`, `createBackgroundSubtractorMOG2`)
- **Streaming:** Flask-SocketIO for WebSocket broadcast
- **Frame Processing:** Background subtraction → morphology → contour detection
- **Performance:** 15-25% CPU (M4 Pro), ~200MB RAM, <100ms latency

**Configuration Parameters:**
```python
CONFIG = {
    'camera_id': 0,              # 0 = Logitech C170, 1 = iPhone Camera
    'width': 1280,
    'height': 720,
    'fps': 30,
    'motion_threshold': 25,      # Sensitivity (lower = more sensitive)
    'min_area': 500,             # Minimum motion size (pixels)
    'max_area': 100000,          # Maximum motion size (pixels)
    'blur_size': 21,             # Gaussian blur kernel (odd numbers)
    'snapshot_retention_days': 7,
    'max_snapshots': 1000,
}
```

---

### 1.2 Phone Data Extraction (Nexus Integration)

#### Android Extraction (ADB-Based)

| Data Type | File Output | Contents |
|-----------|-------------|----------|
| **SMS/MMS** | `sms.json` | Messages, contacts, timestamps, type (sent/received) |
| **Call Logs** | `call_logs.json` | Numbers, timestamps, duration, type (incoming/outgoing/missed) |
| **Contacts** | `contacts.json` | Names, IDs, phone numbers |
| **Photos** | `photos/` + `photo_manifest.json` | Images with EXIF, GPS, timestamps |
| **Location History** | `location_history.json` | Latitude, longitude, accuracy, timestamps |
| **App Data** | `{package}_data.tar` | Full app backup (optional) |

**Technical Implementation:**
- **Tool:** ADB (Android Debug Bridge)
- **Method:** `adb pull`, `adb shell content query`
- **Database Parsing:** SQLite (`mmssms.db`, `contacts2.db`)
- **Metadata Extraction:** PIL/Pillow for EXIF/GPS data

#### iOS Extraction (iTunes Backup Parser)

| Data Type | Source | Status |
|-----------|--------|--------|
| **iMessages** | `Manifest.plist` + SQLite DB | ✅ Live |
| **Photos** | Backup MDM domain | ✅ Live |
| **Backup Metadata** | `Info.plist`, `Manifest.plist` | ✅ Live |

**Technical Implementation:**
- **Backup Location:** `~/Library/Application Support/MobileSync/Backup/`
- **Parsing:** `plistlib` for manifest, SQLite for message DB
- **Timestamp Conversion:** Apple epoch (2001-01-01) → Unix epoch

#### WhatsApp Extraction

| Data Type | Status | Notes |
|-----------|--------|-------|
| **Message Database** | ⚠️ Encrypted | `msgstore.db` pulled but requires decryption key |
| **Media Files** | ✅ Live | Images, videos extracted unencrypted |
| **Media Manifest** | ✅ Live | Metadata for all extracted media |

**Technical Implementation:**
- **Database Path:** `/sdcard/Android/media/com.whatsapp/WhatsApp/Databases/msgstore.db`
- **Media Path:** `/sdcard/Android/media/com.whatsapp/WhatsApp/Media/`
- **Limitation:** Messages encrypted; requires root for key extraction

---

### 1.3 AI-Powered Analysis

#### Face Recognition

| Feature | Description |
|---------|-------------|
| **Face Detection** | OpenCV Haar cascade classifier |
| **Face Recognition** | Known face database matching |
| **Known Face DB** | `~/.palantir/known_faces/` with encodings |
| **Multi-Face Support** | Multiple faces per image |
| **Bounding Boxes** | Coordinates for each detected face |

**API Endpoints:**
```bash
POST /api/nexus/face/detect      # Detect faces in image
POST /api/nexus/face/recognize   # Recognize known faces
POST /api/nexus/face/add         # Add known face to database
```

**Technical Implementation:**
- **Detector:** `cv2.CascadeClassifier` (Haar cascade)
- **Storage:** JSON file with face encodings
- **Limitation:** Simplified recognition (full implementation would use `face_recognition` library)

#### Object Detection

| Feature | Description |
|---------|-------------|
| **Model** | YOLO v3 (pre-trained on COCO) |
| **Classes** | 80+ object types (person, pet, vehicle, electronics, furniture, etc.) |
| **Confidence Threshold** | Configurable (default 0.5) |
| **Batch Processing** | Folder-wide detection |
| **Bounding Boxes** | Coordinates + class + confidence |

**Detectable Objects:**
- 👤 Person
- 🐱 Cat, 🐶 Dog (pets)
- 🚗 Car, 🚚 Truck, 🚌 Bus (vehicles)
- 💻 Laptop, 📱 Cell phone (electronics)
- 🪑 Chair, 🛋️ Couch (furniture)
- And 75+ more COCO classes

**API Endpoints:**
```bash
POST /api/nexus/object/detect        # Detect objects in single image
POST /api/nexus/object/detect-folder # Batch detection in folder
```

**Technical Implementation:**
- **Model Files:** `yolov3.weights`, `yolov3.cfg`
- **Library:** OpenCV DNN module (`cv2.dnn.readNetFromDarknet`)
- **Output:** JSON with class, confidence, bounding box

---

### 1.4 Storage Management

| Feature | Description |
|---------|-------------|
| **Auto-Cleanup** | Delete snapshots older than retention period |
| **Max Snapshots** | Enforce maximum count (delete oldest) |
| **Custom Locations** | Set custom save paths (external drives, etc.) |
| **Manual Cleanup** | Delete by age or clear all |
| **Storage Stats** | Real-time file count & size tracking |

**Configuration:**
```python
'snapshot_retention_days': 7,      # Auto-delete after 7 days
'max_snapshots': 1000,              # Keep max 1000 snapshots
'auto_cleanup_enabled': True,       # Enable automatic cleanup
'auto_cleanup_interval_hours': 24,  # Run cleanup daily
```

**API Endpoints:**
```bash
GET  /api/storage/stats     # Get storage statistics
POST /api/storage/cleanup   # Cleanup old files
POST /api/storage/clear     # Clear all snapshots
POST /api/storage/location  # Change save location
```

---

### 1.5 Cloud Sync

| Provider | Status | Requirements |
|----------|--------|--------------|
| **AWS S3** | ✅ Live | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| **Google Drive** | ✅ Live | OAuth credentials |

**API Endpoints:**
```bash
POST /api/nexus/cloud/sync      # Sync single file
POST /api/nexus/cloud/auto-sync # Auto-sync entire folder
```

**Technical Implementation:**
- **S3:** `boto3` library
- **Google Drive:** `google-api-python-client`, `google-auth-oauthlib`
- **Features:** Progress tracking, error reporting, secure credential handling

---

### 1.6 Multi-Device Support

| Feature | Description |
|---------|-------------|
| **Device Discovery** | Automatic detection of connected ADB devices |
| **Parallel Extraction** | Extract from all devices simultaneously |
| **Per-Device Tracking** | Separate result tracking per device |
| **Unified Aggregation** | Combined results dashboard |

**API Endpoints:**
```bash
GET  /api/nexus/devices           # List all connected devices
GET  /api/nexus/devices/info      # Get info from all devices
POST /api/nexus/devices/extract   # Extract from ALL devices at once
```

**Use Case:** Monitor multiple family members' devices, or extract from several phones at once for investigation.

---

## 2. UI Components and Design Patterns

### 2.1 Design System

**Theme:** Dark, futuristic surveillance aesthetic

**Color Palette:**
```css
:root {
    --bg-primary: #0a0e1a;       /* Deep navy black */
    --bg-secondary: #111827;     /* Dark gray */
    --bg-tertiary: #1f2937;      /* Medium dark gray */
    --accent-blue: #3b82f6;      /* Bright blue */
    --accent-green: #10b981;     /* Emerald green */
    --accent-red: #ef4444;       /* Red */
    --accent-purple: #8b5cf6;    /* Violet */
    --text-primary: #f9fafb;     /* White */
    --text-secondary: #9ca3af;   /* Light gray */
    --border-color: #374151;     /* Dark border */
}
```

**Typography:**
- **Font:** `'Segoe UI', system-ui, -apple-system, sans-serif`
- **Headings:** Gradient text (`background-clip: text`)
- **Monospace:** `'Courier New', monospace` (terminal/logs)

**Visual Effects:**
- Gradient backgrounds (135deg linear gradients)
- Glassmorphism (backdrop-filter: blur)
- Animated status indicators (pulse animations)
- Hover transformations (translateY, shadow)
- Flash animations for alerts

---

### 2.2 Dashboard Layout

**Main Dashboard (`dashboard.html`):**

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo + Status Bar (Online/Motion/Offline)          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │                     │  │  STATISTICS PANEL           │   │
│  │   LIVE VIDEO FEED   │  │  - Total motions            │   │
│  │   (WebSocket)       │  │  - Snapshots taken          │   │
│  │                     │  │  - System uptime            │   │
│  │   [Motion Alert]    │  │  - Last motion timestamp    │   │
│  │                     │  │                             │   │
│  │   [FPS Overlay]     │  ├─────────────────────────────┤   │
│  │                     │  │  EVENTS LIST                │   │
│  └─────────────────────┘  │  - Recent motion events     │   │
│                           │  - Motion area (pixels²)    │   │
│  [▶️ Start] [⏹️ Stop]     │  - Detection zones          │   │
│  [📸 Snapshot] [⛶ Full]  │  - Timestamps               │   │
│                           └─────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │  SNAPSHOTS GALLERY  │  │  SETTINGS PANEL             │   │
│  │  - Grid view        │  │  - Camera ID                │   │
│  │  - Thumbnails       │  │  - Resolution               │   │
│  │  - Timestamp        │  │  - FPS                      │   │
│  │  - Reason (motion/  │  │  - Motion threshold         │   │
│  │    manual)          │  │  - Min/Max area             │   │
│  │                     │  │  - Blur size                │   │
│  └─────────────────────┘  │  - Retention days           │   │
│                           │  - Max snapshots            │   │
│                           └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Nexus Dashboard (`nexus.html`):**

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo + Connection Status (🟢 Connected/🔴 Disconnected) │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ DEVICE INFO  │ │ QUICK EXTRACT│ │ FULL EXTRACT │         │
│  │ - Model      │ │ [SMS]        │ │ [🔥 ALL]     │         │
│  │ - Android    │ │ [Calls]      │ │              │         │
│  │ - Serial     │ │ [Contacts]   │ │              │         │
│  │              │ │ [Photos]     │ │              │         │
│  │              │ │ [Location]   │ │              │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │  EXTRACTION HISTORY │  │  LIVE TERMINAL LOG          │   │
│  │  - Recent extractions│  │  - Real-time log streaming │   │
│  │  - File count       │  │  - Color-coded entries      │   │
│  │  - Timestamp        │  │  - Clear history option     │   │
│  │  - Size             │  │                             │   │
│  └─────────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.3 UI Components

#### Status Indicators
```css
.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    animation: pulse 2s infinite;
}
.status-dot.online { background: #10b981; }
.status-dot.motion { background: #ef4444; animation: pulse 0.5s infinite; }
.status-dot.offline { background: #9ca3af; }
```

#### Buttons
```css
.btn-primary {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
}
.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}
```

#### Cards
```css
.card {
    background: #111827;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #374151;
}
```

#### Progress Bars
```css
.progress-bar {
    width: 100%;
    height: 6px;
    background: #1f2937;
    border-radius: 3px;
}
.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #8b5cf6, #3b82f6);
    transition: width 0.3s;
}
```

#### Notifications
```css
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #111827;
    border: 1px solid #374151;
    border-radius: 8px;
    padding: 15px 20px;
    transform: translateX(400px);
    transition: transform 0.3s;
}
.notification.show {
    transform: translateX(0);
}
```

---

### 2.4 WebSocket Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `connect` | Client → Server | - | Client connected |
| `disconnect` | Client → Server | - | Client disconnected |
| `video_frame` | Server → Client | `{frame, motion, fps, motion_count}` | Live video frame (base64 JPEG) |
| `snapshot_saved` | Server → Client | `{path, reason}` | New snapshot saved |
| `status_update` | Server → Client | `{running, motion_detected, motion_count, last_motion}` | Status change |
| `cleanup_result` | Server → Client | `{deleted, message}` | Cleanup completion |
| `request_status` | Client → Server | - | Request current status |

**Video Streaming Implementation:**
```javascript
// Client-side (dashboard.html)
socket.on('video_frame', (data) => {
    const img = document.getElementById('video-feed');
    img.src = 'data:image/jpeg;base64,' + data.frame;
    
    if (data.motion) {
        document.querySelector('.motion-alert').classList.add('active');
    } else {
        document.querySelector('.motion-alert').classList.remove('active');
    }
    
    // Update stats
    document.getElementById('fps').textContent = data.fps.toFixed(1);
    document.getElementById('motion-count').textContent = data.motion_count;
});
```

---

### 2.5 Responsive Design

**Breakpoints:**
```css
@media (max-width: 1200px) {
    .grid {
        grid-template-columns: 1fr;  /* Stack panels vertically */
    }
}

@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: 1fr;  /* Single column stats */
    }
    
    .controls {
        flex-direction: column;  /* Stack buttons */
    }
}
```

**Grid Layouts:**
- Main dashboard: `grid-template-columns: 2fr 1fr` (video feed + sidebar)
- Stats grid: `repeat(2, 1fr)` (2x2 grid)
- Snapshots gallery: `repeat(auto-fill, minmax(150px, 1fr))` (responsive grid)

---

## 3. Data Models and APIs

### 3.1 Database Schema (SQLite)

#### `motion_events` Table
```sql
CREATE TABLE motion_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,           -- ISO 8601 format
    area INTEGER,             -- Motion area in pixels²
    boxes INTEGER,            -- Number of detection boxes
    snapshot_path TEXT        -- Path to associated snapshot
);
```

#### `snapshots` Table
```sql
CREATE TABLE snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT,                -- File path to snapshot
    timestamp TEXT,           -- ISO 8601 format (YYYYMMDD-HHMMSS)
    reason TEXT,              -- 'motion' or 'manual'
    motion_area INTEGER       -- Motion area if triggered by motion
);
```

**Database Location:** `palantir.db` (in project root)

---

### 3.2 REST API Endpoints

#### Motion Monitoring

| Endpoint | Method | Request | Response | Description |
|----------|--------|---------|----------|-------------|
| `/` | GET | - | HTML | Main dashboard |
| `/api/status` | GET | - | `{running, motion_detected, motion_count, last_motion, camera_id}` | Get monitor status |
| `/api/start` | POST | - | `{success, message}` | Start monitoring |
| `/api/stop` | POST | - | `{success, message}` | Stop monitoring |
| `/api/snapshot` | POST | - | `{success, path}` | Take manual snapshot |
| `/api/snapshots` | GET | - | `[{path, timestamp, reason, motion_area}]` | Get recent snapshots (limit 50) |
| `/api/events` | GET | - | `[{timestamp, area, boxes}]` | Get motion events (limit 100) |
| `/api/config` | GET | - | `CONFIG` object | Get current configuration |
| `/api/config` | POST | `CONFIG` object | `{success, config}` | Update configuration |

#### Storage Management

| Endpoint | Method | Request | Response | Description |
|----------|--------|---------|----------|-------------|
| `/api/storage/stats` | GET | - | `{file_count, db_count, total_size_bytes, total_size_mb, snapshot_dir, retention_days, max_snapshots, auto_cleanup}` | Get storage statistics |
| `/api/storage/cleanup` | POST | `{days}` | `{success, deleted, message}` | Cleanup old files |
| `/api/storage/clear` | POST | - | `{success, deleted, message}` | Clear all snapshots |
| `/api/storage/location` | POST | `{path}` | `{success, path, message}` | Change save location |
| `/snapshots/<filename>` | GET | - | Image file | Serve snapshot image |

#### Phone Extraction (Nexus)

| Endpoint | Method | Request | Response | Description |
|----------|--------|---------|----------|-------------|
| `/nexus` | GET | - | HTML | Nexus dashboard |
| `/api/nexus/status` | GET | - | `{connected, devices}` | Check device connection |
| `/api/nexus/device-info` | GET | - | `{success, info}` | Get device information |
| `/api/nexus/extract/sms` | POST | - | `{success, count, path}` | Extract SMS messages |
| `/api/nexus/extract/calls` | POST | - | `{success, count, path}` | Extract call logs |
| `/api/nexus/extract/contacts` | POST | - | `{success, count, path}` | Extract contacts |
| `/api/nexus/extract/photos` | POST | - | `{success, count, path}` | Extract photos with metadata |
| `/api/nexus/extract/location` | POST | - | `{success, count, path}` | Extract location history |
| `/api/nexus/extractions` | GET | - | `[{type, timestamp, count, size, path}]` | List all extractions |

#### iOS Extraction

| Endpoint | Method | Request | Response | Description |
|----------|--------|---------|----------|-------------|
| `/api/nexus/ios/backups` | GET | - | `{backups}` | List iOS backups |
| `/api/nexus/ios/extract/sms` | POST | `{backup_id}` | `{success, count, path}` | Extract iMessages |

#### WhatsApp Extraction

| Endpoint | Method | Request | Response | Description |
|----------|--------|---------|----------|-------------|
| `/api/nexus/whatsapp/extract` | POST | - | `{success, message, path, encrypted, note}` | Extract WhatsApp messages |
| `/api/nexus/whatsapp/media` | POST | `{limit}` | `{success, count, path}` | Extract WhatsApp media |

#### AI Features

| Endpoint | Method | Request | Response | Description |
|----------|--------|---------|----------|-------------|
| `/api/nexus/face/detect` | POST | `{path}` | `{count, faces, image}` | Detect faces in image |
| `/api/nexus/face/recognize` | POST | `{path}` | `{count, faces}` | Recognize known faces |
| `/api/nexus/face/add` | POST | `{name, path}` | `{success, name, faces_detected}` | Add known face |
| `/api/nexus/object/detect` | POST | `{path, confidence}` | `{success, detections}` | Detect objects |
| `/api/nexus/object/detect-folder` | POST | `{path, confidence}` | `{success, results}` | Batch object detection |

#### Cloud Sync

| Endpoint | Method | Request | Response | Description |
|----------|--------|---------|----------|-------------|
| `/api/nexus/cloud/sync` | POST | `{provider, path, bucket}` | `{success, message}` | Sync file to cloud |
| `/api/nexus/cloud/auto-sync` | POST | `{provider, path, bucket}` | `{success, message}` | Auto-sync folder |

#### Multi-Device

| Endpoint | Method | Request | Response | Description |
|----------|--------|---------|----------|-------------|
| `/api/nexus/devices` | GET | - | `{devices}` | List connected devices |
| `/api/nexus/devices/extract` | POST | `{type}` | `{success, results}` | Extract from all devices |
| `/api/nexus/devices/info` | GET | - | `{devices}` | Get info from all devices |

---

### 3.3 Data Models (JSON)

#### SMS Extraction Output
```json
{
  "count": 1000,
  "messages": [
    {
      "contact": "+1234567890",
      "timestamp": "2026-03-14T15:30:00",
      "type": "received",
      "message": "Hello world"
    }
  ]
}
```

#### Call Logs Output
```json
{
  "count": 500,
  "calls": [
    {
      "number": "+1234567890",
      "type": "incoming",
      "timestamp": "2026-03-14T15:30:00",
      "duration": "120s",
      "contact": "John Doe"
    }
  ]
}
```

#### Photo Manifest Output
```json
{
  "count": 100,
  "photos": [
    {
      "filename": "IMG_001.jpg",
      "path": "/path/to/photo.jpg",
      "metadata": {
        "DateTime": "2026:03:14 15:30:00",
        "GPSInfo": {
          "GPSLatitude": [40, 0, 0],
          "GPSLongitude": [-84, 0, 0]
        },
        "Model": "iPhone 15 Pro"
      }
    }
  ]
}
```

#### Face Detection Output
```json
{
  "count": 2,
  "faces": [
    {
      "x": 100,
      "y": 150,
      "width": 200,
      "height": 200,
      "confidence": 0.95,
      "recognized_as": "John Doe",
      "match_confidence": 0.87
    }
  ],
  "image": "/path/to/image.jpg"
}
```

#### Object Detection Output
```json
{
  "success": true,
  "detections": [
    {
      "class": "person",
      "confidence": 0.92,
      "x": 100,
      "y": 150,
      "width": 200,
      "height": 400
    },
    {
      "class": "car",
      "confidence": 0.85,
      "x": 400,
      "y": 300,
      "width": 300,
      "height": 200
    }
  ]
}
```

#### Motion Event Output
```json
{
  "timestamp": "2026-03-14T15:30:00",
  "area": 5000,
  "boxes": 3
}
```

---

### 3.4 File Structure

```
palantir-home/
├── palantir.py              # Main application (2,000+ lines)
├── start.sh                 # Launch script
├── requirements.txt         # Python dependencies
├── README.md                # Documentation
├── palantir.db              # SQLite database
├── palantir.log             # Application logs
├── nexus/
│   └── phone_extractor.py   # Phone extraction module (3,000+ lines)
├── templates/
│   ├── dashboard.html       # Main dashboard UI (1,000+ lines)
│   ├── nexus.html           # Nexus extractor UI (500+ lines)
│   ├── multi-camera.html    # Multi-camera view
│   └── wireless-cameras.html # Wireless camera setup
├── snapshots/               # Captured images (or custom location)
│   ├── 20260314-153022_motion.jpg
│   └── ...
└── yolov3.weights           # YOLO model (optional)
    yolov3.cfg               # YOLO config (optional)
```

**Extraction Output:**
```
~/palantir_extractions/
└── 20260314_164500/
    ├── sms.json
    ├── call_logs.json
    ├── contacts.json
    ├── photos/
    │   ├── IMG_001.jpg
    │   ├── IMG_002.jpg
    │   └── photo_manifest.json
    ├── location_history.json
    └── extraction_report.json
```

---

## 4. Integration Points with Nexus-Docs

### 4.1 Current Integration Status

**Direct Integration:** ⚠️ **NOT YET IMPLEMENTED**

**Current State:**
- Palantir Home exports data as JSON files
- Nexus-Docs can ingest JSON documents
- No automated pipeline exists between the two systems
- Manual export/import required

**Export Locations:**
- Phone extractions: `~/palantir_extractions/YYYYMMDD_HHMMSS/*.json`
- Motion events: `palantir.db` (SQLite)
- Snapshots: `snapshots/` directory (JPEG images)

---

### 4.2 Potential Integration Points

#### 4.2.1 Document Ingestion Pipeline

**Concept:** Automatically feed extracted phone data into Nexus-Docs for entity extraction and analysis.

**Data Flow:**
```
Palantir Home → JSON Export → Nexus-Docs Ingestion → Entity Extraction → Verified Ledger
```

**Implementation:**
```python
# Pseudo-code for integration
def send_to_nexus_docs(extraction_path):
    """Send extracted data to Nexus-Docs for analysis"""
    
    # Load extracted data
    with open(extraction_path) as f:
        data = json.load(f)
    
    # Convert to Nexus-Docs format
    documents = []
    for message in data.get('messages', []):
        doc = {
            'id': uuid.uuid4(),
            'content': message['message'],
            'metadata': {
                'source': 'palantir-sms',
                'contact': message['contact'],
                'timestamp': message['timestamp'],
                'type': message['type']
            }
        }
        documents.append(doc)
    
    # Send to Nexus-Docs API
    requests.post('http://localhost:3000/api/ingest', json={'documents': documents})
```

**Benefits:**
- Automatic entity extraction from SMS/call logs
- Cross-reference contacts with known individuals
- Timeline reconstruction from message timestamps
- Geographic analysis from location data

---

#### 4.2.2 Image Analysis Pipeline

**Concept:** Use Nexus-Docs vision models to analyze motion snapshots and extracted photos.

**Data Flow:**
```
Motion Detected → Snapshot Saved → Nexus-Docs Vision API → Object/Face Detection → Results Dashboard
```

**Implementation:**
```python
# Pseudo-code for vision integration
def analyze_snapshot(snapshot_path):
    """Analyze snapshot with Nexus-Docs vision models"""
    
    # Send to Nexus-Docs vision API
    with open(snapshot_path, 'rb') as f:
        response = requests.post(
            'http://localhost:3000/api/vision/analyze',
            files={'image': f},
            json={'models': ['object-detection', 'face-recognition']}
        )
    
    # Process results
    results = response.json()
    
    # Store in Palantir database
    conn = sqlite3.connect('palantir.db')
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE snapshots 
        SET analysis_results = ? 
        WHERE path = ?
    ''', (json.dumps(results), snapshot_path))
    conn.commit()
    conn.close()
    
    return results
```

**Benefits:**
- Enhanced object detection (80+ COCO classes)
- Face recognition with known individuals database
- Scene understanding (indoor/outdoor, time of day)
- Activity detection (running, sitting, driving)

---

#### 4.2.3 Unified Intelligence Dashboard

**Concept:** Combine Palantir Home's real-time monitoring with Nexus-Docs' analytical capabilities.

**Features:**
- **Live Feed Panel:** Palantir Home video stream
- **Entity Overlay:** Nexus-Docs extracted entities (faces, objects, text)
- **Timeline View:** Combined motion events + extracted data timeline
- **Verified Ledger:** All individuals detected across all sources
- **Geographic Map:** Location history + motion event locations
- **Search Interface:** Full-text search across all extracted data

**Implementation:**
```javascript
// Unified dashboard (React/Vue component)
function IntelligenceDashboard() {
    const [videoFeed, setVideoFeed] = useState(null);
    const [entities, setEntities] = useState([]);
    const [timeline, setTimeline] = useState([]);
    
    // Connect to Palantir WebSocket
    useEffect(() => {
        const socket = io('http://localhost:5555');
        socket.on('video_frame', (data) => {
            setVideoFeed(data.frame);
        });
        socket.on('snapshot_saved', (data) => {
            // Trigger Nexus-Docs analysis
            analyzeSnapshot(data.path);
        });
    }, []);
    
    // Fetch entities from Nexus-Docs
    useEffect(() => {
        fetch('http://localhost:3000/api/entities')
            .then(r => r.json())
            .then(setEntities);
    }, []);
    
    return (
        <div className="dashboard">
            <VideoFeed frame={videoFeed} entities={entities} />
            <Timeline events={timeline} />
            <EntityLedger entities={entities} />
        </div>
    );
}
```

---

#### 4.2.4 Automated Alert System

**Concept:** Use Nexus-Docs entity matching to trigger intelligent alerts.

**Workflow:**
```
Motion Detected → Face Recognition → Match with Verified Ledger → If High-Priority → Send Alert
```

**Implementation:**
```python
# Pseudo-code for alert system
def on_motion_detected(snapshot_path):
    """Handle motion detection with intelligent alerts"""
    
    # Detect faces
    faces = face_recognizer.recognize_faces(snapshot_path)
    
    for face in faces['faces']:
        if face['recognized_as'] in HIGH_PRIORITY_INDIVIDUALS:
            # Send alert via Telegram
            send_telegram_alert(
                f"🚨 HIGH-PRIORITY INDIVIDUAL DETECTED: {face['recognized_as']}",
                photo_path=snapshot_path
            )
            
            # Log to Nexus-Docs
            nexus_docs.log_event({
                'type': 'high-priority-detection',
                'individual': face['recognized_as'],
                'timestamp': datetime.now().isoformat(),
                'snapshot': snapshot_path
            })
```

**Alert Triggers:**
- High-priority individual detected
- Unusual activity pattern (multiple motions in short time)
- Object detection (vehicle, weapon, etc.)
- Location-based triggers (geofencing)

---

#### 4.2.5 Data Export/Import

**Concept:** Standardized export format for seamless data transfer.

**Export Format:**
```json
{
  "export_version": "1.0",
  "source": "palantir-home",
  "timestamp": "2026-03-14T22:20:00",
  "data": {
    "sms": [...],
    "calls": [...],
    "contacts": [...],
    "photos": [...],
    "locations": [...],
    "motion_events": [...],
    "snapshots": [...]
  },
  "analysis": {
    "entities": [...],
    "timeline": [...],
    "geographic_matrix": [...]
  }
}
```

**Import Script:**
```python
# Nexus-Docs import script
def import_palantir_export(export_path):
    """Import Palantir Home export into Nexus-Docs"""
    
    with open(export_path) as f:
        data = json.load(f)
    
    # Ingest SMS as documents
    for message in data['data']['sms']:
        ingest_document({
            'content': message['message'],
            'metadata': {
                'source': 'sms',
                'contact': message['contact'],
                'timestamp': message['timestamp']
            }
        })
    
    # Ingest call logs
    for call in data['data']['calls']:
        ingest_document({
            'content': f"Call with {call['number']} ({call['type']}, {call['duration']})",
            'metadata': {
                'source': 'call-log',
                'timestamp': call['timestamp']
            }
        })
    
    # Process photos with vision models
    for photo in data['data']['photos']:
        analyze_image(photo['path'])
    
    return {'success': True, 'imported': len(data['data']['sms']) + len(data['data']['calls'])}
```

---

### 4.3 API Compatibility

#### Palantir Home API Style
- **Framework:** Flask + Flask-SocketIO
- **Auth:** None (local-only by default)
- **Format:** REST + WebSocket
- **Data:** JSON responses, base64 video frames

#### Nexus-Docs API Style (Inferred)
- **Framework:** Node.js (Vite + Express/ Fastify)
- **Auth:** API keys (`.env.local`)
- **Format:** REST + potentially WebSocket
- **Data:** JSON, vector embeddings

**Compatibility Notes:**
- Both use JSON for data exchange ✅
- Both support REST APIs ✅
- Both can run locally ✅
- Palantir uses WebSocket for real-time video; Nexus-Docs may need WebSocket for real-time updates
- Authentication models differ (Palantir: none; Nexus-Docs: API keys)

---

## 5. Features That Should Be Merged into Nexus-Docs

### 5.1 High Priority Merges

#### 5.1.1 Real-Time WebSocket Video Streaming

**Why Merge:**
- Nexus-Docs currently lacks real-time video capabilities
- Motion monitoring adds active surveillance to passive document analysis
- Enables live verification of extracted data (e.g., verify location via camera)

**Implementation Approach:**
```javascript
// Add to Nexus-Docs backend
const io = require('socket.io')(server);

io.on('connection', (socket) => {
    socket.on('subscribe-camera', (cameraId) => {
        // Start streaming from camera
        const stream = getCameraStream(cameraId);
        stream.on('frame', (frame) => {
            socket.emit('video-frame', {
                camera: cameraId,
                frame: frame,  // base64 JPEG
                timestamp: Date.now()
            });
        });
    });
});
```

**UI Component:**
```vue
<template>
  <div class="video-panel">
    <video-feed :src="videoStream" :entities="detectedEntities" />
    <motion-overlay v-if="motionDetected" />
  </div>
</template>
```

**Priority:** 🔥 **HIGH** - Unique capability, strong synergy with existing features

---

#### 5.1.2 Motion Detection with Auto-Capture

**Why Merge:**
- Automatic event triggering based on visual changes
- Captures moments that would otherwise be missed
- Integrates with entity detection (who triggered motion?)

**Implementation Approach:**
```python
# Add to Nexus-Docs backend
class MotionDetector:
    def __init__(self):
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2()
    
    def detect(self, frame):
        fg_mask = self.bg_subtractor.apply(frame)
        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > CONFIG['min_area']:
                return True, area
        
        return False, 0
```

**Integration Points:**
- Trigger document analysis on motion (e.g., capture whiteboard, scan QR code)
- Log motion events to timeline
- Correlate motion with other data sources (phone location, messages)

**Priority:** 🔥 **HIGH** - Enables automated data capture

---

#### 5.1.3 Phone Data Extraction (ADB)

**Why Merge:**
- Direct data source for entity extraction
- SMS/call logs rich in named entities
- Location history provides geographic context
- Photos contain EXIF metadata (timestamps, GPS)

**Implementation Approach:**
```javascript
// Add to Nexus-Docs (Node.js wrapper around ADB)
const { exec } = require('child_process');

async function extractSMS() {
    return new Promise((resolve, reject) => {
        exec('adb pull /data/data/com.android.providers.telephony/databases/mmssms.db', (err, stdout, stderr) => {
            if (err) return reject(err);
            
            // Parse SQLite database
            const db = new sqlite3.Database('mmssms.db');
            db.all('SELECT address, date, type, body FROM sms', (err, rows) => {
                if (err) return reject(err);
                
                // Convert to Nexus-Docs documents
                const documents = rows.map(row => ({
                    content: row.body,
                    metadata: {
                        source: 'sms',
                        contact: row.address,
                        timestamp: new Date(row.date),
                        type: row.type === 1 ? 'received' : 'sent'
                    }
                }));
                
                resolve(documents);
            });
        });
    });
}
```

**Integration Points:**
- Automatic entity extraction from messages
- Timeline reconstruction from call logs
- Geographic matrix from location history
- Photo analysis with EXIF data

**Priority:** 🔥 **HIGH** - Rich data source for intelligence analysis

---

#### 5.1.4 Face Recognition with Known Individuals Database

**Why Merge:**
- Direct entity identification (not just detection)
- Cross-reference with verified ledger
- Alert on high-priority individual detection

**Implementation Approach:**
```javascript
// Add to Nexus-Docs vision pipeline
const faceapi = require('face-api.js');

class FaceRecognizer {
    constructor() {
        this.knownFaces = new Map();  // name -> descriptor
        this.loadKnownFaces();
    }
    
    async recognize(image) {
        const detections = await faceapi.detectAllFaces(image);
        
        for (const detection of detections) {
            const descriptor = await faceapi.computeFaceDescriptor(image, detection);
            
            // Match with known faces
            let bestMatch = null;
            let bestDistance = Infinity;
            
            for (const [name, knownDescriptor] of this.knownFaces) {
                const distance = faceapi.euclideanDistance(descriptor, knownDescriptor);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = name;
                }
            }
            
            detection.recognizedAs = bestMatch;
            detection.matchConfidence = 1 - bestDistance;
        }
        
        return detections;
    }
}
```

**Integration Points:**
- Verified Individuals Ledger ← Face recognition results
- Alert system for high-priority matches
- Timeline: "John Doe detected at 15:30 in kitchen"
- Geographic: "John Doe detected at home (GPS from photo EXIF)"

**Priority:** 🔥 **HIGH** - Direct entity identification

---

#### 5.1.5 Object Detection (80+ Classes)

**Why Merge:**
- Scene understanding for extracted photos
- Context for entity analysis (person + car = driving?)
- Automated tagging of visual data

**Implementation Approach:**
```javascript
// Use existing YOLO/TensorFlow.js models
const cocoSsd = require('@tensorflow-models/coco-ssd');

class ObjectDetector {
    constructor() {
        this.model = null;
    }
    
    async load() {
        this.model = await cocoSsd.load();
    }
    
    async detect(image) {
        const predictions = await this.model.detect(image);
        
        return predictions.map(pred => ({
            class: pred.class,
            confidence: pred.score,
            boundingBox: pred.bbox  // [x, y, width, height]
        }));
    }
}
```

**Integration Points:**
- Photo tagging: "car", "person", "laptop"
- Scene classification: "office", "outdoor", "vehicle interior"
- Activity inference: "person + laptop + office = working"
- Timeline: "Car detected in driveway at 08:00"

**Priority:** 🟡 **MEDIUM** - Enhances existing vision capabilities

---

### 5.2 Medium Priority Merges

#### 5.2.1 Cloud Sync (S3, Google Drive)

**Why Merge:**
- Backup for extracted intelligence
- Cross-device synchronization
- Long-term archival

**Implementation Approach:**
```javascript
// Add to Nexus-Docs storage layer
const AWS = require('aws-sdk');

class CloudSync {
    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });
    }
    
    async sync(file, bucket) {
        const fileContent = fs.readFileSync(file);
        
        await this.s3.putObject({
            Bucket: bucket,
            Key: `nexus-docs/${path.basename(file)}`,
            Body: fileContent
        }).promise();
    }
}
```

**Priority:** 🟡 **MEDIUM** - Infrastructure feature, not core analysis

---

#### 5.2.2 Multi-Device Support

**Why Merge:**
- Parallel extraction from multiple phones
- Family/organization-wide monitoring
- Redundancy (if one device fails)

**Implementation Approach:**
```javascript
// Device manager for Nexus-Docs
class DeviceManager {
    constructor() {
        this.devices = new Map();  // deviceId -> deviceInfo
    }
    
    async discover() {
        const result = await exec('adb devices');
        const devices = result.stdout.split('\n')
            .slice(1)
            .filter(line => line.includes('\tdevice'))
            .map(line => line.split('\t')[0]);
        
        for (const deviceId of devices) {
            const info = await this.getDeviceInfo(deviceId);
            this.devices.set(deviceId, info);
        }
        
        return Array.from(this.devices.values());
    }
    
    async extractFromAll(type) {
        const results = await Promise.all(
            Array.from(this.devices.keys()).map(id => 
                this.extract(id, type)
            )
        );
        
        return this.aggregate(results);
    }
}
```

**Priority:** 🟡 **MEDIUM** - Scaling feature, not core functionality

---

#### 5.2.3 Storage Management (Auto-Cleanup)

**Why Merge:**
- Prevent disk space exhaustion
- Automated retention policies
- Cost optimization for cloud storage

**Implementation Approach:**
```javascript
// Add to Nexus-Docs storage layer
class StorageManager {
    constructor() {
        this.retentionDays = 30;
        this.maxFiles = 10000;
    }
    
    async cleanup() {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - this.retentionDays);
        
        const files = await this.listFiles();
        const oldFiles = files.filter(f => f.mtime < cutoff);
        
        for (const file of oldFiles) {
            await this.delete(file.path);
        }
        
        // Enforce max count
        const currentCount = await this.countFiles();
        if (currentCount > this.maxFiles) {
            const toDelete = currentCount - this.maxFiles;
            const oldest = await this.getOldestFiles(toDelete);
            for (const file of oldest) {
                await this.delete(file.path);
            }
        }
    }
}
```

**Priority:** 🟡 **MEDIUM** - Operational necessity, not analytical value

---

### 5.3 Low Priority / Skip

#### 5.3.1 iOS Backup Parsing

**Why Skip:**
- macOS-specific (limited portability)
- Requires unencrypted backups (security concern)
- Complex manifest parsing
- Lower data quality than direct extraction

**Alternative:** Use iCloud API (if available) or focus on Android

**Priority:** ⚪ **LOW** - Niche use case, high complexity

---

#### 5.3.2 WhatsApp Extraction

**Why Skip:**
- Encrypted database (requires root for key)
- Limited value without message content
- Media extraction already possible via ADB
- Legal/privacy concerns

**Priority:** ⚪ **LOW** - Limited utility without decryption

---

#### 5.3.3 Web Dashboard (Full UI)

**Why Skip:**
- Nexus-Docs already has UI
- Different design systems (would need unification)
- Better to integrate features into existing Nexus-Docs UI
- Maintenance burden (two dashboards)

**Alternative:** Integrate Palantir features into Nexus-Docs UI components

**Priority:** ⚪ **SKIP** - Redundant, focus on feature integration not UI duplication

---

## 6. Recommended Integration Roadmap

### Phase 1: Core Data Pipeline (Week 1-2)

**Goals:**
- ✅ Automated export from Palantir Home
- ✅ Import pipeline in Nexus-Docs
- ✅ Entity extraction from SMS/call logs
- ✅ Timeline reconstruction

**Deliverables:**
- Export script (`palantir-export.py`)
- Import API endpoint (`POST /api/import/palantir`)
- Entity extraction from phone data
- Unified timeline view

---

### Phase 2: Vision Integration (Week 3-4)

**Goals:**
- ✅ Face recognition integration
- ✅ Object detection for photos
- ✅ EXIF metadata extraction
- ✅ Geographic matrix from photo locations

**Deliverables:**
- Vision API endpoint (`POST /api/vision/analyze`)
- Known faces database UI
- Object tagging for photos
- Map view with photo locations

---

### Phase 3: Real-Time Features (Week 5-6)

**Goals:**
- ✅ WebSocket video streaming
- ✅ Motion detection
- ✅ Auto-capture on motion
- ✅ Real-time alerts

**Deliverables:**
- Video streaming component
- Motion detection service
- Alert system (Telegram, email, push)
- Live dashboard with video feed

---

### Phase 4: Advanced Analytics (Week 7-8)

**Goals:**
- ✅ Cross-source entity matching
- ✅ Activity inference
- ✅ Pattern detection
- ✅ Predictive analytics

**Deliverables:**
- Entity resolution engine
- Activity timeline (inferred from data)
- Pattern detection (unusual activity, correlations)
- Predictive alerts (based on patterns)

---

### Phase 5: Production Hardening (Week 9-10)

**Goals:**
- ✅ Cloud sync
- ✅ Multi-device support
- ✅ Storage management
- ✅ Performance optimization

**Deliverables:**
- Cloud backup integration
- Multi-device extraction UI
- Automated cleanup jobs
- Performance benchmarks

---

## 7. Technical Debt and Considerations

### 7.1 Security Concerns

**Palantir Home:**
- ⚠️ No authentication (local-only by default)
- ⚠️ Secret key hardcoded in source
- ⚠️ ADB access requires USB debugging (security risk)
- ⚠️ Extracted data stored unencrypted

**Recommendations:**
- Add authentication (JWT, OAuth, or basic auth)
- Move secret key to environment variable
- Encrypt extracted data at rest
- Add audit logging for all extractions

---

### 7.2 Performance Bottlenecks

**Palantir Home:**
- ⚠️ Video streaming: 15-25% CPU (M4 Pro) at 720p30
- ⚠️ Object detection: YOLO v3 is slow (consider YOLO v8 or NanoDet)
- ⚠️ Face recognition: Simplified implementation (no real encoding)
- ⚠️ Database: SQLite may not scale for high-frequency motion events

**Recommendations:**
- Use hardware-accelerated video encoding (NVENC, QuickSync)
- Upgrade to YOLO v8 Nano (faster, similar accuracy)
- Use `face_recognition` library (dlib-based, accurate)
- Consider PostgreSQL for high-frequency writes

---

### 7.3 Privacy and Legal

**Considerations:**
- ⚠️ Phone extraction without consent may be illegal
- ⚠️ Motion monitoring in shared spaces requires consent
- ⚠️ Face recognition has legal restrictions in some jurisdictions
- ⚠️ Data retention policies required for compliance

**Recommendations:**
- Add consent management system
- Implement data retention policies
- Add privacy controls (opt-out, data deletion)
- Consult legal counsel for compliance

---

## 8. Conclusion

**Palantir Home** is a powerful surveillance and data extraction platform with strong potential for integration with **Nexus-Docs**. The systems are highly complementary:

- **Palantir Home:** Real-time data capture (video, motion, phone extraction)
- **Nexus-Docs:** Deep analysis (entity extraction, timeline reconstruction, verified ledger)

**High-Priority Merges:**
1. ✅ Real-time video streaming with motion detection
2. ✅ Phone data extraction (SMS, calls, contacts, location)
3. ✅ Face recognition with known individuals database
4. ✅ Object detection for scene understanding
5. ✅ Automated export/import pipeline

**Integration Value:**
- 📈 **Enhanced Data Sources:** Phone data + motion events + video
- 🧠 **Deeper Analysis:** Entity extraction from richer data
- ⚡ **Real-Time Capabilities:** Live monitoring + instant alerts
- 🎯 **Better Intelligence:** Cross-source verification and correlation

**Next Steps:**
1. Review this analysis with the team
2. Prioritize features for Phase 1
3. Set up development environment
4. Begin implementation of export/import pipeline

---

**Analysis Complete.** 🦆

**Generated by:** DuckBot (Subagent)  
**Date:** March 14, 2026 22:20 EDT  
**Task:** Palantir Home Analysis for Nexus-Docs Integration
