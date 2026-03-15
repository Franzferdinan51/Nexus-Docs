/**
 * SettingsTab.tsx
 * NexusDocs Intelligence Platform - Unified Settings Interface
 * 
 * Provides comprehensive configuration for:
 * - AI Model Providers (LM Studio, OpenClaw, OpenRouter, Gemini)
 * - Camera Sources (RTSP, ADB, USB, IP cameras)
 * - Phone Forensics (extraction options, export formats)
 * - Theme Settings (light/dark mode)
 * - Legal & About Information
 */

import React, { useState, useEffect } from 'react';
import { ModelConfigPanel } from '../settings/ModelConfigPanel';
import { CameraConfigPanel } from '../settings/CameraConfigPanel';
import { ThemeToggle } from '../settings/ThemeToggle';
import { LegalNotice } from '../settings/LegalNotice';

interface PhoneForensicsConfig {
  extractionMethod: 'adb' | 'backup' | 'physical';
  exportFormat: 'json' | 'csv' | 'html' | 'pdf';
  includeDeleted: boolean;
  includeMetadata: boolean;
  compressData: boolean;
}

interface SettingsTabProps {
  onSettingsChange?: (settings: any) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onSettingsChange }) => {
  const [activeSection, setActiveSection] = useState<string>('models');
  const [phoneForensics, setPhoneForensics] = useState<PhoneForensicsConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexusdocs-forensics-config');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved forensics config:', e);
        }
      }
    }
    return {
      extractionMethod: 'adb',
      exportFormat: 'json',
      includeDeleted: false,
      includeMetadata: true,
      compressData: true,
    };
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    localStorage.setItem('nexusdocs-forensics-config', JSON.stringify(phoneForensics));
    
    if (onSettingsChange) {
      onSettingsChange({ phoneForensics });
    }
  }, [phoneForensics, onSettingsChange]);

  const updateForensics = (updates: Partial<PhoneForensicsConfig>) => {
    setPhoneForensics(prev => ({ ...prev, ...updates }));
  };

  const resetAllSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      localStorage.removeItem('nexusdocs-model-config');
      localStorage.removeItem('nexusdocs-camera-config');
      localStorage.removeItem('nexusdocs-forensics-config');
      localStorage.removeItem('nexusdocs-theme');
      window.location.reload();
    }
  };

  const exportSettings = () => {
    const settings = {
      version: '2.1.0',
      exportedAt: new Date().toISOString(),
      models: localStorage.getItem('nexusdocs-model-config'),
      cameras: localStorage.getItem('nexusdocs-camera-config'),
      forensics: localStorage.getItem('nexusdocs-forensics-config'),
      theme: localStorage.getItem('nexusdocs-theme'),
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexusdocs-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        
        if (settings.models) localStorage.setItem('nexusdocs-model-config', settings.models);
        if (settings.cameras) localStorage.setItem('nexusdocs-camera-config', settings.cameras);
        if (settings.forensics) localStorage.setItem('nexusdocs-forensics-config', settings.forensics);
        if (settings.theme) localStorage.setItem('nexusdocs-theme', settings.theme);
        
        alert('Settings imported successfully! The page will reload.');
        window.location.reload();
      } catch (error) {
        alert('Failed to import settings. Please check the file format.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  };

  const navItems = [
    { id: 'models', label: '🤖 AI Models', icon: '🤖' },
    { id: 'cameras', label: '📷 Cameras', icon: '📷' },
    { id: 'forensics', label: '📱 Phone Forensics', icon: '📱' },
    { id: 'appearance', label: '🎨 Appearance', icon: '🎨' },
    { id: 'legal', label: '⚖️ Legal & About', icon: '⚖️' },
  ];

  return (
    <div className="settings-tab">
      {/* Header */}
      <div className="settings-header">
        <div className="settings-title">
          <h1>⚙️ Settings</h1>
          <p className="settings-subtitle">
            Configure NexusDocs Intelligence Platform
          </p>
        </div>
        <div className="settings-actions">
          <button onClick={exportSettings} className="action-btn export">
            📤 Export
          </button>
          <label className="action-btn import">
            📥 Import
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={resetAllSettings} className="action-btn reset">
            🗑️ Reset All
          </button>
        </div>
      </div>

      <div className="settings-layout">
        {/* Navigation Sidebar */}
        <nav className="settings-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <main className="settings-content">
          {activeSection === 'models' && (
            <section className="settings-section">
              <ModelConfigPanel />
            </section>
          )}

          {activeSection === 'cameras' && (
            <section className="settings-section">
              <CameraConfigPanel />
            </section>
          )}

          {activeSection === 'forensics' && (
            <section className="settings-section">
              <div className="forensics-panel">
                <h3>📱 Phone Forensics Configuration</h3>
                <p className="panel-description">
                  Configure data extraction and export options for phone forensics.
                </p>

                <div className="form-group">
                  <label>Extraction Method</label>
                  <select
                    value={phoneForensics.extractionMethod}
                    onChange={e => updateForensics({ extractionMethod: e.target.value as any })}
                  >
                    <option value="adb">ADB (Android Debug Bridge)</option>
                    <option value="backup">Cloud Backup</option>
                    <option value="physical">Physical Extraction (Root Required)</option>
                  </select>
                  <p className="help-text">
                    {phoneForensics.extractionMethod === 'adb' && 'Standard method for Android devices. Requires USB debugging enabled.'}
                    {phoneForensics.extractionMethod === 'backup' && 'Extract data from cloud backups (Google Drive, iCloud).'}
                    {phoneForensics.extractionMethod === 'physical' && 'Full physical extraction. Requires rooted device and carries higher risk.'}
                  </p>
                </div>

                <div className="form-group">
                  <label>Export Format</label>
                  <select
                    value={phoneForensics.exportFormat}
                    onChange={e => updateForensics({ exportFormat: e.target.value as any })}
                  >
                    <option value="json">JSON (Machine-readable)</option>
                    <option value="csv">CSV (Spreadsheet)</option>
                    <option value="html">HTML (Web Report)</option>
                    <option value="pdf">PDF (Printable Report)</option>
                  </select>
                </div>

                <div className="toggle-group">
                  <label className="toggle-item">
                    <div className="toggle-info">
                      <strong>Include Deleted Data</strong>
                      <p>Recover deleted messages and files where possible</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={phoneForensics.includeDeleted}
                      onChange={e => updateForensics({ includeDeleted: e.target.checked })}
                    />
                  </label>

                  <label className="toggle-item">
                    <div className="toggle-info">
                      <strong>Include Metadata</strong>
                      <p>Timestamps, sender info, and technical metadata</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={phoneForensics.includeMetadata}
                      onChange={e => updateForensics({ includeMetadata: e.target.checked })}
                    />
                  </label>

                  <label className="toggle-item">
                    <div className="toggle-info">
                      <strong>Compress Export</strong>
                      <p>Reduce file size with ZIP compression</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={phoneForensics.compressData}
                      onChange={e => updateForensics({ compressData: e.target.checked })}
                    />
                  </label>
                </div>

                <div className="forensics-warning">
                  <p>⚠️ <strong>Legal Notice:</strong> Only extract data from devices you own or have explicit authorization to access. Unauthorized access may violate federal and local laws.</p>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'appearance' && (
            <section className="settings-section">
              <div className="appearance-panel">
                <h3>🎨 Appearance Settings</h3>
                <p className="panel-description">
                  Customize the look and feel of NexusDocs.
                </p>

                <div className="theme-section">
                  <label>
                    <strong>Theme Mode</strong>
                  </label>
                  <div className="theme-preview">
                    <ThemeToggle />
                  </div>
                  <p className="help-text">
                    Toggle between light and dark themes. Your preference is saved automatically.
                  </p>
                </div>

                <div className="appearance-info">
                  <h4>🎨 Customization Options</h4>
                  <ul>
                    <li>Theme persists across sessions</li>
                    <li>Automatic system theme detection (coming soon)</li>
                    <li>Custom color schemes (planned)</li>
                    <li>Font size adjustments (planned)</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'legal' && (
            <section className="settings-section">
              <div className="legal-panel">
                <h3>⚖️ Legal & About</h3>
                
                <LegalNotice compact={false} />

                <div className="about-section">
                  <h4>ℹ️ About NexusDocs</h4>
                  <div className="version-info">
                    <div className="version-row">
                      <span className="label">Version:</span>
                      <span className="value">2.1.0</span>
                    </div>
                    <div className="version-row">
                      <span className="label">Build Date:</span>
                      <span className="value">2026-03-14</span>
                    </div>
                    <div className="version-row">
                      <span className="label">Platform:</span>
                      <span className="value">NexusDocs Intelligence Platform</span>
                    </div>
                    <div className="version-row">
                      <span className="label">License:</span>
                      <span className="value">Proprietary - Authorized Use Only</span>
                    </div>
                  </div>

                  <div className="features-list">
                    <h4>🚀 Key Features</h4>
                    <ul>
                      <li>Multi-provider AI model orchestration</li>
                      <li>Real-time camera monitoring and motion detection</li>
                      <li>Phone forensics and data extraction</li>
                      <li>Wireless ADB device management</li>
                      <li>Document processing and analysis</li>
                      <li>Intelligent alert system</li>
                    </ul>
                  </div>

                  <div className="links-section">
                    <h4>🔗 Resources</h4>
                    <div className="resource-links">
                      <a href="#" className="resource-link">📚 Documentation</a>
                      <a href="#" className="resource-link">🐛 Report Issue</a>
                      <a href="#" className="resource-link">💡 Feature Request</a>
                      <a href="#" className="resource-link">📧 Contact Support</a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      <style jsx>{`
        .settings-tab {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }

        .settings-title h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          color: #111827;
        }

        .settings-subtitle {
          margin: 8px 0 0 0;
          font-size: 14px;
          color: #6b7280;
        }

        .settings-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
          color: #374151;
        }

        .action-btn.export:hover {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .action-btn.import:hover {
          background: #f0fdf4;
          border-color: #10b981;
        }

        .action-btn.reset:hover {
          background: #fef2f2;
          border-color: #ef4444;
        }

        .settings-layout {
          display: grid;
          grid-template-columns: 250px 1fr;
          gap: 24px;
        }

        .settings-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          height: fit-content;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: none;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .nav-item:hover {
          background: #f3f4f6;
        }

        .nav-item.active {
          background: #3b82f6;
          color: white;
        }

        .nav-icon {
          font-size: 18px;
        }

        .settings-content {
          min-height: 600px;
        }

        .settings-section {
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .forensics-panel,
        .appearance-panel,
        .legal-panel {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .forensics-panel h3,
        .appearance-panel h3,
        .legal-panel h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .panel-description {
          margin: 0 0 20px 0;
          font-size: 14px;
          color: #6b7280;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-group select,
        .form-group input[type="text"] {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          color: #1f2937;
          background: white;
        }

        .form-group select:focus,
        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .help-text {
          margin: 6px 0 0 0;
          font-size: 13px;
          color: #6b7280;
          font-style: italic;
        }

        .toggle-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 20px 0;
        }

        .toggle-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .toggle-info strong {
          display: block;
          font-size: 14px;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .toggle-info p {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
        }

        .toggle-item input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .forensics-warning {
          margin-top: 20px;
          padding: 16px;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 4px;
        }

        .forensics-warning p {
          margin: 0;
          font-size: 13px;
          color: #92400e;
        }

        .theme-section {
          margin-bottom: 24px;
        }

        .theme-section label strong {
          display: block;
          margin-bottom: 12px;
          font-size: 14px;
          color: #374151;
        }

        .theme-preview {
          margin-bottom: 12px;
        }

        .appearance-info {
          background: #f9fafb;
          padding: 16px;
          border-radius: 6px;
        }

        .appearance-info h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .appearance-info ul {
          margin: 0;
          padding-left: 20px;
          font-size: 14px;
          color: #6b7280;
        }

        .appearance-info li {
          margin-bottom: 6px;
        }

        .about-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .about-section h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .version-info {
          background: #f9fafb;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .version-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .version-row:last-child {
          border-bottom: none;
        }

        .version-row .label {
          color: #6b7280;
          font-weight: 500;
        }

        .version-row .value {
          color: #1f2937;
          font-weight: 600;
        }

        .features-list {
          margin-bottom: 20px;
        }

        .features-list ul {
          margin: 0;
          padding-left: 20px;
          font-size: 14px;
          color: #6b7280;
        }

        .features-list li {
          margin-bottom: 6px;
        }

        .links-section {
          margin-top: 20px;
        }

        .resource-links {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .resource-link {
          display: block;
          padding: 12px;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 14px;
          color: #1f2937;
          text-decoration: none;
          transition: all 0.2s;
        }

        .resource-link:hover {
          background: #e5e7eb;
          text-decoration: underline;
        }

        @media (max-width: 1024px) {
          .settings-layout {
            grid-template-columns: 1fr;
          }

          .settings-nav {
            flex-direction: row;
            overflow-x: auto;
          }

          .nav-item {
            white-space: nowrap;
          }
        }

        @media (max-width: 640px) {
          .settings-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .settings-actions {
            width: 100%;
            overflow-x: auto;
          }

          .settings-tab {
            padding: 16px;
          }
        }

        :global([data-theme='dark']) .settings-tab {
          background: #111827;
        }

        :global([data-theme='dark']) .settings-title h1 {
          color: #f9fafb;
        }

        :global([data-theme='dark']) .settings-subtitle {
          color: #9ca3af;
        }

        :global([data-theme='dark']) .settings-nav {
          background: #1f2937;
          border-color: #374151;
        }

        :global([data-theme='dark']) .nav-item {
          color: #e5e7eb;
        }

        :global([data-theme='dark']) .nav-item:hover {
          background: #374151;
        }

        :global([data-theme='dark']) .nav-item.active {
          background: #3b82f6;
        }

        :global([data-theme='dark']) .forensics-panel,
        :global([data-theme='dark']) .appearance-panel,
        :global([data-theme='dark']) .legal-panel {
          background: #1f2937;
          border-color: #374151;
        }

        :global([data-theme='dark']) .forensics-panel h3,
        :global([data-theme='dark']) .appearance-panel h3,
        :global([data-theme='dark']) .legal-panel h3 {
          color: #f9fafb;
        }

        :global([data-theme='dark']) .panel-description {
          color: #9ca3af;
        }

        :global([data-theme='dark']) .form-group label {
          color: #e5e7eb;
        }

        :global([data-theme='dark']) .form-group select,
        :global([data-theme='dark']) .form-group input {
          background: #374151;
          border-color: #4b5563;
          color: #f9fafb;
        }

        :global([data-theme='dark']) .help-text {
          color: #9ca3af;
        }

        :global([data-theme='dark']) .toggle-item {
          background: #374151;
          border-color: #4b5563;
        }

        :global([data-theme='dark']) .toggle-info strong {
          color: #f9fafb;
        }

        :global([data-theme='dark']) .toggle-info p {
          color: #9ca3af;
        }

        :global([data-theme='dark']) .forensics-warning {
          background: #422006;
          border-left-color: #f59e0b;
        }

        :global([data-theme='dark']) .forensics-warning p {
          color: #fcd34d;
        }

        :global([data-theme='dark']) .appearance-info {
          background: #374151;
        }

        :global([data-theme='dark']) .appearance-info h4 {
          color: #e5e7eb;
        }

        :global([data-theme='dark']) .appearance-info ul {
          color: #9ca3af;
        }

        :global([data-theme='dark']) .version-info {
          background: #374151;
        }

        :global([data-theme='dark']) .version-row {
          border-bottom-color: #4b5563;
        }

        :global([data-theme='dark']) .version-row .label {
          color: #9ca3af;
        }

        :global([data-theme='dark']) .version-row .value {
          color: #e5e7eb;
        }

        :global([data-theme='dark']) .features-list ul {
          color: #9ca3af;
        }

        :global([data-theme='dark']) .resource-link {
          background: #374151;
          color: #e5e7eb;
        }

        :global([data-theme='dark']) .resource-link:hover {
          background: #4b5563;
        }

        :global([data-theme='dark']) .action-btn {
          background: #374151;
          border-color: #4b5563;
          color: #e5e7eb;
        }

        :global([data-theme='dark']) .action-btn.export:hover {
          background: #1e3a5f;
          border-color: #60a5fa;
        }

        :global([data-theme='dark']) .action-btn.import:hover {
          background: #064e3b;
          border-color: #34d399;
        }

        :global([data-theme='dark']) .action-btn.reset:hover {
          background: #7f1d1d;
          border-color: #f87171;
        }
      `}</style>
    </div>
  );
};

export default SettingsTab;
