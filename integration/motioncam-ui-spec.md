# MotionCam UI Specification

**Version:** 1.0.0  
**Last Updated:** 2026-03-14  
**Status:** Draft

---

## Overview

This document describes the MotionCam UI integration specifications, including WebSocket communication protocols, video streaming mechanisms, and motion detection visualization for the MotionCam dashboard component.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [WebSocket Connection](#websocket-connection)
3. [Video Streaming Protocol](#video-streaming-protocol)
4. [Motion Detection Visualization](#motion-detection-visualization)
5. [API Reference](#api-reference)
6. [Error Handling](#error-handling)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MotionCam UI                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  MotionCamTab  │  │  CameraFeed     │  │  Controls       │ │
│  │  (Main Tab)    │  │  (Video Player) │  │  (Sidebar)      │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                │
│                    ┌───────────▼───────────┐                   │
│                    │   WebSocket Manager   │                   │
│                    │   (ws://host:port)    │                   │
│                    └───────────┬───────────┘                   │
└────────────────────────────────┼────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   MotionCam Backend   │
                    │   (Python/Node.js)    │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼───────┐      ┌────────▼────────┐     ┌───────▼───────┐
│  USB Camera   │      │   IP Camera     │     │  Phone (ADB)  │
│  /dev/video0  │      │   RTSP Stream   │     │  192.168.x.x  │
└───────────────┘      └─────────────────┘     └───────────────┘
```

---

## WebSocket Connection

### Connection URL Pattern

```
ws://{host}:{port}/stream/{source}/{identifier}
```

| Source Type | URL Pattern | Example |
|-------------|-------------|---------|
| **Phone (ADB)** | `/stream/phone/{device_id}` | `ws://localhost:8080/stream/phone/R52T509H1YL` |
| **USB Camera** | `/stream/usb/{device_number}` | `ws://localhost:8080/stream/usb/0` |
| **IP Camera** | `/stream/ip/{encoded_url}` | `ws://localhost:8080/stream/ip/rtsp%3A%2F%2F192.168.1.100%2Fstream` |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8080` | WebSocket base URL |

### Connection Lifecycle

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  CONNECTING │────▶│   CONNECTED  │────▶│ DISCONNECTED│
└──────────────┘     └──────────────┘     └──────────────┘
       ▲                    │                    │
       │                    │                    │
       └────────────────────┴────────────────────┘
                    Auto-reconnect (5s)
```

---

## Video Streaming Protocol

### Message Format

All WebSocket messages use JSON format:

```typescript
interface WSMessage {
  type: 'frame' | 'motion' | 'status' | 'error' | 'command';
  cameraId: string;
  timestamp: number;
  payload: any;
}
```

### Frame Message (Type: `frame`)

Sent when a new video frame is available.

```json
{
  "type": "frame",
  "cameraId": "phone-cam",
  "timestamp": 1710475200000,
  "payload": {
    "format": "base64",
    "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAA...",
    "width": 1920,
    "height": 1080,
    "fps": 30
  }
}
```

**Payload Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `format` | `string` | Encoding format: `"base64"` or `"raw"` |
| `data` | `string` | Base64 encoded image or raw ImageData |
| `width` | `number` | Frame width in pixels |
| `height` | `number` | Frame height in pixels |
| `fps` | `number` | Current frames per second |

### Motion Detection Event (Type: `motion`)

Sent when motion is detected in the frame.

```json
{
  "type": "motion",
  "cameraId": "phone-cam",
  "timestamp": 1710475200000,
  "payload": {
    "intensity": 85,
    "boundingBox": {
      "x": 0.2,
      "y": 0.3,
      "width": 0.4,
      "height": 0.3
    },
    "threshold": 50
  }
}
```

**Payload Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `intensity` | `number` | Motion intensity 0-100 |
| `boundingBox` | `object` | Normalized position (0-1) |
| `boundingBox.x` | `number` | X position (0-1) |
| `boundingBox.y` | `number` | Y position (0-1) |
| `boundingBox.width` | `number` | Width (0-1) |
| `boundingBox.height` | `number` | Height (0-1) |
| `threshold` | `number` | Sensitivity threshold used |

### Status Message (Type: `status`)

Periodic status update.

```json
{
  "type": "status",
  "cameraId": "phone-cam",
  "timestamp": 1710475200000,
  "payload": {
    "connected": true,
    "recording": false,
    "fps": 29.97,
    "bitrate": 2500000,
    "uptime": 3600
  }
}
```

### Error Message (Type: `error`)

Error notification.

```json
{
  "type": "error",
  "cameraId": "phone-cam",
  "timestamp": 1710475200000,
  "payload": {
    "code": "CONNECTION_LOST",
    "message": "Camera device disconnected"
  }
}
```

### Command Message (Type: `command`)

Client to server command.

```json
{
  "type": "command",
  "cameraId": "phone-cam",
  "timestamp": 1710475200000,
  "payload": {
    "action": "screenshot",
    "params": {}
  }
}
```

**Supported Commands:**

| Action | Parameters | Description |
|--------|------------|-------------|
| `screenshot` | none | Capture and return current frame |
| `start_record` | `{duration?: number}` | Start recording |
| `stop_record` | none | Stop recording |
| `set_sensitivity` | `{value: number}` | Set motion sensitivity (0-100) |
| `set_quality` | `{quality: 'low'|'medium'|'high'}` | Set stream quality |

---

## Motion Detection Visualization

### Overlay Rendering

The motion detection overlay is rendered in two ways:

1. **Canvas-based (Real-time):** Direct drawing on video canvas
2. **CSS-based (Performance):** DOM overlay with absolute positioning

### Canvas Rendering

```typescript
function drawMotionOverlay(
  ctx: CanvasRenderingContext2D,
  boundingBox: BoundingBox,
  canvas: HTMLCanvasElement
) {
  const x = boundingBox.x * canvas.width;
  const y = boundingBox.y * canvas.height;
  const width = boundingBox.width * canvas.width;
  const height = boundingBox.height * canvas.height;

  // Green bounding box
  ctx.strokeStyle = '#22c55e'; // success color
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);

  // Transparent fill
  ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
  ctx.fillRect(x, y, width, height);

  // Label
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('MOTION', x, y - 5);
}
```

### CSS Overlay

```tsx
<div
  className="absolute border-2 border-green-500 bg-green-500/20"
  style={{
    left: `${boundingBox.x * 100}%`,
    top: `${boundingBox.y * 100}%`,
    width: `${boundingBox.width * 100}%`,
    height: `${boundingBox.height * 100}%`,
  }}
/>
```

### Animation

- **Appearance:** Instant (no fade-in)
- **Disappearance:** 2-second timeout after last motion event
- **Pulse Effect:** Optional CSS animation for active motion

---

## API Reference

### Frontend Components

#### MotionCamTab

Main tab component managing camera feeds and controls.

```typescript
interface MotionCamTabProps {
  // No props - uses internal state
}

interface CameraDevice {
  id: string;
  name: string;
  source: 'usb' | 'ip' | 'phone';
  url?: string;
  enabled: boolean;
}

interface MotionEvent {
  id: string;
  cameraId: string;
  timestamp: Date;
  intensity: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface MotionCamConfig {
  sensitivity: number; // 0-100
  recordingEnabled: boolean;
  selectedCameras: string[];
}
```

#### CameraFeed

Individual camera feed component with WebSocket connection.

```typescript
interface CameraFeedProps {
  cameraId: string;
  cameraName: string;
  source: 'usb' | 'ip' | 'phone';
  url?: string;
  sensitivity: number;
  showMotionOverlay: boolean;
  onScreenshot: () => void;
  isRecording: boolean;
  motionEvents: MotionEvent[];
  fullScreen?: boolean;
}

interface CameraFeedHandle {
  takeScreenshot: () => void;
  startRecording: () => void;
  stopRecording: () => void;
}
```

### Backend Server (Expected)

The UI expects a WebSocket server at `ws://localhost:8080` (configurable) with the following endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stream/phone/:deviceId` | WS | Phone camera stream |
| `/stream/usb/:deviceNum` | WS | USB camera stream |
| `/stream/ip/:url` | WS | IP camera stream |
| `/api/cameras` | GET | List available cameras |
| `/api/cameras` | POST | Add new camera |
| `/api/cameras/:id` | DELETE | Remove camera |

---

## Error Handling

### Connection States

| State | UI Display | Action |
|-------|------------|--------|
| `connecting` | Pulsing yellow dot | Auto-retry in background |
| `connected` | Green dot | Normal operation |
| `disconnected` | Red dot | Show error, attempt reconnect |

### Auto-Reconnect Strategy

- **Initial delay:** 1 second
- **Max delay:** 30 seconds
- **Backoff:** Exponential (1s, 2s, 4s, 8s, ... 30s)
- **Max attempts:** Unlimited (with backoff)

### Error Codes

| Code | Description | User Message |
|------|-------------|--------------|
| `CONNECTION_REFUSED` | Server not running | "Unable to connect to camera server" |
| `DEVICE_NOT_FOUND` | Camera unavailable | "Camera not found. Check connection." |
| `PERMISSION_DENIED` | Access denied | "Permission denied. Check camera access." |
| `STREAM_ERROR` | Stream interrupted | "Stream interrupted. Reconnecting..." |
| `TIMEOUT` | No data received | "Camera timeout. Reconnecting..." |

---

## Future Enhancements

### Planned Features

1. **Multi-stream support** - Simultaneous feeds from multiple cameras
2. **Recording playback** - Review recorded motion events
3. **Motion history** - Heatmap of motion patterns over time
4. **Alert configuration** - Push notifications for motion events
5. **Camera PTZ control** - Pan/tilt/zoom for supported cameras
6. **Schedule-based recording** - Record only during certain times
7. **Cloud storage** - Optional cloud backup of recordings

---

## Changelog

### v1.0.0 (2026-03-14)

- Initial draft specification
- WebSocket connection protocol defined
- Video streaming format defined
- Motion detection visualization documented
- Error handling strategy defined