// Renderer process for NexusDocs Phone Companion

class PhoneCompanionApp {
    constructor() {
        this.isStreaming = false;
        this.logContainer = document.getElementById('logContainer');
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        this.btnStart = document.getElementById('btnStart');
        this.btnStop = document.getElementById('btnStop');
        this.cameraSelect = document.getElementById('cameraSelect');
        this.cameraPreview = document.getElementById('cameraPreview');
        
        this.init();
    }
    
    async init() {
        this.log('Initializing application...', 'info');
        
        // Load configuration
        await this.loadConfig();
        
        // Load available cameras
        await this.loadCameras();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check connection status
        await this.checkConnection();
        
        // Listen for streaming status updates
        window.electronAPI.onStreamingStatus((status) => {
            this.updateStreamingStatus(status.isStreaming);
        });
        
        this.log('Application initialized', 'info');
    }
    
    async loadConfig() {
        try {
            const config = await window.electronAPI.getConfig();
            
            document.getElementById('wsPort').value = config.websocketPort || 8765;
            document.getElementById('resolution').value = `${config.resolution?.width}x${config.resolution?.height}` || '1280x720';
            document.getElementById('fps').value = config.fps || 30;
            document.getElementById('autoStart').checked = config.autoStart || false;
            
            this.log('Configuration loaded', 'info');
        } catch (error) {
            this.log('Failed to load configuration: ' + error.message, 'error');
        }
    }
    
    async loadCameras() {
        try {
            const cameras = await window.electronAPI.getCameras();
            
            this.cameraSelect.innerHTML = '';
            
            if (cameras.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No cameras found';
                this.cameraSelect.appendChild(option);
                this.log('No cameras detected', 'warning');
                return;
            }
            
            cameras.forEach(camera => {
                const option = document.createElement('option');
                option.value = camera.id;
                option.textContent = camera.name;
                this.cameraSelect.appendChild(option);
            });
            
            this.log(`Found ${cameras.length} camera(s)`, 'info');
        } catch (error) {
            this.log('Failed to load cameras: ' + error.message, 'error');
            this.cameraSelect.innerHTML = '<option value="">Error loading cameras</option>';
        }
    }
    
    setupEventListeners() {
        // Start streaming button
        this.btnStart.addEventListener('click', async () => {
            await this.startStreaming();
        });
        
        // Stop streaming button
        this.btnStop.addEventListener('click', async () => {
            await this.stopStreaming();
        });
        
        // Camera selection change
        this.cameraSelect.addEventListener('change', () => {
            this.log(`Camera selected: ${this.cameraSelect.options[this.cameraSelect.selectedIndex]?.text}`, 'info');
        });
        
        // Resolution change
        document.getElementById('resolution').addEventListener('change', () => {
            this.log(`Resolution changed to: ${document.getElementById('resolution').value}`, 'info');
        });
        
        // FPS change
        document.getElementById('fps').addEventListener('change', () => {
            this.log(`FPS changed to: ${document.getElementById('fps').value}`, 'info');
        });
        
        // Auto-start checkbox
        document.getElementById('autoStart').addEventListener('change', async (e) => {
            await this.saveConfig();
            this.log(`Auto-start ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });
        
        // WebSocket settings change
        document.getElementById('wsPort').addEventListener('change', async () => {
            await this.saveConfig();
            this.log(`WebSocket port changed to: ${document.getElementById('wsPort').value}`, 'info');
        });
        
        document.getElementById('wsHost').addEventListener('change', async () => {
            await this.saveConfig();
            this.log(`WebSocket host changed to: ${document.getElementById('wsHost').value}`, 'info');
        });
    }
    
    async startStreaming() {
        try {
            this.log('Starting streaming...', 'info');
            
            const config = {
                websocketPort: parseInt(document.getElementById('wsPort').value),
                websocketHost: document.getElementById('wsHost').value,
                resolution: this.parseResolution(document.getElementById('resolution').value),
                fps: parseInt(document.getElementById('fps').value),
                cameraId: this.cameraSelect.value,
                autoStart: document.getElementById('autoStart').checked
            };
            
            await window.electronAPI.saveConfig(config);
            await window.electronAPI.startStreaming();
            
            this.log('Streaming started successfully', 'info');
        } catch (error) {
            this.log('Failed to start streaming: ' + error.message, 'error');
        }
    }
    
    async stopStreaming() {
        try {
            this.log('Stopping streaming...', 'info');
            await window.electronAPI.stopStreaming();
            this.log('Streaming stopped', 'info');
        } catch (error) {
            this.log('Failed to stop streaming: ' + error.message, 'error');
        }
    }
    
    async checkConnection() {
        try {
            const isConnected = await window.electronAPI.checkConnection();
            
            if (isConnected) {
                this.statusDot.className = 'status-dot connected';
                this.statusText.textContent = 'Connected';
                document.getElementById('connectionInfo').textContent = `WebSocket: ws://${document.getElementById('wsHost').value}:${document.getElementById('wsPort').value}`;
                this.log('WebSocket server connected', 'info');
            } else {
                this.statusDot.className = 'status-dot';
                this.statusText.textContent = 'Disconnected';
                document.getElementById('connectionInfo').textContent = 'WebSocket: Not connected';
                this.log('WebSocket server not connected', 'warning');
            }
        } catch (error) {
            this.log('Connection check failed: ' + error.message, 'error');
        }
    }
    
    updateStreamingStatus(streaming) {
        this.isStreaming = streaming;
        
        if (streaming) {
            this.statusDot.className = 'status-dot streaming';
            this.statusText.textContent = 'Streaming';
            this.btnStart.disabled = true;
            this.btnStop.disabled = false;
            this.cameraSelect.disabled = true;
            document.getElementById('resolution').disabled = true;
            document.getElementById('fps').disabled = true;
            this.log('Streaming active', 'info');
        } else {
            this.statusDot.className = 'status-dot connected';
            this.statusText.textContent = 'Connected';
            this.btnStart.disabled = false;
            this.btnStop.disabled = true;
            this.cameraSelect.disabled = false;
            document.getElementById('resolution').disabled = false;
            document.getElementById('fps').disabled = false;
            this.log('Streaming stopped', 'info');
        }
    }
    
    async saveConfig() {
        try {
            const config = {
                websocketPort: parseInt(document.getElementById('wsPort').value),
                websocketHost: document.getElementById('wsHost').value,
                resolution: this.parseResolution(document.getElementById('resolution').value),
                fps: parseInt(document.getElementById('fps').value),
                cameraId: this.cameraSelect.value,
                autoStart: document.getElementById('autoStart').checked
            };
            
            await window.electronAPI.saveConfig(config);
            this.log('Configuration saved', 'info');
        } catch (error) {
            this.log('Failed to save configuration: ' + error.message, 'error');
        }
    }
    
    parseResolution(resolutionStr) {
        const [width, height] = resolutionStr.split('x').map(Number);
        return { width, height };
    }
    
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        
        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
        
        // Limit log entries
        while (this.logContainer.children.length > 100) {
            this.logContainer.removeChild(this.logContainer.firstChild);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PhoneCompanionApp();
});
