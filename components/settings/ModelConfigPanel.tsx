/**
 * ModelConfigPanel.tsx
 * NexusDocs Intelligence Platform - AI Model Configuration
 * 
 * Provides configuration for AI model providers including:
 * - LM Studio (local inference)
 * - OpenClaw (orchestration layer)
 * - OpenRouter (multi-model API)
 * - Gemini (Google AI)
 */

import React, { useState, useEffect } from 'react';

interface ModelProvider {
  id: string;
  name: string;
  enabled: boolean;
  baseUrl: string;
  apiKey?: string;
  defaultModel?: string;
  status: 'connected' | 'disconnected' | 'error';
}

interface ModelConfigPanelProps {
  onConfigChange?: (config: ModelProvider[]) => void;
}

const defaultProviders: ModelProvider[] = [
  {
    id: 'lmstudio',
    name: 'LM Studio',
    enabled: true,
    baseUrl: 'http://localhost:1234',
    defaultModel: 'local-model',
    status: 'disconnected',
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    enabled: true,
    baseUrl: 'ws://localhost:18789',
    defaultModel: 'bailian/qwen3.5-plus',
    status: 'disconnected',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    enabled: false,
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    status: 'disconnected',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    enabled: false,
    baseUrl: 'https://generativelanguage.googleapis.com',
    apiKey: '',
    defaultModel: 'gemini-2.0-flash',
    status: 'disconnected',
  },
];

export const ModelConfigPanel: React.FC<ModelConfigPanelProps> = ({ onConfigChange }) => {
  const [providers, setProviders] = useState<ModelProvider[]>(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexusdocs-model-config');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved model config:', e);
        }
      }
    }
    return defaultProviders;
  });

  const [expandedProvider, setExpandedProvider] = useState<string | null>('lmstudio');

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('nexusdocs-model-config', JSON.stringify(providers));
    
    if (onConfigChange) {
      onConfigChange(providers);
    }
  }, [providers, onConfigChange]);

  const toggleProvider = (id: string) => {
    setProviders(prev =>
      prev.map(p =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  const updateProvider = (id: string, updates: Partial<ModelProvider>) => {
    setProviders(prev =>
      prev.map(p =>
        p.id === id ? { ...p, ...updates } : p
      )
    );
  };

  const testConnection = async (provider: ModelProvider) => {
    // Set status to testing
    updateProvider(provider.id, { status: 'disconnected' });
    
    try {
      if (provider.id === 'lmstudio') {
        const response = await fetch(`${provider.baseUrl}/v1/models`);
        if (response.ok) {
          updateProvider(provider.id, { status: 'connected' });
        } else {
          updateProvider(provider.id, { status: 'error' });
        }
      } else if (provider.id === 'openclaw') {
        // WebSocket connection test
        const ws = new WebSocket(provider.baseUrl);
        ws.onopen = () => {
          updateProvider(provider.id, { status: 'connected' });
          ws.close();
        };
        ws.onerror = () => {
          updateProvider(provider.id, { status: 'error' });
        };
      } else if (provider.apiKey) {
        // Test API key for cloud providers
        const response = await fetch(`${provider.baseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
          },
        });
        if (response.ok) {
          updateProvider(provider.id, { status: 'connected' });
        } else {
          updateProvider(provider.id, { status: 'error' });
        }
      }
    } catch (error) {
      console.error(`Connection test failed for ${provider.name}:`, error);
      updateProvider(provider.id, { status: 'error' });
    }
  };

  const getStatusColor = (status: ModelProvider['status']) => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'disconnected': return '#9ca3af';
      case 'error': return '#ef4444';
    }
  };

  const getStatusLabel = (status: ModelProvider['status']) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Not Connected';
      case 'error': return 'Connection Error';
    }
  };

  return (
    <div className="model-config-panel">
      <div className="panel-header">
        <h3>🤖 AI Model Providers</h3>
        <p className="panel-description">
          Configure AI model providers for document processing, analysis, and intelligence generation.
        </p>
      </div>

      <div className="providers-list">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={`provider-card ${!provider.enabled ? 'disabled' : ''}`}
          >
            <div className="provider-header">
              <div className="provider-title">
                <span className="provider-icon">
                  {provider.id === 'lmstudio' && '🏠'}
                  {provider.id === 'openclaw' && '🦾'}
                  {provider.id === 'openrouter' && '🌐'}
                  {provider.id === 'gemini' && '✨'}
                </span>
                <div>
                  <h4 className="provider-name">{provider.name}</h4>
                  <div className="provider-status">
                    <span
                      className="status-dot"
                      style={{ background: getStatusColor(provider.status) }}
                    />
                    <span className="status-text">{getStatusLabel(provider.status)}</span>
                  </div>
                </div>
              </div>
              <div className="provider-actions">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={provider.enabled}
                    onChange={() => toggleProvider(provider.id)}
                  />
                  <span className="toggle-slider" />
                </label>
                <button
                  onClick={() => testConnection(provider)}
                  className="test-btn"
                  disabled={!provider.enabled}
                >
                  Test
                </button>
                <button
                  onClick={() => setExpandedProvider(expandedProvider === provider.id ? null : provider.id)}
                  className="expand-btn"
                >
                  {expandedProvider === provider.id ? '▼' : '▶'}
                </button>
              </div>
            </div>

            {expandedProvider === provider.id && (
              <div className="provider-details">
                <div className="form-group">
                  <label>Base URL</label>
                  <input
                    type="text"
                    value={provider.baseUrl}
                    onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                    placeholder="http://localhost:1234"
                    disabled={!provider.enabled}
                  />
                </div>

                {provider.id !== 'lmstudio' && provider.id !== 'openclaw' && (
                  <div className="form-group">
                    <label>API Key</label>
                    <input
                      type="password"
                      value={provider.apiKey || ''}
                      onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                      placeholder="Enter API key"
                      disabled={!provider.enabled}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Default Model</label>
                  <input
                    type="text"
                    value={provider.defaultModel || ''}
                    onChange={(e) => updateProvider(provider.id, { defaultModel: e.target.value })}
                    placeholder="model-name"
                    disabled={!provider.enabled}
                  />
                </div>

                {provider.id === 'lmstudio' && (
                  <div className="provider-info">
                    <p>💡 <strong>Tip:</strong> LM Studio provides local inference with no API costs.</p>
                    <p>Make sure LM Studio is running and a model is loaded.</p>
                  </div>
                )}

                {provider.id === 'openclaw' && (
                  <div className="provider-info">
                    <p>💡 <strong>Tip:</strong> OpenClaw orchestrates multiple AI models.</p>
                    <p>Default: <code>bailian/qwen3.5-plus</code> for complex tasks</p>
                  </div>
                )}

                {provider.id === 'openrouter' && (
                  <div className="provider-info">
                    <p>💡 <strong>Tip:</strong> OpenRouter provides access to 100+ models.</p>
                    <p>Get API key at <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">openrouter.ai</a></p>
                  </div>
                )}

                {provider.id === 'gemini' && (
                  <div className="provider-info">
                    <p>💡 <strong>Tip:</strong> Google Gemini for advanced reasoning.</p>
                    <p>Get API key at <a href="https://makersuite.google.com" target="_blank" rel="noopener noreferrer">Google AI Studio</a></p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .model-config-panel {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .panel-header {
          margin-bottom: 20px;
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

        .providers-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .provider-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s;
        }

        .provider-card.disabled {
          opacity: 0.6;
          background: #f9fafb;
        }

        .provider-card:hover:not(.disabled) {
          border-color: #d1d5db;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .provider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f9fafb;
        }

        .provider-card.disabled .provider-header {
          background: #f3f4f6;
        }

        .provider-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .provider-icon {
          font-size: 24px;
        }

        .provider-name {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .provider-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .provider-actions {
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

        .provider-details {
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

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          color: #1f2937;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .form-group input:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .provider-info {
          margin-top: 16px;
          padding: 12px;
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
          border-radius: 4px;
        }

        .provider-info p {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #1e40af;
          line-height: 1.5;
        }

        .provider-info p:last-child {
          margin-bottom: 0;
        }

        .provider-info a {
          color: #2563eb;
          text-decoration: underline;
        }

        .provider-info code {
          background: #dbeafe;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 12px;
        }

        :global([data-theme='dark']) .model-config-panel {
          background: #1f2937;
          border-color: #374151;
        }

        :global([data-theme='dark']) .panel-header h3 {
          color: #f9fafb;
        }

        :global([data-theme='dark']) .panel-description {
          color: #9ca3af;
        }

        :global([data-theme='dark']) .provider-card {
          background: #374151;
          border-color: #4b5563;
        }

        :global([data-theme='dark']) .provider-card.disabled {
          background: #1f2937;
        }

        :global([data-theme='dark']) .provider-header {
          background: #374151;
        }

        :global([data-theme='dark']) .provider-card.disabled .provider-header {
          background: #1f2937;
        }

        :global([data-theme='dark']) .provider-name {
          color: #f9fafb;
        }

        :global([data-theme='dark']) .provider-status {
          color: #9ca3af;
        }

        :global([data-theme='dark']) .provider-details {
          background: #1f2937;
          border-top-color: #374151;
        }

        :global([data-theme='dark']) .form-group label {
          color: #e5e7eb;
        }

        :global([data-theme='dark']) .form-group input {
          background: #374151;
          border-color: #4b5563;
          color: #f9fafb;
        }

        :global([data-theme='dark']) .form-group input:focus {
          border-color: #60a5fa;
        }

        :global([data-theme='dark']) .form-group input:disabled {
          background: #1f2937;
          color: #6b7280;
        }

        :global([data-theme='dark']) .provider-info {
          background: #1e3a5f;
          border-left-color: #60a5fa;
        }

        :global([data-theme='dark']) .provider-info p {
          color: #93c5fd;
        }

        :global([data-theme='dark']) .provider-info code {
          background: #1e40af;
        }

        :global([data-theme='dark']) .provider-info a {
          color: #93c5fd;
        }
      `}</style>
    </div>
  );
};

export default ModelConfigPanel;
