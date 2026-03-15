const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Camera methods
  getCameras: () => ipcRenderer.invoke('get-cameras'),
  
  // Configuration methods
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // Streaming methods
  startStreaming: () => ipcRenderer.invoke('start-streaming'),
  stopStreaming: () => ipcRenderer.invoke('stop-streaming'),
  getStreamingStatus: () => ipcRenderer.invoke('get-streaming-status'),
  
  // Connection methods
  checkConnection: () => ipcRenderer.invoke('check-connection'),
  
  // Event listeners
  onStreamingStatus: (callback) => {
    ipcRenderer.on('streaming-status', (event, status) => callback(status));
  },
  
  // Remove event listener
  removeStreamingStatusListener: () => {
    ipcRenderer.removeAllListeners('streaming-status');
  }
});
