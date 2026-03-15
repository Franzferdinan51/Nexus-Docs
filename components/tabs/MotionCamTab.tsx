'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CameraFeed, CameraFeedHandle } from '../camera/CameraFeed';

// ============================================================================
// Types
// ============================================================================

export interface CameraDevice {
  id: string;
  name: string;
  source: 'usb' | 'ip' | 'phone';
  url?: string;
  enabled: boolean;
}

export interface MotionEvent {
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
  thumbnail?: string;
}

export interface MotionCamConfig {
  sensitivity: number; // 0-100
  recordingEnabled: boolean;
  selectedCameras: string[];
}

// ============================================================================
// Default Props
// ============================================================================

const DEFAULT_CAMERAS: CameraDevice[] = [
  { id: 'usb-cam', name: 'USB Webcam', source: 'usb', url: '/dev/video0', enabled: true },
  { id: 'phone-cam', name: 'Phone Camera (Wireless ADB)', source: 'phone', enabled: false },
];

const DEFAULT_CONFIG: MotionCamConfig = {
  sensitivity: 50,
  recordingEnabled: false,
  selectedCameras: ['phone-cam'],
};

// ============================================================================
// MotionCamTab Component
// ============================================================================

export function MotionCamTab() {
  const [cameras, setCameras] = useState<CameraDevice[]>(DEFAULT_CAMERAS);
  const [config, setConfig] = useState<MotionCamConfig>(DEFAULT_CONFIG);
  const [motionEvents, setMotionEvents] = useState<MotionEvent[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [activeView, setActiveView] = useState<'grid' | 'single'>('grid');
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  
  const cameraFeedRefs = useState(() => new Map<string, React.RefObject<CameraFeedHandle>>());

  // Load camera config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('motioncam-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.cameras) setCameras(parsed.cameras);
        if (parsed.config) setConfig(parsed.config);
      } catch (e) {
        console.error('Failed to load MotionCam config:', e);
      }
    }
  }, []);

  // Save camera config to localStorage
  useEffect(() => {
    localStorage.setItem('motioncam-config', JSON.stringify({ cameras, config }));
  }, [cameras, config]);

  // Generate mock motion events for demo
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newEvent: MotionEvent = {
          id: `motion-${Date.now()}`,
          cameraId: config.selectedCameras[0] || 'phone-cam',
          timestamp: new Date(),
          intensity: Math.floor(Math.random() * 100),
          boundingBox: {
            x: Math.random() * 0.8,
            y: Math.random() * 0.8,
            width: 0.1 + Math.random() * 0.2,
            height: 0.1 + Math.random() * 0.2,
          },
        };
        setMotionEvents(prev => [newEvent, ...prev].slice(0, 50));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [config.selectedCameras]);

  // Handle camera selection
  const handleCameraToggle = useCallback((cameraId: string) => {
    setConfig(prev => ({
      ...prev,
      selectedCameras: prev.selectedCameras.includes(cameraId)
        ? prev.selectedCameras.filter(id => id !== cameraId)
        : [...prev.selectedCameras, cameraId],
    }));
  }, []);

  // Handle sensitivity change
  const handleSensitivityChange = useCallback((value: number) => {
    setConfig(prev => ({ ...prev, sensitivity: value }));
  }, []);

  // Handle screenshot
  const handleScreenshot = useCallback((cameraId: string) => {
    console.log(`Screenshot requested for camera: ${cameraId}`);
    // Trigger screenshot on specific camera feed
  }, []);

  // Handle recording toggle
  const handleRecordToggle = useCallback(() => {
    setIsRecording(prev => !prev);
    setConfig(prev => ({ ...prev, recordingEnabled: !prev.recordingEnabled }));
  }, []);

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit' 
    });
  };

  // Get active cameras
  const activeCameras = cameras.filter(cam => 
    config.selectedCameras.includes(cam.id) && cam.enabled
  );

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          📹 MotionCam
        </h2>
        
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            <button
              onClick={() => setActiveView('grid')}
              className={`px-3 py-1.5 text-sm transition-colors ${
                activeView === 'grid' 
                  ? 'bg-[var(--accent-primary)] text-white' 
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setActiveView('single')}
              className={`px-3 py-1.5 text-sm transition-colors ${
                activeView === 'single' 
                  ? 'bg-[var(--accent-primary)] text-white' 
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              Single
            </button>
          </div>
        </div>
      </div>

      {/* Camera Selection */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-card)]">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Active Cameras:</span>
          {cameras.map(camera => (
            <label key={camera.id} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] rounded-lg cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors">
              <input
                type="checkbox"
                checked={config.selectedCameras.includes(camera.id)}
                onChange={() => handleCameraToggle(camera.id)}
                className="w-4 h-4"
              />
              <span className="text-sm text-[var(--text-primary)]">{camera.name}</span>
              {camera.source === 'usb' && <span className="text-xs">📹</span>}
              {camera.source === 'phone' && <span className="text-xs">📱</span>}
              {camera.source === 'ip' && <span className="text-xs">🌐</span>}
            </label>
          ))}
          <span className="text-sm text-[var(--text-secondary)] ml-auto">Sensitivity: {config.sensitivity}%</span>
          <input
            type="range"
            min="0"
            max="100"
            value={config.sensitivity}
            onChange={(e) => handleSensitivityChange(parseInt(e.target.value))}
            className="w-32"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content - Camera Feeds */}
        <div className="flex-1 p-4 overflow-auto">
          {activeCameras.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
              <div className="text-center">
                <p className="text-4xl mb-2">📷</p>
                <p>No cameras selected</p>
                <p className="text-sm mt-1">Select cameras below to begin</p>
              </div>
            </div>
          ) : activeView === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 h-full">
              {activeCameras.map(camera => (
                <CameraFeed
                  key={camera.id}
                  cameraId={camera.id}
                  cameraName={camera.name}
                  source={camera.source}
                  url={camera.url}
                  sensitivity={config.sensitivity}
                  showMotionOverlay={true}
                  onScreenshot={() => handleScreenshot(camera.id)}
                  isRecording={isRecording}
                  motionEvents={motionEvents.filter(e => e.cameraId === camera.id)}
                />
              ))}
            </div>
          ) : (
            <div className="h-full">
              {activeCameras[0] && (
                <CameraFeed
                  cameraId={activeCameras[0].id}
                  cameraName={activeCameras[0].name}
                  source={activeCameras[0].source}
                  url={activeCameras[0].url}
                  sensitivity={config.sensitivity}
                  showMotionOverlay={true}
                  onScreenshot={() => handleScreenshot(activeCameras[0].id)}
                  isRecording={isRecording}
                  motionEvents={motionEvents.filter(e => e.cameraId === activeCameras[0].id)}
                  fullScreen={true}
                />
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Controls & Timeline */}
        <div className="w-80 border-l border-[var(--border)] bg-[var(--bg-card)] flex flex-col">
          {/* Camera Selection */}
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">
              🎥 Cameras
            </h3>
            <div className="space-y-2">
              {cameras.map(camera => (
                <label
                  key={camera.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={config.selectedCameras.includes(camera.id)}
                    onChange={() => handleCameraToggle(camera.id)}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {camera.name}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {camera.source.toUpperCase()} • {camera.enabled ? '🟢 Online' : '🔴 Offline'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Motion Sensitivity */}
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">
              🎚️ Motion Sensitivity
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Low</span>
                <span className="text-sm font-bold text-[var(--accent-primary)]">
                  {config.sensitivity}%
                </span>
                <span className="text-xs text-[var(--text-secondary)]">High</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.sensitivity}
                onChange={(e) => handleSensitivityChange(Number(e.target.value))}
                className="w-full h-2 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
              />
            </div>
          </div>

          {/* Capture Controls */}
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">
              📸 Capture Controls
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleScreenshot(config.selectedCameras[0] || '')}
                disabled={!config.selectedCameras.length}
                className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📷 Photo
              </button>
              <button
                onClick={handleRecordToggle}
                disabled={!config.selectedCameras.length}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording 
                    ? 'bg-[var(--error)] text-white animate-pulse' 
                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {isRecording ? '⏹️ Stop' : '⏺ Record'}
              </button>
            </div>
            {isRecording && (
              <p className="text-xs text-[var(--error)] mt-2 text-center animate-pulse">
                🔴 Recording in progress...
              </p>
            )}
          </div>

          {/* Motion Event Timeline */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">
              ⚡ Motion Timeline
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {motionEvents.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] text-center py-4">
                  No motion detected yet
                </p>
              ) : (
                motionEvents.slice(0, 20).map(event => (
                  <div
                    key={event.id}
                    className="p-2 rounded-lg bg-[var(--bg-secondary)] border-l-4 border-[var(--success)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        Motion detected
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[var(--text-secondary)]">
                        Intensity: {event.intensity}%
                      </span>
                      <span className="text-xs text-[var(--success)]">
                        {cameras.find(c => c.id === event.cameraId)?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MotionCamTab;