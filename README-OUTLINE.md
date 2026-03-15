# NexusDocs Intelligence Platform - README Outline

**Version:** 2.0.0 (Merged Release)
**Last Updated:** March 14, 2026

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Merged Feature Overview](#merged-feature-overview)
   - NexusDocs Core
   - Palantir Home Integration
   - MotionCam Camera System
3. [Installation Instructions](#installation-instructions)
4. [LM Studio Configuration](#lm-studio-configuration)
5. [OpenClaw Integration](#openclaw-integration)
6. [MotionCam Camera Setup](#motioncam-camera-setup)
7. [Usage Examples](#usage-examples)
8. [Configuration Reference](#configuration-reference)
9. [Troubleshooting](#troubleshooting)
10. [Roadmap](#roadmap)
11. [License](#license)

---

## 🎯 Project Overview

**NexusDocs Intelligence Platform** is a privacy-first, local-first AI platform designed for high-throughput document analysis, entity extraction, and intelligence gathering. This release merges three powerful systems:

- **NexusDocs Core** - Document intelligence and AI analysis
- **Palantir Home** - Smart home dashboard and automation
- **MotionCam** - Real-time camera monitoring and surveillance

---

## 🔀 Merged Feature Overview

### 📚 NexusDocs Core

**Hybrid Swarm Architecture**
- Parallel Swarm: Run multiple AI agents (Gemini, OpenRouter, LM Studio, OpenClaw) simultaneously
- Consensus Engine: Cross-validation to reduce hallucinations
- Resilient Failover: Automatic routing to available providers

**Document Processing**
- PDF processing with OCR (Tesseract.js)
- Video/Audio analysis (Gemini multimodal)
- Entity extraction and timeline reconstruction
- Verified Individuals Ledger

**AI Analysis Features**
- Chain of Thought (CoT) reasoning
- Confidence scoring (0-100%)
- Timeline reconstruction
- POI flagging and alerting

### 🏠 Palantir Home Integration

*Smart home dashboard features merged into NexusDocs platform.*

**Dashboard Components**
- Real-time monitoring widgets
- Device status panels
- Automation triggers
- Alert notifications

**Integration Points**
- OpenClaw Gateway connectivity
- Local model inference support
- Cross-platform synchronization

### 📹 MotionCam Camera System

*Real-time camera monitoring and visual analysis.*

**Camera Support**
- USB webcam integration (/dev/video0)
- RTSP/ONVIF IP cameras
- Android phone camera via ADB
- Multi-camera grid view

**Visual Analysis**
- AI-powered object detection
- Motion detection alerts
- Screenshot capture and analysis
- Integration with NexusDocs document pipeline

---

## 🚀 Installation Instructions

### Prerequisites

- **Node.js**: v18 or higher
- **npm** or **yarn**
- **LM Studio** (optional, for local inference)
- **OpenClaw Gateway** (optional, for Bailian models)

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

## ⚙️ LM Studio Configuration

### Step 1: Install LM Studio

Download from [lmstudio.ai](https://lmstudio.ai) and install on your machine.

### Step 2: Load a Model

1. Open LM Studio
2. Go to the **Developer** tab
3. Download a vision-capable model (recommended):
   - `qwen3-vl-8b` - Vision + reasoning
   - `jan-v2-vl-med` - Medium quality vision
   - `llava-v1.6` - Alternative vision model

### Step 3: Start the Server

1. Click **Start Server** in the Developer tab
2. Default port: `1234`
3. **Enable CORS** in settings

### Step 4: Configure NexusDocs

Navigate to **Settings** in NexusDocs:

```json
{
  "lmStudioEndpoint": "http://127.0.0.1:1234",
  "lmStudioModel": "qwen3-vl-8b",
  "enabled": {
    "lmstudio": true
  }
}
```

### Multi-Instance Setup

Connect multiple LM Studio instances for parallel processing:

```json
{
  "lmStudioEndpoint": "http://127.0.0.1:1234",
  "lmStudioEndpoint2": "http://192.168.1.100:1234",
  "lmStudioModel": "qwen3-vl-8b",
  "lmStudioModel2": "llava-v1.6"
}
```

### Vision Test

Verify vision capability:

```bash
curl http://127.0.0.1:1234/v1/models
```

---

## 🦆 OpenClaw Integration

### What is OpenClaw?

OpenClaw is an AI agent framework that provides access to Bailian models (Qwen, MiniMax, Kimi) with generous free quotas.

### Configuration

1. Ensure OpenClaw Gateway is running:
   ```bash
   openclaw gateway start
   ```

2. Configure NexusDocs:
   ```json
   {
     "openClawEndpoint": "http://localhost:18789",
     "openClawModel": "bailian/qwen3.5-plus",
     "enabled": {
       "openclaw": true
     }
   }
   ```

### Available Models

| Model | Context | Cost | Best For |
|-------|---------|------|----------|
| `bailian/qwen3.5-plus` | 1M | 18K/mo | Main analysis |
| `bailian/MiniMax-M2.5` | 196k | FREE | Sub-agents |
| `bailian/kimi-k2.5` | 196k | FREE | Vision tasks |
| `bailian/glm-5` | 128k | API credits | Fast coding |

### Testing Connection

```bash
curl http://localhost:18789/health
```

---

## 📷 MotionCam Camera Setup

### USB Camera Setup

1. Connect USB webcam
2. Verify device:
   ```bash
   ls /dev/video*
   ```

3. Configure in NexusDocs:
   ```json
   {
     "cameras": [{
       "id": "usb-0",
       "type": "usb",
       "device": "/dev/video0",
       "name": "USB Webcam"
     }]
   }
   ```

### Android Phone Camera (ADB)

1. Enable USB debugging on phone
2. Connect via USB
3. Authorize ADB connection
4. Configure:
   ```json
   {
     "cameras": [{
       "id": "phone-0",
       "type": "adb",
       "device": "192.168.1.251:34341",
       "name": "Grow Tent Phone"
     }]
   }
   ```

### RTSP/IP Camera

1. Obtain RTSP URL from camera
2. Configure:
   ```json
   {
     "cameras": [{
       "id": "ip-0",
       "type": "rtsp",
       "url": "rtsp://user:pass@192.168.1.50:554/stream",
       "name": "Front Door Camera"
     }]
   }
   ```

### Multi-Camera Grid

View all cameras simultaneously at `http://localhost:8082`

---

## 💡 Usage Examples

### Document Analysis

```typescript
// Upload and analyze a document
const doc = await processPdf(file);
const analysis = await analyzeWithLMStudio(
  doc.content,
  doc.images,
  "http://127.0.0.1:1234"
);
console.log(analysis.entities);
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

### Camera Capture & Analysis

```bash
# Capture from USB camera
ffmpeg -y -f v4l2 -i /dev/video0 -vframes 1 capture.jpg

# Analyze with vision model
# Upload capture.jpg to NexusDocs
```

### Entity Extraction

```typescript
// Extract entities from document
const entities = analysis.entities.map(e => ({
  name: e.name,
  role: e.role,
  isFamous: e.isFamous
}));
```

---

## 📖 Configuration Reference

### ModelConfig Interface

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
  geminiKey: string;
  geminiModel: string;
  openRouterModel: string;
  openRouterKey: string;
  lmStudioEndpoint: string;
  lmStudioModel: string;
  lmStudioEndpoint2: string;
  lmStudioModel2: string;
  openClawEndpoint: string;
  openClawModel: string;
  dualCheckMode: boolean;
  preferredVerifier: 'auto' | 'gemini' | 'openrouter' | 'lmstudio' | 'lmstudio2' | 'openclaw';
  parallelAnalysis: boolean;
}
```

### Environment Variables

Create `.env.local`:

```env
VITE_GEMINI_API_KEY=your_key_here
VITE_OPENROUTER_API_KEY=your_key_here
```

---

## ❓ Troubleshooting

### LM Studio Not Connecting

- Ensure LM Studio is running in **Server Mode**
- Verify CORS is enabled in Developer settings
- Check firewall allows port 1234
- Try `http://127.0.0.1:1234/v1/models` in browser

### OpenClaw Connection Failed

- Run `openclaw gateway status`
- Check port 18789 is available
- Verify OpenClaw is installed: `openclaw --version`

### Camera Not Detected

- Check device permissions: `ls -la /dev/video*`
- Add user to video group: `sudo usermod -aG video $USER`
- For ADB: verify device is authorized

### Vision Analysis Fails

- Use a vision-capable model (check model name contains "vl" or "vision")
- Verify image format (JPEG, PNG)
- Check image size (< 10MB recommended)

---

## 📅 Roadmap

- [x] **Hybrid Swarm Architecture** - Multi-provider parallel analysis
- [x] **Dual-Check Mode** - Cross-verification pipeline
- [x] **Native Video/Audio** - MP4/MP3 ingestion
- [x] **Offline OCR** - Tesseract.js integration
- [x] **OpenClaw Integration** - Bailian model support
- [x] **MotionCam Merge** - Camera monitoring system
- [ ] **Palantir Home Dashboard** - Full smart home integration
- [ ] **Local Transcription** - Whisper.cpp for audio
- [ ] **Mobile App** - React Native companion
- [ ] **Plugin System** - Custom analysis modules

---

## 📄 License

MIT License

---

## 🙏 Credits

- **NexusDocs Core** - Document intelligence platform
- **Palantir Home** - Smart home dashboard
- **MotionCam** - Camera monitoring system
- **OpenClaw** - AI agent framework
- **LM Studio** - Local LLM inference
- **Tesseract.js** - Browser OCR

---

*Last Updated: March 14, 2026*
*Version: 2.0.0*