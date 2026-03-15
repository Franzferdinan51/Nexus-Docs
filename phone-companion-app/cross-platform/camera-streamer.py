#!/usr/bin/env python3
"""
NexusDocs Cross-Platform Camera Streamer
Works on: Windows, Linux, macOS, Android (Termux)

Usage:
    python camera-streamer.py --server ws://192.168.1.100:8080 --device-id my-camera
"""

import asyncio
import websockets
import cv2
import numpy as np
import json
import argparse
import sys
import platform
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CrossPlatformCamera:
    """Cross-platform camera with auto-detection"""
    
    def __init__(self, camera_id=0, backend=None):
        self.camera_id = camera_id
        self.backend = backend or self._detect_backend()
        self.cap = None
        
    def _detect_backend(self):
        """Auto-detect best OpenCV backend for platform"""
        system = platform.system()
        
        if system == 'Windows':
            logger.info("🪟 Detected Windows - using DirectShow backend")
            return cv2.CAP_DSHOW
        elif system == 'Linux':
            logger.info("🐧 Detected Linux - using V4L2 backend")
            return cv2.CAP_V4L2
        elif system == 'Darwin':
            logger.info("🍎 Detected macOS - using AVFoundation backend")
            return cv2.CAP_AVFOUNDATION
        else:
            # Android/Termux or unknown
            logger.info("📱 Detected Android/Termux - using default backend")
            return None  # Let OpenCV auto-detect
    
    def open(self, width=640, height=480, fps=15):
        """Open camera with cross-platform compatibility"""
        logger.info(f"📷 Opening camera {self.camera_id}...")
        
        # Try multiple camera IDs on Android
        if platform.system() == 'Android' or 'TERMUX' in str(sys.prefix):
            for cam_id in [0, 1, 2]:
                self.cap = cv2.VideoCapture(cam_id)
                if self.cap.isOpened():
                    self.camera_id = cam_id
                    logger.info(f"✅ Found camera at ID {cam_id}")
                    break
        else:
            # Desktop platforms
            if self.backend:
                self.cap = cv2.VideoCapture(self.camera_id, self.backend)
            else:
                self.cap = cv2.VideoCapture(self.camera_id)
        
        if not self.cap or not self.cap.isOpened():
            logger.error("❌ Cannot open camera")
            return False
        
        # Configure camera
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        self.cap.set(cv2.CAP_PROP_FPS, fps)
        
        # Log actual settings
        actual_width = self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        actual_height = self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        actual_fps = self.cap.get(cv2.CAP_PROP_FPS)
        
        logger.info(f"✅ Camera opened: {actual_width}x{actual_height} @ {actual_fps}fps")
        return True
    
    def read(self):
        """Read frame from camera"""
        if not self.cap:
            return False, None
        return self.cap.read()
    
    def release(self):
        """Release camera"""
        if self.cap:
            self.cap.release()
            logger.info("📷 Camera released")


class CameraStreamer:
    """Cross-platform camera streamer"""
    
    def __init__(self, server_url: str, device_id: str, 
                 camera_id: int = 0, resolution: tuple = (640, 480), fps: int = 15):
        self.server_url = server_url
        self.device_id = device_id
        self.camera = CrossPlatformCamera(camera_id)
        self.resolution = resolution
        self.fps = fps
        self.running = False
        self.websocket = None
        
    async def connect(self):
        """Connect to WebSocket server"""
        try:
            uri = f"{self.server_url}/stream/phone/{self.device_id}"
            logger.info(f"📡 Connecting to {uri}...")
            self.websocket = await websockets.connect(uri, ping_interval=20)
            logger.info(f"✅ Connected to server!")
            return True
        except Exception as e:
            logger.error(f"❌ Connection failed: {e}")
            return False
    
    async def stream(self):
        """Capture and stream camera frames"""
        if not self.camera.open(self.resolution[0], self.resolution[1], self.fps):
            return
        
        frame_count = 0
        start_time = datetime.now()
        
        try:
            while self.running:
                ret, frame = self.camera.read()
                if not ret or frame is None:
                    logger.warning("⚠️ Failed to grab frame")
                    await asyncio.sleep(0.1)
                    continue
                
                # Encode frame as JPEG
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                frame_bytes = buffer.tobytes()
                
                # Send frame
                try:
                    await self.websocket.send(frame_bytes)
                    frame_count += 1
                    
                    # Log stats every 30 frames
                    if frame_count % 30 == 0:
                        elapsed = (datetime.now() - start_time).total_seconds()
                        fps_actual = frame_count / elapsed if elapsed > 0 else 0
                        logger.info(f"📊 Streaming: {frame_count} frames, {fps_actual:.1f} fps")
                        
                except websockets.exceptions.ConnectionClosed:
                    logger.warning("⚠️ Connection closed by server")
                    break
                except Exception as e:
                    logger.error(f"⚠️ Send error: {e}")
                    await asyncio.sleep(1)
                    
        except KeyboardInterrupt:
            logger.info("\n🛑 Stopping stream...")
        finally:
            self.camera.release()
    
    async def run(self):
        """Main run loop with auto-reconnect"""
        self.running = True
        
        while self.running:
            if await self.connect():
                await self.stream()
            
            if self.running:
                logger.info("🔄 Reconnecting in 5 seconds...")
                await asyncio.sleep(5)
    
    def stop(self):
        """Stop streaming"""
        self.running = False


async def main():
    parser = argparse.ArgumentParser(
        description='NexusDocs Cross-Platform Camera Streamer',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python camera-streamer.py --server ws://192.168.1.100:8080 --device-id living-room
  python camera-streamer.py --server ws://192.168.1.100:8080 --device-id office --camera 1
  python camera-streamer.py --server ws://192.168.1.100:8080 --device-id phone --width 1280 --height 720
        """
    )
    parser.add_argument('--server', required=True, help='WebSocket server URL')
    parser.add_argument('--device-id', required=True, help='Unique device ID')
    parser.add_argument('--camera', type=int, default=0, help='Camera ID (default: 0)')
    parser.add_argument('--width', type=int, default=640, help='Frame width (default: 640)')
    parser.add_argument('--height', type=int, default=480, help='Frame height (default: 480)')
    parser.add_argument('--fps', type=int, default=15, help='Frames per second (default: 15)')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    
    args = parser.parse_args()
    
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    print("🎬 NexusDocs Cross-Platform Camera Streamer")
    print(f"   Platform: {platform.system()} {platform.release()}")
    print(f"   Server: {args.server}")
    print(f"   Device: {args.device_id}")
    print(f"   Camera: {args.camera}")
    print(f"   Resolution: {args.width}x{args.height}")
    print(f"   FPS: {args.fps}")
    print()
    
    streamer = CameraStreamer(
        server_url=args.server,
        device_id=args.device_id,
        camera_id=args.camera,
        resolution=(args.width, args.height),
        fps=args.fps
    )
    
    try:
        await streamer.run()
    except KeyboardInterrupt:
        streamer.stop()
        print("\n👋 Goodbye!")


if __name__ == '__main__':
    asyncio.run(main())
