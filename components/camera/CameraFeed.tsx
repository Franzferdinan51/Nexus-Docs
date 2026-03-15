'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface CameraFeedProps {
  cameraId: string;
  cameraName: string;
  source: 'usb' | 'ip' | 'phone';
  url?: string;
  sensitivity: number;
  showMotionOverlay: boolean;
  onScreenshot: () => void;
  isRecording: boolean;
  motionEvents: Array<{
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
  }>;
  fullScreen?: boolean;
}

export interface CameraFeedHandle {
  takeScreenshot: () => void;
  startRecording: () => void;
  stopRecording: () => void;
}

// ============================================================================
// CameraFeed Component
// ============================================================================

export function CameraFeed({
  cameraId,
  cameraName,
  source,
  url,
  sensitivity,
  showMotionOverlay,
  onScreenshot,
  isRecording,
  motionEvents,
  fullScreen = false,
}: CameraFeedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastMotion, setLastMotion] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // WebSocket connection for video stream (or browser getUserMedia for USB)
  useEffect(() => {
    // For USB cameras, try browser getUserMedia first
    if (source === 'usb') {
      const initBrowserCamera = async () => {
        setConnectionStatus('connecting');
        try {
          const stream = await getBrowserCameraStream({ video: { width: 1280, height: 720 } });
          if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            setConnectionStatus('connected');
            setError(null);
          } else {
            throw new Error('Could not access camera');
          }
        } catch (err) {
          setError('Camera access denied or not available. Configure WebSocket URL in Settings.');
          setConnectionStatus('disconnected');
        }
      };
      initBrowserCamera();
      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
      };
    }

    // For phone/IP cameras, use WebSocket
    const wsUrl = getWebSocketUrl(source, url, cameraId);
    
    const connectWebSocket = () => {
      setConnectionStatus('connecting');
      
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnectionStatus('connected');
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'frame') {
              const frame = data.payload;
              renderFrame(frame);
            } else if (data.type === 'motion') {
              if (data.payload.boundingBox) {
                setLastMotion(data.payload.boundingBox);
                setTimeout(() => setLastMotion(null), 2000);
              }
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        ws.onerror = () => {
          setError('WebSocket connection error - configure server URL in Settings');
          setConnectionStatus('disconnected');
        };

        ws.onclose = () => {
          setConnectionStatus('disconnected');
          setTimeout(connectWebSocket, 5000);
        };
      } catch (err) {
        setError('Failed to create WebSocket connection');
        setConnectionStatus('disconnected');
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [source, url, cameraId]);

  // Render video frame to canvas
  const renderFrame = useCallback((frame: ImageData | string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (typeof frame === 'string') {
      // Base64 encoded frame
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        drawMotionOverlay(ctx);
      };
      img.src = frame;
    } else if (frame instanceof ImageData) {
      // Raw ImageData
      canvas.width = frame.width;
      canvas.height = frame.height;
      ctx.putImageData(frame, 0, 0);
      drawMotionOverlay(ctx);
    }
  }, []);

  // Draw motion detection overlay
  const drawMotionOverlay = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!lastMotion || !showMotionOverlay) return;

    const canvas = ctx.canvas;
    const x = lastMotion.x * canvas.width;
    const y = lastMotion.y * canvas.height;
    const width = lastMotion.width * canvas.width;
    const height = lastMotion.height * canvas.height;

    // Draw green bounding box
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    // Draw fill with transparency
    ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    ctx.fillRect(x, y, width, height);

    // Draw "MOTION" label
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('MOTION', x, y - 5);
  }, [lastMotion, showMotionOverlay]);

  // Update motion overlay from props
  useEffect(() => {
    if (motionEvents.length > 0) {
      const latestEvent = motionEvents[0];
      if (latestEvent.boundingBox) {
        setLastMotion(latestEvent.boundingBox);
      }
    }
  }, [motionEvents]);

  // Screenshot handler
  const handleScreenshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create download link
    const link = document.createElement('a');
    link.download = `motioncam-${cameraId}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    // Trigger callback
    onScreenshot();
  }, [cameraId, onScreenshot]);

  // Public methods for parent component
  useEffect(() => {
    const handleExternalScreenshot = () => handleScreenshot();
    // Expose methods via custom events or context if needed
  }, [handleScreenshot]);

  // Get the appropriate placeholder based on source
  const getPlaceholder = () => {
    switch (source) {
      case 'phone':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
            <p className="text-4xl mb-2">📱</p>
            <p className="text-sm">Phone Camera</p>
            <p className="text-xs mt-1">{cameraName}</p>
          </div>
        );
      case 'usb':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
            <p className="text-4xl mb-2">🔌</p>
            <p className="text-sm">USB Camera</p>
            <p className="text-xs mt-1">{url || '/dev/video0'}</p>
          </div>
        );
      case 'ip':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
            <p className="text-4xl mb-2">🌐</p>
            <p className="text-sm">IP Camera</p>
            <p className="text-xs mt-1">{url}</p>
          </div>
        );
    }
  };

  return (
    <div 
      className={`relative rounded-xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] ${
        fullScreen ? 'h-full' : 'aspect-video'
      }`}
    >
      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white drop-shadow">
            {cameraName}
          </span>
          <span className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-[var(--success)]' :
            connectionStatus === 'connecting' ? 'bg-[var(--warning)] animate-pulse' :
            'bg-[var(--error)]'
          }`} />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Recording Indicator */}
          {isRecording && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-white bg-[var(--error)] rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              REC
            </span>
          )}
          
          {/* Motion Indicator */}
          {lastMotion && (
            <span className="px-2 py-0.5 text-xs font-medium text-white bg-[var(--success)] rounded-full">
              ⚡ Motion
            </span>
          )}
        </div>
      </div>

      {/* Video Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
        style={{ backgroundColor: '#1a1a1a' }}
      />

      {/* Placeholder when not connected */}
      {connectionStatus !== 'connected' && !error && getPlaceholder()}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-[var(--error)]">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-1 text-[var(--text-secondary)]">
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
            </p>
          </div>
        </div>
      )}

      {/* Control Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={handleScreenshot}
          className="px-3 py-1.5 text-sm font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
        >
          📷 Screenshot
        </button>
        <button
          onClick={() => {
            // Toggle fullscreen
            const container = canvasRef.current?.parentElement;
            if (container) {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                container.requestFullscreen();
              }
            }
          }}
          className="px-3 py-1.5 text-sm font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
        >
          🔳 Fullscreen
        </button>
      </div>

      {/* Motion Bounding Box Overlay (CSS-based for better performance) */}
      {lastMotion && showMotionOverlay && (
        <div
          className="absolute border-2 border-[var(--success)] bg-[var(--success)]/20 pointer-events-none"
          style={{
            left: `${lastMotion.x * 100}%`,
            top: `${lastMotion.y * 100}%`,
            width: `${lastMotion.width * 100}%`,
            height: `${lastMotion.height * 100}%`,
          }}
        >
          <span className="absolute -top-5 left-0 text-xs font-bold text-[var(--success)] bg-black/60 px-1 rounded">
            MOTION
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getWebSocketUrl(source: 'usb' | 'ip' | 'phone', url: string | undefined, cameraId: string): string {
  const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
  
  switch (source) {
    case 'phone':
      return `${baseWsUrl}/stream/phone/${cameraId}`;
    case 'usb':
      return `${baseWsUrl}/stream/usb/${url?.replace('/dev/', '') || '0'}`;
    case 'ip':
      return `${baseWsUrl}/stream/ip/${encodeURIComponent(url || '')}`;
    default:
      return `${baseWsUrl}/stream/${cameraId}`;
  }
}

// Use browser getUserMedia for USB cameras when WebSocket is not available
async function getBrowserCameraStream(constraints: MediaStreamConstraints): Promise<MediaStream | null> {
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    console.error('Failed to access camera:', err);
    return null;
  }
}

export default CameraFeed;