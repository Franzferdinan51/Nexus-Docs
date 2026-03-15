import React, { useState } from 'react';
import { Smartphone, Wifi, Usb, Download, Play, Square, AlertTriangle } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  type: 'android' | 'ios';
  connection: 'usb' | 'wireless';
  status: 'connected' | 'disconnected' | 'pairing';
}

export function PhoneForensicsTab() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [wirelessIP, setWirelessIP] = useState('');

  const handleConnectUSB = () => {
    // USB connection logic
    console.log('Connecting via USB...');
  };

  const handleConnectWireless = () => {
    // Wireless ADB connection logic
    console.log('Connecting to', wirelessIP);
  };

  const handleExtract = () => {
    setIsExtracting(true);
    // Extraction logic
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Panel */}
        <div className="p-4 bg-card rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Connect Device</h3>
          
          <div className="space-y-4">
            <button
              onClick={handleConnectUSB}
              className="w-full flex items-center justify-center gap-2 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Usb className="w-4 h-4" />
              Connect via USB
            </button>

            <div className="space-y-2">
              <label className="text-sm font-medium">Wireless ADB IP:Port</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={wirelessIP}
                  onChange={(e) => setWirelessIP(e.target.value)}
                  placeholder="192.168.1.100:5555"
                  className="flex-1 px-3 py-2 bg-background border rounded-md text-sm"
                />
                <button
                  onClick={handleConnectWireless}
                  className="p-2 bg-accent rounded-md hover:bg-accent/80"
                >
                  <Wifi className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Device List */}
        <div className="p-4 bg-card rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Connected Devices</h3>
          {devices.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No devices connected. Connect a device to begin extraction.
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-background rounded-md">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    <div>
                      <div className="text-sm font-medium">{device.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {device.type} • {device.connection}
                      </div>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    device.status === 'connected' ? 'bg-green-500' :
                    device.status === 'pairing' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Extraction Panel */}
      <div className="p-4 bg-card rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Data Extraction</h3>
          <button
            onClick={handleExtract}
            disabled={isExtracting || devices.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isExtracting ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isExtracting ? 'Extracting...' : 'Start Extraction'}
          </button>
        </div>

        {isExtracting && (
          <div className="space-y-2">
            <div className="h-2 bg-accent rounded-full overflow-hidden">
              <div className="h-full bg-primary w-1/2 animate-pulse" />
            </div>
            <div className="text-sm text-muted-foreground">Extracting data from device...</div>
          </div>
        )}

        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
            <div className="text-sm text-yellow-500">
              <strong>Legal Notice:</strong> Only extract data from devices you own or have explicit permission to monitor.
              Unauthorized access is illegal.
            </div>
          </div>
        </div>
      </div>

      {/* Export Panel */}
      <div className="p-4 bg-card rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Export Evidence</h3>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg hover:bg-accent/80">
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg hover:bg-accent/80">
            <Download className="w-4 h-4" />
            Export PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}
