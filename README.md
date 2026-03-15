![NexusDocs Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

# NexusDocs Intelligence Platform

**Version:** 2.0.0  
**Release Date:** March 15, 2026

**NexusDocs Intelligence Platform** is a privacy-first, local-first AI platform that combines document analysis, real-time monitoring, motion detection, and phone forensics into one unified system.

---

## ⚠️ LEGAL WARNING

**Only use this on devices you own or have permission to monitor.**

- ✅ **Legal use:** Parents monitoring minor children, IT admins managing company devices, analyzing your own devices
- ❌ **Illegal use:** Spying on someone without consent, stalking, unauthorized access

Using this tool to access devices you don't own or have explicit permission to monitor is illegal. Don't be creepy. Don't break the law.

**By using this software, you agree to use it responsibly and legally.**

---

## 🚀 Platform Overview

NexusDocs v2.0.0 merges four powerful systems:

| Component | Description | Status |
|-----------|-------------|--------|
| **NexusDocs Core** | Document intelligence, entity extraction, AI analysis | ✅ Production |
| **Palantir Home** | Smart home dashboard, automation triggers | ✅ Integrated |
| **MotionCam** | Real-time camera monitoring, motion detection | ✅ Integrated |
| **Serenity-Forensics** | Phone forensics, evidence extraction, analysis | ✅ Integrated |

---

## 📋 Feature Matrix

### Document Intelligence (NexusDocs Core)

| Feature | Description |
|---------|-------------|
| **Hybrid Swarm Architecture** | Run multiple AI providers (Gemini, OpenRouter, LM Studio, OpenClaw) simultaneously |
| **Consensus Engine** | Cross-validation to reduce hallucinations with `[SWARM CONFIRMED]` markers |
| **Dual-Check Pipeline** | Fast scan + background verification for high-priority entities |
| **Entity Extraction** | Automatic detection of people, organizations, locations, dates |
| **Timeline Reconstruction** | Chronological event extraction from documents |
| **Verified Individuals Ledger** | Live, sorted ledger of confirmed entities |
| **Native Video/Audio** | MP4, MOV, MP3, WAV ingestion with Gemini multimodal |
| **Offline OCR** | Tesseract.js for local image text extraction |
| **Confidence Scoring** | 0-100% confidence per document |
| **Chain of Thought** | Step-by-step reasoning in AI analysis |

### Camera Monitoring (MotionCam)

| Feature | Description |
|---------|-------------|
| **Multi-Source Support** | USB webcam, RTSP/ONVIF IP cameras, Android ADB |
| **MOG2 Motion Detection** | Background subtraction with configurable sensitivity |
| **Real-Time Streaming** | WebSocket video broadcast to web clients |
| **Auto-Capture** | Automatic snapshots on motion detection |
| **Bounding Box Visualization** | Green overlay on detected motion |
| **Event Logging** | Timestamped motion events with metadata |
| **Multi-Camera Grid** | View 4+ cameras simultaneously |
| **HTTP API Control** | Start/stop/configure via REST endpoints |

### Smart Home (Palantir Home)

| Feature | Description |
|---------|-------------|
| **Real-Time Dashboard** | Live monitoring widgets for all systems |
| **Device Status Panels** | Track connected devices and services |
| **Automation Triggers** | Define rules for alerts and actions |
| **Alert Notifications** | Instant alerts via WebSocket |
| **Cross-Platform Sync** | Synchronize state across devices |
| **Storage Management** | Auto-cleanup, retention policies |

### Phone Forensics (Serenity-Forensics)

| Feature | Description |
|---------|-------------|
| **ADB Extraction** | SMS, MMS, call logs, contacts, photos, location |
| **iOS Backup Parsing** | iMessages, photos from iTunes backups |
| **Media Metadata** | EXIF extraction (GPS, timestamps, device info) |
| **Verification Code Detection** | Automatic extraction of OTP codes |
| **Hidden Content Detection** | Find trashed files, hidden folders, vault apps |
| **Evidence Organization** | Structured folder hierarchy for case files |
| **Red Flag Analysis** | Pattern-based concerning behavior detection |
| **Timeline Generation** | Unified timeline from multiple data sources |

---

## 🛠️ Installation

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | v18+ | Required for NexusDocs Core |
| **Python** | 3.9+ | Required for MotionCam and Palantir |
| **ADB** | Latest | Required for Serenity-Forensics |
| **LM Studio** | Optional | For local LLM inference |
| **OpenClaw Gateway** | Optional | For Bailian model access |

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Franzferdinan51/nexusdocs-intelligence.git
cd nexusdocs-intelligence

# Install dependencies
npm install

# Start development server
npm run dev
```

Access the dashboard at `http://localhost:5173`.

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Deployment

```bash
# Build Docker image
docker build -t nexusdocs .

# Run container
docker run -p 5173:5173 nexusdocs
```

---

## ⚙️ Configuration Guide

### Environment Variables

Create a `.env.local` file:

```env
# Gemini API (for cloud analysis)
VITE_GEMINI_API_KEY=your_gemini_key

# OpenRouter API (alternative cloud provider)
VITE_OPENROUTER_API_KEY=your_openrouter_key

# OpenClaw Gateway (Bailian models)
VITE_OPENCLAW_ENDPOINT=http://localhost:18789
VITE_OPENCLAW_MODEL=bailian/qwen3.5-plus
```

### Model Configuration

```typescript
interface ModelConfig {
  priority: ('gemini' | 'openrouter' | 'lmstudio' | 'lmstudio2' | 'openclaw')[];
  enabled: {
    gemini: boolean;
    openrouter: boolean;
    lmstudio: boolean;
    lmstudio2: boolean;
    openclaw: boolean;
  };
  dualCheckMode: boolean;
  preferredVerifier: 'auto' | 'gemini' | 'openrouter' | 'lmstudio' | 'openclaw';
  parallelAnalysis: boolean;
}
```

### LM Studio Setup

1. **Install LM Studio** from [lmstudio.ai](https://lmstudio.ai)
2. **Load a model** (recommended: `qwen3-vl-8b` for vision)
3. **Start Server** in Developer tab (default port: 1234)
4. **Enable CORS** in LM Studio settings
5. **Configure NexusDocs**:
   ```json
   {
     "lmStudioEndpoint": "http://127.0.0.1:1234",
     "lmStudioModel": "qwen3-vl-8b",
     "enabled": { "lmstudio": true }
   }
   ```

### OpenClaw Integration

OpenClaw provides access to Bailian models with generous free quotas:

| Model | Context | Cost | Best For |
|-------|---------|------|----------|
| `bailian/qwen3.5-plus` | 1M tokens | 18K/mo quota | Main analysis |
| `bailian/MiniMax-M2.5` | 196k tokens | ✅ FREE | Sub-agents |
| `bailian/kimi-k2.5` | 196k tokens | ✅ FREE | Vision tasks |
| `bailian/glm-5` | 128k tokens | API credits | Fast coding |

**Configuration:**
```bash
# Start OpenClaw Gateway
openclaw gateway start

# Verify connection
curl http://localhost:18789/health
```

---

## 📷 Camera Setup (MotionCam)

### USB Webcam

```bash
# Verify device
ls /dev/video*

# Configure in settings
```
```json
{
  "cameras": [{
    "id": "usb-0",
    "type": "usb",
    "device": "/dev/video0",
    "name": "USB Webcam",
    "width": 1280,
    "height": 720,
    "fps": 30
  }]
}
```

### Android Phone Camera (ADB)

```bash
# Enable USB debugging on phone
# Settings → Developer Options → USB Debugging

# Connect and authorize
adb devices

# Configure wireless ADB (optional)
adb tcpip 5555
adb connect 192.168.1.251:5555
```

```json
{
  "cameras": [{
    "id": "phone-0",
    "type": "adb",
    "device": "192.168.1.251:5555",
    "name": "Android Phone"
  }]
}
```

### RTSP/IP Camera

```json
{
  "cameras": [{
    "id": "ip-0",
    "type": "rtsp",
    "url": "rtsp://user:pass@192.168.1.50:554/stream",
    "name": "IP Camera"
  }]
}
```

### Motion Detection Configuration

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `threshold` | 5-100 | 25 | Motion sensitivity (lower = more sensitive) |
| `minArea` | 100-5000 | 500 | Minimum contour area (pixels) |
| `maxArea` | 10000-100000 | 50000 | Maximum contour area (pixels) |
| `blurSize` | Odd numbers | 21 | Gaussian blur kernel |

---

## 📱 Phone Forensics (Serenity-Forensics)

### Android Extraction

```bash
# Enable USB debugging
# Settings → About Phone → Tap "Build Number" 7 times
# Settings → Developer Options → USB Debugging → ON

# Verify connection
adb devices

# Extract data
adb shell content query --uri content://sms/ > sms.txt
adb pull /sdcard/DCIM/ ./media/
```

### Data Types Extracted

| Data Type | Method | Output |
|-----------|--------|--------|
| SMS/MMS | `content://sms/` | JSON, CSV |
| Call Logs | `content://call_log/calls` | JSON |
| Contacts | `content://contacts/` | JSON, VCF |
| Photos | `adb pull /sdcard/DCIM/` | JPEG + EXIF |
| Location | Google Takeout | JSON |
| Apps | `pm list packages` | TXT |

### Evidence Organization

```
case-name/
├── device/
│   └── device_info.txt
├── apps/
│   ├── user_installed_packages.txt
│   └── app_permissions.csv
├── app_exports/
│   ├── google_messages/
│   ├── whatsapp/
│   └── snapchat/
├── calls/
│   └── call_log_raw.txt
├── contacts/
│   └── contacts_raw.txt
├── media/
│   ├── DCIM/
│   └── Pictures/
└── reports/
    ├── wrongdoing_evidence/
    ├── media_triage/
    └── telephony_dumps/
```

### Red Flag Detection

Serenity-Forensics automatically detects:
- 🔴 **HIGH** - Direct evidence of rule violations
- 🟠 **ELEVATED** - Indirect indicators
- 🟡 **MEDIUM** - Behavioral concerns
- ℹ️ **INFO** - Contextual data

**Categories:**
- `SNEAKING_OUT` - Physical rule violations
- `DATING_APPS` - Age-restricted platform usage
- `CONCEALMENT` - Hiding content/apps
- `LATE_NIGHT` - Sleep-hour device usage
- `SOCIAL_MEDIA` - Platform-specific activity

---

## 💡 Usage Examples

### Document Analysis

```typescript
// Upload and analyze a document
const doc = await processPdf(file);
const analysis = await analyzeWithSwarm(doc.content, doc.images);
console.log(analysis.entities);
// Output: [{ name: "John Doe", role: "Executive", isFamous: true, ... }]
```

### Parallel Swarm Analysis

```typescript
// Configure parallel analysis
config.parallelAnalysis = true;
config.enabled = {
  gemini: true,
  lmstudio: true,
  openclaw: true
};

// All providers analyze simultaneously
// Consensus engine cross-validates results
```

### Camera Monitoring

```javascript
// WebSocket video streaming
const socket = io('http://localhost:8765');
socket.on('video_frame', (data) => {
  document.getElementById('video').src = 'data:image/jpeg;base64,' + data.frame;
  if (data.motion) {
    console.log('Motion detected!', data.boxes);
  }
});
```

### Phone Extraction

```python
# Python extraction script
import subprocess

def extract_sms():
    result = subprocess.run(
        ['adb', 'shell', 'content', 'query', '--uri', 'content://sms/'],
        capture_output=True, text=True
    )
    return parse_sms_output(result.stdout)
```

---

## 📖 API Reference

### REST Endpoints

#### Document Analysis

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents` | POST | Upload document for analysis |
| `/api/documents/:id` | GET | Get document analysis results |
| `/api/entities` | GET | Get verified entities ledger |
| `/api/timeline` | GET | Get reconstructed timeline |

#### Camera Control

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cameras` | GET | List all cameras |
| `/api/cameras/:id/start` | POST | Start monitoring |
| `/api/cameras/:id/stop` | POST | Stop monitoring |
| `/api/cameras/:id/snapshot` | POST | Take manual snapshot |
| `/api/events` | GET | Get motion events |

#### Phone Forensics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nexus/devices` | GET | List connected devices |
| `/api/nexus/extract/sms` | POST | Extract SMS messages |
| `/api/nexus/extract/calls` | POST | Extract call logs |
| `/api/nexus/extract/photos` | POST | Extract photos with EXIF |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `video_frame` | Server → Client | `{ frame, motion, fps, boxes }` |
| `motion_detected` | Server → Client | `{ timestamp, area, boxes }` |
| `snapshot_saved` | Server → Client | `{ path, reason }` |
| `status_update` | Server → Client | `{ running, motion_detected, count }` |

---

## ❓ Troubleshooting

### LM Studio Not Connecting

- ✅ Ensure LM Studio is running in **Server Mode**
- ✅ Verify CORS is enabled in Developer settings
- ✅ Check firewall allows port 1234
- ✅ Test: `curl http://127.0.0.1:1234/v1/models`

### OpenClaw Connection Failed

- ✅ Run `openclaw gateway status`
- ✅ Check port 18789 is available
- ✅ Verify OpenClaw is installed: `openclaw --version`

### Camera Not Detected

- ✅ Check device permissions: `ls -la /dev/video*`
- ✅ Add user to video group: `sudo usermod -aG video $USER`
- ✅ For ADB: verify device is authorized (`adb devices`)

### Vision Analysis Fails

- ✅ Use a vision-capable model (check name contains "vl" or "vision")
- ✅ Verify image format (JPEG, PNG)
- ✅ Check image size (< 10MB recommended)

### ADB Device Unauthorized

- ✅ Enable USB debugging on device
- ✅ Accept RSA key authorization prompt on device
- ✅ Revoke and re-authorize: `adb kill-server && adb start-server`

---

## 📅 Roadmap

### Completed (v2.0.0)

- [x] Hybrid Swarm Architecture
- [x] Dual-Check Verification Pipeline
- [x] Native Video/Audio Support
- [x] Offline OCR (Tesseract.js)
- [x] OpenClaw Integration
- [x] MotionCam Merge
- [x] Palantir Home Integration
- [x] Serenity-Forensics Integration

### Planned (v2.1.0)

- [ ] Local Transcription (Whisper.cpp)
- [ ] Mobile App (React Native)
- [ ] Plugin System
- [ ] Advanced Analytics Dashboard
- [ ] Multi-Language OCR

### Planned (v2.2.0)

- [ ] Facial Recognition with Known Faces Database
- [ ] Object Detection (80+ COCO classes)
- [ ] Cloud Sync (S3, Google Drive)
- [ ] Real-Time Collaboration

---

## 🔒 Privacy & Security

- **Local First**: Files processed in browser or sent to local LM Studio
- **No Central Persistence**: Documents stored in IndexedDB (browser storage)
- **Keys Local**: API keys stored in localStorage on your device
- **Configurable**: Choose which providers to enable

---

## 📄 License

MIT License

---

## 🙏 Credits

| Component | Source |
|-----------|--------|
| **NexusDocs Core** | Document intelligence platform |
| **Palantir Home** | Smart home dashboard |
| **MotionCam** | Camera monitoring system |
| **Serenity-Forensics** | Phone forensics toolkit |
| **OpenClaw** | AI agent framework |
| **LM Studio** | Local LLM inference |
| **Tesseract.js** | Browser OCR |

---

**Version:** 2.0.0  
**Last Updated:** March 15, 2026  
**Repository:** https://github.com/Franzferdinan51/nexusdocs-intelligence