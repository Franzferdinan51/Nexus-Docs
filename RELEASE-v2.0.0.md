# Release v2.0.0 - NexusDocs Intelligence Platform

**Release Date:** March 15, 2026

---

## 🎉 Major Release: Unified Intelligence Platform

This release merges four powerful systems into one unified platform:

| Component | Description | Status |
|-----------|-------------|--------|
| **NexusDocs Core** | Document intelligence and AI analysis | ✅ Production |
| **Palantir Home** | Smart home dashboard and automation | ✅ Integrated |
| **MotionCam** | Real-time camera monitoring and motion detection | ✅ Integrated |
| **Serenity-Forensics** | Phone forensics and evidence extraction | ✅ Integrated |

---

## 🚀 What's New

### Document Intelligence (NexusDocs Core)

#### 🧠 Hybrid Swarm Architecture

Run multiple AI providers simultaneously with consensus-based validation:

| Provider | Type | Best For |
|----------|------|----------|
| **Gemini** | Cloud | High-quality analysis, multimodal |
| **OpenRouter** | Cloud | Model variety, fallback |
| **LM Studio** | Local | Privacy, offline use |
| **OpenClaw** | Cloud | Bailian models (Qwen, Kimi, MiniMax) |

**Features:**
- Parallel analysis across providers
- Consensus engine with `[SWARM CONFIRMED]` markers
- Automatic failover if primary provider fails
- Resilient multi-model pipeline

#### ⚡ Dual-Check Verification Pipeline

A two-stage verification system for high-priority documents:

```
Fast Lane (Local/Small Model) → Initial Scan
        ↓
High-Priority Entity Detected? → Mark "VERIFYING"
        ↓
Background Verifier (Large Model) → Double-Check
        ↓
Result: High throughput + High accuracy
```

**Benefits:**
- Throughput of small models
- Accuracy of large models
- Non-blocking background verification

#### 📊 Analysis Features

| Feature | Description |
|---------|-------------|
| **Entity Extraction** | Automatic detection of people, organizations, locations, dates |
| **Timeline Reconstruction** | Chronological event extraction from documents |
| **Verified Individuals Ledger** | Live, sorted ledger of confirmed entities |
| **Confidence Scoring** | 0-100% confidence per document |
| **Chain of Thought** | Step-by-step reasoning in AI analysis |
| **Geographic Matrix** | Hotspot visualization from extracted locations |

#### 🎥 Media Support

| Type | Formats | Analysis |
|------|---------|----------|
| **Video** | MP4, MOV | Gemini multimodal analysis |
| **Audio** | MP3, WAV | Transcription + analysis |
| **Images** | JPEG, PNG | OCR + vision analysis |
| **Documents** | PDF | OCR + text extraction |

---

### Camera Monitoring (MotionCam)

#### 📹 Multi-Source Camera Support

| Source | Configuration | Use Case |
|--------|---------------|----------|
| **USB Webcam** | `/dev/video0` | Local monitoring |
| **RTSP/ONVIF** | `rtsp://...` | IP cameras, security |
| **Android ADB** | Wireless/USB | Phone as camera |

#### 🔍 Motion Detection

**Algorithm:** MOG2 Background Subtraction

```
Frame Capture → Background Subtraction → Thresholding
       ↓
Morphological Operations → Contour Detection
       ↓
Area Filtering → Bounding Box Generation
```

**Configurable Parameters:**

| Parameter | Range | Default | Effect |
|-----------|-------|---------|--------|
| `threshold` | 5-100 | 25 | Motion sensitivity |
| `minArea` | 100-5000 | 500 | Ignore small movements |
| `maxArea` | 10000-100000 | 50000 | Ignore large movements |
| `blurSize` | Odd | 21 | Noise reduction |

#### 🌐 Real-Time Streaming

- **WebSocket** video broadcast to web clients
- **HTTP API** for start/stop/configure
- **Event Logging** with timestamps
- **Multi-Camera Grid** view (4+ cameras)

---

### Smart Home (Palantir Home)

#### 🏠 Dashboard Features

| Feature | Description |
|---------|-------------|
| **Real-Time Widgets** | Live monitoring panels |
| **Device Status** | Track connected devices |
| **Automation Triggers** | Define rules for alerts |
| **Alert Notifications** | Instant WebSocket alerts |
| **Storage Management** | Auto-cleanup, retention policies |

#### 🔗 Integration Points

- Cross-platform state synchronization
- OpenClaw Gateway connectivity
- Local model inference support
- Unified API endpoints

---

### Phone Forensics (Serenity-Forensics)

#### 📱 Android Extraction (ADB)

| Data Type | Method | Output |
|-----------|--------|--------|
| SMS/MMS | `content://sms/` | JSON, CSV |
| Call Logs | `content://call_log/calls` | JSON |
| Contacts | `content://contacts/` | JSON, VCF |
| Photos | `adb pull` | JPEG + EXIF |
| Location | Google Takeout | JSON |
| Apps | `pm list packages` | TXT |

#### 🍎 iOS Extraction

| Data Type | Source | Status |
|-----------|--------|--------|
| iMessages | iTunes Backup | ✅ Supported |
| Photos | Backup MDM domain | ✅ Supported |
| Metadata | Info.plist | ✅ Supported |

#### 🔍 Analysis Features

**Red Flag Detection:**

| Severity | Description | Examples |
|----------|-------------|----------|
| 🔴 HIGH | Direct evidence | Sneaking out, dating apps |
| 🟠 ELEVATED | Indirect indicators | Sideloaded APKs, unknown apps |
| 🟡 MEDIUM | Behavioral concerns | Late-night activity, new contacts |
| ℹ️ INFO | Contextual data | Account info, app inventory |

**Categories:**
- `SNEAKING_OUT` - Physical rule violations
- `DATING_APPS` - Age-restricted platform usage
- `CONCEALMENT` - Hiding content/apps
- `LATE_NIGHT` - Sleep-hour device usage
- `SOCIAL_MEDIA` - Platform-specific activity

**Automatic Detection:**
- Verification codes from SMS (Yubo, Tinder, Snapchat, etc.)
- Hidden folders (`.gs_fs0`, `.thumbnails`)
- Trashed files (`.trashed-*`)
- Vault apps (PhotoVault, Keepsafe)
- Sideloaded APKs

#### 📂 Evidence Organization

```
case-name/
├── device/           # Device information
├── apps/             # Application inventory
├── app_exports/      # Per-app data exports
├── calls/            # Call logs
├── contacts/         # Contact list
├── media/            # Photos, videos
│   ├── DCIM/
│   └── Pictures/
└── reports/
    ├── wrongdoing_evidence/
    ├── media_triage/
    ├── telephony_dumps/
    └── hidden_and_trashed_evidence/
```

---

## 🔧 Improvements

### Performance
- Optimized document processing pipeline
- Faster entity extraction with caching
- Reduced memory footprint for large documents

### Reliability
- Automatic failover between AI providers
- Graceful degradation when providers unavailable
- Better error handling and recovery

### User Experience
- Enhanced settings panel with model selection
- Improved configuration UI
- Better feedback during processing

### Security
- CORS validation for local endpoints
- Improved API key handling
- Better isolation between providers

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.2.0 | UI framework |
| @google/generative-ai | 0.21.0 | Gemini integration |
| lucide-react | 0.344.0 | Icons |
| tesseract.js | 7.0.0 | Offline OCR |
| vite | 5.1.4 | Build tool |

---

## ⚠️ Breaking Changes

### Configuration Structure

**Before (v1.0.0):**
```json
{
  "priority": ["gemini", "openrouter", "lmstudio"],
  "enabled": {
    "gemini": true,
    "openrouter": false,
    "lmstudio": false
  }
}
```

**After (v2.0.0):**
```json
{
  "priority": ["gemini", "openrouter", "lmstudio", "lmstudio2", "openclaw"],
  "enabled": {
    "gemini": true,
    "openrouter": false,
    "lmstudio": false,
    "lmstudio2": false,
    "openclaw": false
  }
}
```

### Metadata Changes

| Property | Before | After |
|----------|--------|-------|
| `name` | "Epstein Nexus: Document Intelligence" | "NexusDocs Intelligence Platform" |
| `description` | Focused on Epstein docs | Unified intelligence platform |
| `version` | 1.0.0 | 2.0.0 |

---

## 🔄 Migration Guide: v1.x → v2.x

### Step 1: Backup Existing Data

```javascript
// Export existing data (optional)
const data = localStorage.getItem('nexusdocs-config');
console.log('Backup:', data);
```

### Step 2: Update Configuration

```json
{
  "priority": ["gemini", "openrouter", "lmstudio", "lmstudio2", "openclaw"],
  "enabled": {
    "gemini": true,
    "openrouter": false,
    "lmstudio": false,
    "lmstudio2": false,
    "openclaw": false
  },
  "dualCheckMode": false,
  "preferredVerifier": "auto",
  "parallelAnalysis": false
}
```

### Step 3: Clear Old Data (Optional)

```javascript
// Clear localStorage
localStorage.clear();

// Clear IndexedDB
indexedDB.deleteDatabase('epstein_nexus_db');

// Reload page
location.reload();
```

### Step 4: Re-configure API Keys

Navigate to **Settings** and re-enter your API keys:
- Gemini API Key
- OpenRouter API Key
- LM Studio Endpoint (if using local)
- OpenClaw Endpoint (if using Bailian models)

---

## 🐛 Bug Fixes

| Issue | Fix |
|-------|-----|
| Parallel agent race conditions | Added mutex locks and proper sequencing |
| LM Studio CORS detection | Improved endpoint validation |
| PDF processing memory leak | Implemented proper cleanup |
| Entity extraction duplicates | Added deduplication layer |
| Timeline sorting errors | Fixed date parsing edge cases |

---

## 📚 Known Issues

| Issue | Status | Workaround |
|-------|--------|------------|
| Large PDFs (>100MB) may timeout | Investigating | Split PDF into smaller files |
| iOS backup parsing limited | Planned | Use unencrypted backups |
| WhatsApp messages encrypted | Known limitation | Extract media only |
| RTSP cameras may require authentication | Documented | Include credentials in URL |

---

## 📅 Roadmap

### v2.1.0 (Planned: Q2 2026)

- [ ] Local Transcription (Whisper.cpp)
- [ ] Mobile App (React Native)
- [ ] Plugin System for custom modules
- [ ] Advanced Analytics Dashboard
- [ ] Multi-language OCR support

### v2.2.0 (Planned: Q3 2026)

- [ ] Facial Recognition with Known Faces Database
- [ ] Object Detection (80+ COCO classes)
- [ ] Cloud Sync (S3, Google Drive)
- [ ] Real-Time Collaboration
- [ ] Enhanced Timeline Visualization

### v3.0.0 (Planned: Q4 2026)

- [ ] Full graph visualization (D3.js/Cytoscape)
- [ ] ML-based anomaly detection
- [ ] Predictive analytics
- [ ] Enterprise SSO integration

---

## 🔒 Privacy & Security

### Data Handling

| Aspect | Approach |
|--------|----------|
| **Document Storage** | IndexedDB (browser local storage) |
| **API Keys** | localStorage (client-side only) |
| **Cloud Processing** | User-configurable per provider |
| **Local Processing** | LM Studio (no external calls) |

### Security Best Practices

- ✅ Never store API keys in code
- ✅ Use environment variables for sensitive config
- ✅ Enable CORS only for trusted origins
- ✅ Use HTTPS in production
- ✅ Implement rate limiting for public deployments

---

## 🙏 Contributors

| Component | Team |
|-----------|------|
| NexusDocs Core | Core Development Team |
| Palantir Home | Integration Team |
| MotionCam | Camera Systems Team |
| Serenity-Forensics | Forensics Team |
| OpenClaw Integration | AI Infrastructure Team |

---

## 📞 Support

- **GitHub Issues:** https://github.com/Franzferdinan51/nexusdocs-intelligence/issues
- **Documentation:** See `docs/` directory
- **Discussions:** GitHub Discussions

---

**Full Changelog**: https://github.com/Franzferdinan51/nexusdocs-intelligence/compare/v1.0.0...v2.0.0

---

*Release Notes v2.0.0 | March 15, 2026*