/**
 * CameraConfigPanel.tsx
 * NexusDocs Intelligence Platform - Camera Source Management
 * 
 * Provides configuration for camera sources including:
 * - RTSP stream URLs
 * - ADB device connections
 * - Motion detection sensitivity
 * - Capture settings
 */

import React, { useState, useEffect } from 'react';

interface CameraSource {
  id: string;
  name: string;
  type: 'rtsp' | 'adb' | 'usb' | 'ip';
  enabled: boolean;
  url?: string;
  deviceId?: string;
  location?: string;
  motionSensitivity: number;
  captureInterval: number;
  status: 'online' | 'offline' | 'error';
}

interface CameraConfigPanelProps {
  onConfigChange?: (sources: CameraSource[]) => void;
}

const defaultSources: CameraSource[] = [
  {
    id: 'grow-tent',
    name: '3x3 Grow Tent',
    type: 'adb',
    enabled: true,
    deviceId: '192.168.1.251:34341',
    location: 'Grow Room',
    motionSensitivity: 75,
    captureInterval: 300,
    status: 'offline',
  },
  {
    id: 'usb-cam',
    name: 'USB Camera',
    type: 'usb',
    enabled: false,
    url: '/dev/video0',
    location: 'Flexible',
    motionSensitivity: 50,
    captureInterval: 600,
    status: 'offline',
  },
  {
    id: 'rtsp-1',
    name: 'RTSP Stream 1',
    type: 'rtsp',
    enabled: false,
    url: 'rtsp://localhost:8554/stream1',
    location: 'Not Set',
    motionSensitivity: 60,
    captureInterval: 300,
    status: 'offline',
  },
];

export const CameraConfigPanel: React.FC<CameraConfigPanelProps> = ({ onConfigChange }) => {
  const [sources, setSources] = useState<CameraSource[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexusdocs-camera-config');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved camera config:', e);
        }
      }
    }
    return defaultSources;
  });

  const [expandedSource, setExpandedSource] = useState<string | null>('grow-tent');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('nexusdocs-camera-config', JSON.stringify(sources));
    
    if (onConfigChange) {
      onConfigChange(sources);
    }
  }, [sources, onConfigChange]);

  const toggleSource = (id: string) => {
    setSources(prev =>
      prev.map(s =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  const updateSource = (id: string, updates: Partial<CameraSource>) => {
    setSources(prev =>
      prev.map(s =>
        s.id === id ? { ...s, ...updates } : s
      )
    );
  };

  const deleteSource = (id: string) => {
    if (confirm('Are you sure you want to delete this camera source?')) {
      setSources(prev => prev.filter(s => s.id !== id));
    }
  };

  const addSource = (source: CameraSource) => {
    setSources(prev => [...prev, source]);
    setShowAddModal(false);
  };

  const testConnection = async (source: CameraSource) => {
    updateSource(source.id, { status: 'offline' });
    
    try {
      if (source.type === 'adb') {
        // Test ADB connection
        const response = await fetch('/api/camera/test-adb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: source.deviceId }),
        });
        if (response.ok) {
          updateSource(source.id, { status: 'online' });
        } else {
          updateSource(source.id, { status: 'error' });
        }
      } else if (source.type === 'rtsp' || source.type === 'ip') {
        // Test RTSP/IP camera connection
        const response = await fetch('/api/camera/test-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: source.url }),
        });
        if (response.ok) {
          updateSource(source.id, { status: 'online' });
        } else {
          updateSource(source.id, { status: 'error' });
        }
      } else if (source.type === 'usb') {
        // Test USB camera
        const response = await fetch('/api/camera/test-usb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ devicePath: source.url }),
        });
        if (response.ok) {
          updateSource(source.id, { status: 'online' });
        } else {
          updateSource(source.id, { status: 'error' });
        }
      }
    } catch (error) {
      console.error(`Connection test failed for ${source.name}:`, error);
      updateSource(source.id, { status: 'error' });
    }
  };

  const getStatusColor = (status: CameraSource['status']) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'offline': return '#9ca3af';
      case 'error': return '#ef4444';
    }
  };

  const getTypeIcon = (type: CameraSource['type']) => {
    switch (type) {
      case 'rtsp': return '📡';
      case 'adb': return '📱';
      case 'usb': return '📷';
      case 'ip': return '🌐';
    }
  };

  return (
    <div className="camera-config-panel">
      <div className="panel-header">
        <div className="header-content">
          <h3>📷 Camera Sources</h3>
          <p className="panel-description">
            Configure camera sources for motion detection, capture, and monitoring.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="add-btn"
        >
          + Add Camera
        </button>
      </div>

      <div className="sources-list">
        {sources.map((source) => (
          <div
            key={source.id}
            className={`source-card ${!source.enabled ? 'disabled' : ''}`}
          >
            <div className="source-header">
              <div className="source-title">
                <span className="source-icon">{getTypeIcon(source.type)}</span>
                <div>
                  <h4 className="source-name">{source.name}</h4>
                  <div className="source-meta">
                    <span className="source-location">📍 {source.location}</span>
                    <span className="source-status" style={{ color: getStatusColor(source.status) }}>
                      ● {source.status.charAt(0).toUpperCase() + source.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="source-actions">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={source.enabled}
                    onChange={() => toggleSource(source.id)}
                  />
                  <span className="toggle-slider" />
                </label>
                <button
                  onClick={() => testConnection(source)}
                  className="test-btn"
                  disabled={!source.enabled}
                >
                  Test
                </button>
                <button
                  onClick={() => setExpandedSource(expandedSource === source.id ? null : source.id)}
                  className="expand-btn"
                >
                  {expandedSource === source.id ? '▼' : '▶'}
                </button>
              </div>
            </div>

            {expandedSource === source.id && (
              <div className="source-details">
                {source.type === 'rtsp' || source.type === 'ip' ? (
                  <div className="form-group">
                    <label>Stream URL</label>
                    <input
                      type="text"
                      value={source.url || ''}
                      onChange={(e) => updateSource(source.id, { url: e.target.value })}
                      placeholder="rtsp://username:password@ip:port/stream"
                      disabled={!source.enabled}
                    />
                  </div>
                ) : source.type === 'adb' ? (
                  <div className="form-group">
                    <label>ADB Device ID</label>
                    <input
                      type="text"
                      value={source.deviceId || ''}
                      onChange={(e) => updateSource(source.id, { deviceId: e.target.value })}
                      placeholder="192.168.1.XXX:PORT"
                      disabled={!source.enabled}
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Device Path</label>
                    <input
                      type="text"
                      value={source.url || ''}
                      onChange={(e) => updateSource(source.id, { url: e.target.value })}
                      placeholder="/dev/video0"
                      disabled={!source.enabled}
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={source.location || ''}
                      onChange={(e) => updateSource(source.id, { location: e.target.value })}
                      placeholder="e.g., Grow Room"
                      disabled={!source.enabled}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Motion Sensitivity: {source.motionSensitivity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={source.motionSensitivity}
                    onChange={(e) => updateSource(source.id, { motionSensitivity: parseInt(e.target.value) })}
                    disabled={!source.enabled}
                  />
                  <div className="range-labels">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Capture Interval: {source.captureInterval / 60} minutes
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="3600"
                    step="60"
                    value={source.captureInterval}
                    onChange={(e) => updateSource(source.id, { captureInterval: parseInt(e.target.value) })}
                    disabled={!source.enabled}
                  />
                  <div className="range-labels">
                    <span>1 min</span>
                    <span>60 min</span>
                  </div>
                </div>

                <div className="source-actions-footer">
                  <button
                    onClick={() => deleteSource(source.id)}
                    className="delete-btn"
                    disabled={!source.enabled}
                  >
                    🗑️ Delete Source
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {sources.length === 0 && (
          <div className="empty-state">
            <p>No camera sources configured.</p>
            <button onClick={() => setShowAddModal(true)} className="add-btn">
              Add Your First Camera
            </button>
          </div>
        )}
      </div>

      {/* Add Camera Modal */}
      {showAddModal && (
        <AddCameraModal
          onAdd={addSource}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      <style jsx>{`
        .camera-config-panel {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .header-content {
          flex: 1;
        }

        .panel-header h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .panel-description {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        .add-btn {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .add-btn:hover {
          background: #2563eb;
        }

        .sources-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .source-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s;
        }

        .source-card.disabled {
          opacity: 0.6;
          background: #f9fafb;
        }

        .source-card:hover:not(.disabled) {
          border-color: #d1d5db;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .source-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f9fafb;
        }

        .source-card.disabled .source-header {
          background: #f3f4f6;
        }

        .source-title {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .source-icon {
          font-size: 24px;
        }

        .source-name {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .source-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: #6b7280;
        }

        .source-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #d1d5db;
          border-radius: 24px;
          transition: 0.2s;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: 0.2s;
        }

        .toggle-switch input:checked + .toggle-slider {
          background-color: #3b82f6;
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }

        .test-btn {
          padding: 6px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .test-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .test-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .expand-btn {
          padding: 6px 10px;
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .expand-btn:hover {
          background: #f9fafb;
        }

        .source-details {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input[type="text"] {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          color: #1f2937;
          transition: border-color 0.2s;
        }

        .form-group input[type="text"]:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .form-group input[type="text"]:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .form-group input[type="range"] {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #e5e7eb;
          outline: none;
          -webkit-appearance: none;
        }

        .form-group input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          transition: background 0.2s;
        }

        .form-group input[type="range"]::-webkit-slider-thumb:hover {
          background: #2563eb;
        }

        .form-group input[type="range"]:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .range-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 4px;
          font-size: 12px;
          color: #9ca3af;
        }

        .source-actions-footer {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
        }

        .delete-btn {
          padding: 8px 16px;
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fca5a5;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .delete-btn:hover:not(:disabled) {
          background: #fecaca;
          border-color: #f87171;
        }

        .delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          background: #f9fafb;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
        }

        .empty-state p {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: #6b7280;
        }

        :global([data-theme='dark']) .camera-config-panel {
          background: #1f2937;
          border-color: #374151;
        }

        :global([data-theme='dark']) .panel-header h3 {
          color: #f9fafb;
        }

        :global([data-theme='dark']) .panel-description {
          color: #9ca3af;
        }

        :global([data-theme='dark']) .source-card {
          background: #374151;
          border-color: #4b5563;
        }

        :global([data-theme='dark']) .source-card.disabled {
          background: #1f2937;
        }

        :global([data-theme='dark']) .source-header {
          background: #374151;
        }

        :global([data-theme='dark']) .source-card.disabled .source-header {
          background: #1f2937;
        }

        :global([data-theme='dark']) .source-name {
          color: #f9fafb;
        }

        :global([data-theme='dark']) .source-meta {
          color: #9ca3af;
        }

        :global([data-theme='dark']) .source-details {
          background: #1f2937;
          border-top-color: #374151;
        }

        :global([data-theme='dark']) .form-group label {
          color: #e5e7eb;
        }

        :global([data-theme='dark']) .form-group input[type="text"] {
          background: #374151;
          border-color: #4b5563;
          color: #f9fafb;
        }

        :global([data-theme='dark']) .form-group input[type="text"]:focus {
          border-color: #60a5fa;
        }

        :global([data-theme='dark']) .form-group input[type="text"]:disabled {
          background: #1f2937;
          color: #6b7280;
        }

        :global([data-theme='dark']) .form-group input[type="range"] {
          background: #4b5563;
        }

        :global([data-theme='dark']) .empty-state {
          background: #374151;
          border-color: #4b5563;
        }

        :global([data-theme='dark']) .empty-state p {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

// Add Camera Modal Component
interface AddCameraModalProps {
  onAdd: (source: CameraSource) => void;
  onCancel: () => void;
}

const AddCameraModal: React.FC<AddCameraModalProps> = ({ onAdd, onCancel }) => {
  const [type, setType] = useState<CameraSource['type']>('adb');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newSource: CameraSource = {
      id: `camera-${Date.now()}`,
      name: name || 'New Camera',
      type,
      enabled: true,
      url: type !== 'adb' ? url : undefined,
      deviceId: type === 'adb' ? deviceId : undefined,
      location: location || 'Not Set',
      motionSensitivity: 50,
      captureInterval: 300,
      status: 'offline',
    };

    onAdd(newSource);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Add Camera Source</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Camera Type</label>
            <select value={type} onChange={e => setType(e.target.value as CameraSource['type'])}>
              <option value="adb">ADB Device (Android Phone)</option>
              <option value="rtsp">RTSP Stream</option>
              <option value="usb">USB Camera</option>
              <option value="ip">IP Camera</option>
            </select>
          </div>

          <div className="form-group">
            <label>Camera Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Grow Tent Camera"
              required
            />
          </div>

          {type === 'adb' ? (
            <div className="form-group">
              <label>ADB Device ID</label>
              <input
                type="text"
                value={deviceId}
                onChange={e => setDeviceId(e.target.value)}
                placeholder="e.g., 192.168.1.251:34341"
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Stream/Device URL</label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder={type === 'rtsp' ? 'rtsp://...' : '/dev/video0'}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g., Grow Room"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Add Camera
            </button>
          </div>
        </form>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            border-radius: 12px;
            padding: 24px;
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-content h3 {
            margin: 0 0 20px 0;
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
          }

          .form-group {
          margin-bottom: 16px;
          }

          .form-group label {
            display: block;
            margin-bottom: 6px;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
          }

          .form-group input,
          .form-group select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-size: 14px;
            color: #1f2937;
          }

          .form-group input:focus,
          .form-group select:focus {
            outline: none;
            border-color: #3b82f6;
          }

          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 24px;
          }

          .cancel-btn {
            padding: 8px 16px;
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          }

          .cancel-btn:hover {
            background: #e5e7eb;
          }

          .submit-btn {
            padding: 8px 16px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          }

          .submit-btn:hover {
            background: #2563eb;
          }

          :global([data-theme='dark']) .modal-content {
            background: #1f2937;
          }

          :global([data-theme='dark']) .modal-content h3 {
            color: #f9fafb;
          }

          :global([data-theme='dark']) .form-group label {
            color: #e5e7eb;
          }

          :global([data-theme='dark']) .form-group input,
          :global([data-theme='dark']) .form-group select {
            background: #374151;
            border-color: #4b5563;
            color: #f9fafb;
          }

          :global([data-theme='dark']) .cancel-btn {
            background: #374151;
            color: #e5e7eb;
            border-color: #4b5563;
          }

          :global([data-theme='dark']) .cancel-btn:hover {
            background: #4b5563;
          }
        `}</style>
      </div>
    </div>
  );
};

export default CameraConfigPanel;
