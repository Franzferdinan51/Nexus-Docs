#!/usr/bin/env python3
"""
NexusDocs Camera Streamer - Stream phone camera to WebSocket server
Works on Termux (Android) WITHOUT root!

Usage:
    python camera-streamer.py --server ws://192.168.1.100:8080 --device-id my-phone

Requirements:
    pip install opencv-python websockets numpy
"""

import asyncio
import websockets
import cv2
import numpy as np
import json
import argparse
import sys
from datetime import datetime

class CameraStreamer:
    def __init__(self, server_url: str, device_id: str, camera_id: int = 0, 
                 resolution: tuple = (640, 480), fps: int = 15):
        self.server_url = server_url
        self.device_id = device_id
        self.camera_id = camera_id
        self.resolution = resolution
        self.fps = fps
        self.running = False
        self.cap = None
        
    async def connect(self):
        """Connect to WebSocket server"""
        try:
            uri = f"{self.server_url}/stream/phone/{self.device_id}"
            print(f"📡 Connecting to {uri}...")
            self.websocket = await websockets.connect(uri, ping_interval=20)
            print(f"✅ Connected to server!")
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    async def stream_camera(self):
        """Capture and stream camera frames"""
        self.cap = cv2.VideoCapture(self.camera_id)
        if not self.cap.isOpened():
            print(f"❌ Cannot open camera {self.camera_id}")
            return
        
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.resolution[0])
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
        self.cap.set(cv2.CAP_PROP_FPS, self.fps)
        
        print(f"📹 Camera opened: {self.resolution[0]}x{self.resolution[1]} @ {self.fps}fps")
        
        frame_count = 0
        start_time = datetime.now()
        
        try:
            while self.running:
                ret, frame = self.cap.read()
                if not ret:
                    print("⚠️ Failed to grab frame")
                    continue
                
                # Encode frame as JPEG
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                frame_bytes = buffer.tobytes()
                
                # Send frame to server
                try:
                    await self.websocket.send(frame_bytes)
                    frame_count += 1
                    
                    # Log stats every 30 seconds
                    if frame_count % 30 == 0:
                        elapsed = (datetime.now() - start_time).total_seconds()
                        fps_actual = frame_count / elapsed if elapsed > 0 else 0
                        print(f"📊 Streaming: {frame_count} frames, {fps_actual:.1f} fps")
                        
                except websockets.exceptions.ConnectionClosed:
                    print("⚠️ Connection closed by server")
                    break
                except Exception as e:
                    print(f"⚠️ Send error: {e}")
                    
        except KeyboardInterrupt:
            print("\n🛑 Stopping stream...")
        finally:
            if self.cap:
                self.cap.release()
    
    async def run(self):
        """Main run loop with auto-reconnect"""
        self.running = True
        
        while self.running:
            if await self.connect():
                await self.stream_camera()
            
            if self.running:
                print("🔄 Reconnecting in 5 seconds...")
                await asyncio.sleep(5)
    
    def stop(self):
        """Stop streaming"""
        self.running = False

async def main():
    parser = argparse.ArgumentParser(description='NexusDocs Camera Streamer')
    parser.add_argument('--server', required=True, help='WebSocket server URL (e.g., ws://192.168.1.100:8080)')
    parser.add_argument('--device-id', required=True, help='Unique device ID (e.g., my-phone)')
    parser.add_argument('--camera', type=int, default=0, help='Camera ID (default: 0)')
    parser.add_argument('--width', type=int, default=640, help='Frame width (default: 640)')
    parser.add_argument('--height', type=int, default=480, help='Frame height (default: 480)')
    parser.add_argument('--fps', type=int, default=15, help='Frames per second (default: 15)')
    
    args = parser.parse_args()
    
    print("🎬 NexusDocs Camera Streamer")
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
