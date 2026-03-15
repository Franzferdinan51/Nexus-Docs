# MotionCam Skill Analysis

**Source:** `/Users/duckets/.openclaw/workspace/skills/motioncam`  
**Date:** March 14, 2026  
**Purpose:** Analyze MotionCam capabilities for Nexus-Docs media analysis integration

---

## 1. Camera Integration Features

### Supported Camera Sources
| Source | Backend | Configuration |
|--------|---------|---------------|
| USB Webcam (Video4Linux) | `v4l2src` (GStreamer) | `device: 0-3` in config |
| Fallback: Video test source | `videotestsrc` | Built-in testing |
| Standard VideoCapture | OpenCV fallback | Auto-detect |

### Technical Implementation
- **Camera API:** OpenCV (Python) with GStreamer backend
- **Supported resolutions:** Configurable (default 640x480)
- **FPS:** Configurable (default 30 fps)
- **Device index:** Configurable via `config.json` (`device: 0` = `/dev/video0`)
- **Multi-camera:** Supports multiple device indices (0, 1, 2, 3+)

### Configuration Structure
```json
{
  "camera": {
    "device": 0,
    "width": 640,
    "height": 480,
    "fps": 30
  }
}
```

---

## 2. Motion Detection Algorithms

### Core Algorithm: MOG2 Background Subtraction
- **Method:** `cv2.createBackgroundSubtractorMOG2()`
- **History:** 500 frames
- **VarThreshold:** 16 (shadow detection)

### Processing Pipeline
```
1. Frame Capture (OpenCV)
   ↓
2. Background Subtraction (MOG2)
   ↓
3. Thresholding (configurable threshold: 5-100, default 25)
   ↓
4. Morphological Operations (MORPH_CLOSE, 5x5 kernel)
   ↓
5. Contour Detection (RETR_EXTERNAL, CHAIN_APPROX_SIMPLE)
   ↓
6. Area Filtering (minArea/maxArea bounds)
   ↓
7. Bounding Box Generation
```

### Detection Parameters
| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `threshold` | 5-100 | 25 | Motion sensitivity (lower = more sensitive) |
| `minArea` | 100-5000 | 500 | Minimum contour area in pixels |
| `maxArea` | 10000-100000 | 50000 | Maximum contour area in pixels |
| `blurSize` | Odd numbers | 21 | Gaussian blur kernel (for noise reduction) |

### Output Data Structure
```python
{
  "type": "frame",
  "data": "<base64_jpeg>",        # Annotated frame with boxes
  "motionDetected": true/false,
  "boxes": [
    {"x": 100, "y": 50, "width": 80, "height": 120, "area": 9600},
    ...
  ]
}
```

---

## 3. UI Components for Camera Feeds

### Web Viewer (index.html)

#### Layout Structure
- **Header:** Title bar with camera icon
- **Main Panel:**
  - Video container (16:9 aspect ratio maintained)
  - Status overlay (connection status, motion indicator)
  - Control panel (stats + buttons)
  - Sensitivity sliders
- **Side Panel:** Event log (scrollable, max 50 events)

#### Visual Components
| Component | Description |
|-----------|-------------|
| **Video Frame** | Live MJPEG stream displayed as base64 image |
| **Motion Boxes** | Green rectangles drawn around detected motion |
| **Status Dot** | Pulsing indicator: red (disconnected), green (connected), yellow (detecting) |
| **Event Log** | Timestamped motion events with object count and area |

#### Controls
- **Start/Stop Detection** - Toggle motion detection
- **Threshold Slider** - Adjust motion sensitivity (5-100)
- **Min Area Slider** - Filter small movements (100-5000 px)
- **Max Area Slider** - Filter large movements (10000-100000 px)

#### Real-time Stats
- Motion event count
- Objects currently tracking
- Frames per second (FPS)

### WebSocket Protocol
- **Port:** 8765 (configurable)
- **Message types:** `frame`, `status`, `motion`, `error`
- **Max payload:** 10MB (supports high-res streams)

### HTTP API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Running state, motion detected, event count |
| `/api/events` | GET | Recent motion events (last 50) |
| `/api/start` | POST | Start motion detection |
| `/api/stop` | POST | Stop motion detection |
| `/api/config` | GET/POST | Get or update motion parameters |
| `/` | GET | Web viewer (static HTML) |

---

## 4. Palantir Home Integration

### Current Status: ⚠️ NO DIRECT INTEGRATION

**Finding:** The MotionCam skill has **no explicit Palantir Home integration** in its codebase. The skill operates as a standalone system.

### Potential Integration Points
If Palantir Home integration is desired, these endpoints could be used:

```bash
# Check motion status
curl http://localhost:3000/api/status | jq .motionDetected

# Get latest events
curl http://localhost:3000/api/events

# Trigger via Palantir automation
# POST /api/start - Start detection
# POST /api/stop - Stop detection
```

### Suggested Integration Architecture
1. **Palantir webhook → MotionCam API** for starting/stopping
2. **MotionCam webhook → Palantir** for motion alerts
3. **Shared state file** for cross-system status
4. **MQTT/Redis pub-sub** for real-time motion events

---

## 5. Features to Merge into Nexus-Docs

### High-Priority Features

| Feature | Description | Nexus-Docs Application |
|---------|-------------|------------------------|
| **MOG2 Background Subtraction** | Robust foreground detection for dynamic scenes | Plant monitoring, security |
| **Multi-stage Pipeline** | Background subtraction → threshold → morphology → contours | Any motion/change detection |
| **WebSocket Streaming** | Real-time base64 frame broadcast to web clients | Live camera feeds in UI |
| **HTTP API Control** | Start/stop/configure via REST endpoints | OpenClaw tool integration |
| **Event Logging** | Timestamped motion events with metadata | Activity logs, alerting |
| **Bounding Box Visualization** | Green overlay on detected objects | Debugging, visualization |
| **Configurable Sensitivity** | Runtime adjustment of detection parameters | Adapt to different environments |
| **GStreamer Backend** | Hardware-accelerated capture on Linux | Low-latency video processing |

### Medium-Priority Features

| Feature | Description | Nexus-Docs Application |
|---------|-------------|------------------------|
| **Morphological Operations** | Noise filtering via erosion/dilation | Cleaner detection |
| **Area Filtering** | Min/max bounds to reduce false positives | Ignore tiny/large movements |
| **Cooldown Mechanism** | Prevents event spam (2-second default) | Notification rate limiting |
| **Client Connection Management** | Track connected viewers | Multi-user support |
| **Graceful Shutdown** | Signal handling for clean process exit | Production deployment |

### Architecture Patterns to Adopt

#### 1. Python Backend + Node.js Server
- **Detector:** Python with OpenCV (detector.py)
- **Server:** Node.js/Express (server.js)
- **Communication:** STDIN/STDOUT IPC via JSON

```
[Camera] → [Python/OpenCV] → [JSON frames] → [Node.js] → [WebSocket] → [Browser]
```

#### 2. Configuration-Driven Design
All parameters in `config.json` - no hardcoded values:
- Camera settings
- Motion detection thresholds
- Server ports

#### 3. Event-Driven Architecture
- Motion triggers event objects with metadata
- Broadcast to all connected WebSocket clients
- Separate "motion" event type for alerts

---

## 6. Recommendations for Nexus-Docs

### Immediate Adoption
1. **Use the MOG2 pipeline** for any motion detection needs
2. **Leverage the HTTP API** for start/stop/config from OpenClaw tools
3. **Adopt the WebSocket pattern** for real-time camera feeds in web UI

### Adaptation for Plant Monitoring
1. Replace MOG2 with **frame differencing** (more stable for grow lights turning on/off)
2. Add **ROI (Region of Interest)** support for specific tent areas
3. Add **scheduled capture** mode (capture at intervals, not continuous)
4. Integrate with **CannaAI** via REST callbacks

### Adaptation for Security
1. Keep MOG2 (good for intruders vs. static background)
2. Add **recording** on motion (save clips to disk)
3. Add **notification** integration (Telegram/Discord webhooks)
4. Add **night vision** mode (IR camera support)

---

## Summary

The MotionCam skill provides a **production-ready motion detection system** with:
- ✅ Robust MOG2 background subtraction algorithm
- ✅ Clean Python/OpenCV backend with GStreamer support
- ✅ Node.js server with WebSocket streaming
- ✅ Full-featured web viewer with controls
- ✅ RESTful API for external integration
- ✅ Configurable parameters at runtime

**Integration Value:** High - The architecture (Python detector → Node server → WebSocket client) is modular and can be adapted for Nexus-Docs plant monitoring, security, or general media analysis workflows.

**Missing:** Direct Palantir Home integration (would need to be added as a middleware layer or webhook system).