# Changelog

All notable changes to the NexusDocs Intelligence Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-15

### Added

#### Platform
- **Merged Release**: Combined NexusDocs, Palantir Home, MotionCam, Serenity-Forensics into unified platform
- **Unified Architecture**: Single platform for document analysis, camera monitoring, smart home, and phone forensics
- **Comprehensive Documentation**: README with all 4 components, feature matrix, installation guides

#### Document Intelligence (NexusDocs Core)
- **Hybrid Swarm Architecture**: Parallel multi-provider analysis (Gemini, OpenRouter, LM Studio, OpenClaw)
- **Consensus Engine**: Cross-validation with `[SWARM CONFIRMED]` markers to reduce hallucinations
- **Dual-Check Verification Pipeline**: Fast scan + background verification for high-priority entities
- **Entity Extraction**: Automatic detection of people, organizations, locations, dates
- **Timeline Reconstruction**: Chronological event extraction from documents
- **Verified Individuals Ledger**: Live, sorted ledger of confirmed entities
- **Confidence Scoring**: 0-100% confidence per document
- **Chain of Thought Reasoning**: Step-by-step analysis in AI prompts
- **Native Video/Audio Support**: MP4, MOV, MP3, WAV ingestion with Gemini multimodal
- **Offline OCR**: Tesseract.js integration for local image text extraction
- **OpenClaw Integration**: Access to Bailian models (Qwen, MiniMax, Kimi) with free tiers

#### Camera Monitoring (MotionCam)
- **USB Webcam Support**: Direct capture from /dev/video0
- **RTSP/ONVIP IP Camera**: Network camera integration
- **Android Phone Camera via ADB**: Use phone as wireless camera
- **MOG2 Motion Detection**: Background subtraction algorithm with configurable sensitivity
- **WebSocket Real-Time Streaming**: Live video broadcast to web clients
- **Auto-Capture on Motion**: Automatic snapshots when movement detected
- **Bounding Box Visualization**: Green overlay on detected motion
- **Event Logging**: Timestamped motion events with metadata
- **Multi-Camera Grid**: View 4+ cameras simultaneously
- **HTTP API Control**: Start/stop/configure via REST endpoints

#### Smart Home (Palantir Home)
- **Real-Time Dashboard Widgets**: Live monitoring panels
- **Device Status Panels**: Track connected devices and services
- **Automation Triggers**: Define rules for alerts and actions
- **Alert Notifications**: Instant WebSocket-powered alerts
- **Storage Management**: Auto-cleanup, retention policies, max file counts
- **Cross-Platform Sync**: Synchronize state across devices

#### Phone Forensics (Serenity-Forensics)
- **Android ADB Extraction**: SMS, MMS, call logs, contacts, photos, location history
- **iOS Backup Parsing**: iMessages and photos from iTunes backups
- **Media Metadata Extraction**: EXIF data (GPS, timestamps, device info)
- **Verification Code Detection**: Automatic extraction of OTP codes from SMS
- **Hidden Content Detection**: Trashed files, hidden folders, vault apps
- **Sideloaded APK Detection**: Identify unknown app installations
- **Red Flag Analysis**: Pattern-based concerning behavior detection
- **Evidence Organization**: Structured folder hierarchy for case files
- **Timeline Generation**: Unified timeline from multiple data sources

### Changed
- **README.md**: Completely rewritten for merged platform with all 4 components
- **Configuration Structure**: Updated for OpenClaw support (`priority` and `enabled` arrays)
- **Metadata Name**: Changed from "Epstein Nexus: Document Intelligence" to "NexusDocs Intelligence Platform"
- **Metadata Description**: Updated to reflect unified intelligence platform scope

### Fixed
- Parallel agent race conditions with mutex locks
- LM Studio CORS detection with improved endpoint validation
- PDF processing memory leak with proper cleanup
- Entity extraction duplicates with deduplication layer
- Timeline sorting errors with fixed date parsing

### Security
- CORS validation for local endpoints
- Improved API key handling
- Better isolation between AI providers

## [1.0.0] - 2025-12-01

### Added
- Initial release of NexusDocs
- Document intelligence with Gemini integration
- Entity extraction and timeline reconstruction
- Verified Individuals Ledger
- PDF processing with OCR
- Basic LM Studio support
- OpenRouter integration

---

## Version History Summary

| Version | Date | Description |
|---------|------|-------------|
| 2.0.0 | 2026-03-15 | Merged release: NexusDocs + Palantir Home + MotionCam + Serenity-Forensics |
| 1.0.0 | 2025-12-01 | Initial release: Document intelligence core |

---

## Upcoming Releases

### [2.1.0] - Planned Q2 2026
- Local Transcription (Whisper.cpp)
- Mobile App (React Native)
- Plugin System
- Advanced Analytics Dashboard
- Multi-language OCR

### [2.2.0] - Planned Q3 2026
- Facial Recognition with Known Faces Database
- Object Detection (80+ COCO classes)
- Cloud Sync (S3, Google Drive)
- Real-Time Collaboration
- Enhanced Timeline Visualization

### [3.0.0] - Planned Q4 2026
- Full graph visualization
- ML-based anomaly detection
- Predictive analytics
- Enterprise SSO integration