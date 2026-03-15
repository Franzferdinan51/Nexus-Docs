/**
 * SystemStatus.tsx
 * NexusDocs Intelligence Platform - System Health Status Component
 * 
 * Displays the health status of all system services.
 */

import React from 'react';

// Types
interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  latency?: number;
}

interface SystemHealthProps {
  services: ServiceStatus[];
  lastCheck: Date;
}

// Status color mapping
const statusColors = {
  online: {
    bg: '#d1fae5',
    text: '#065f46',
    dot: '#10b981',
  },
  offline: {
    bg: '#fee2e2',
    text: '#991b1b',
    dot: '#ef4444',
  },
  degraded: {
    bg: '#fef3c7',
    text: '#92400e',
    dot: '#f59e0b',
  },
};

/**
 * SystemHealth Component
 */
export const SystemHealth: React.FC<SystemHealthProps> = ({
  services,
  lastCheck,
}) => {
  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return '✓';
      case 'offline':
        return '✗';
      case 'degraded':
        return '!';
      default:
        return '?';
    }
  };

  const formatUptime = (uptime: number): string => {
    return `${uptime.toFixed(1)}%`;
  };

  const formatLatency = (latency?: number): string => {
    if (latency === undefined) return 'N/A';
    if (latency < 100) return `${latency}ms`;
    if (latency < 1000) return `${(latency / 1000).toFixed(1)}s`;
    return `${(latency / 1000).toFixed(1)}s`;
  };

  const getLatencyColor = (latency?: number): string => {
    if (latency === undefined) return '#9ca3af';
    if (latency < 100) return '#10b981';
    if (latency < 500) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="system-health">
      <ul className="services-list">
        {services.map((service) => {
          const colors = statusColors[service.status];
          return (
            <li key={service.name} className="service-item">
              <div className="service-header">
                <div className="service-name">{service.name}</div>
                <div
                  className="service-status"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                  }}
                >
                  <span
                    className="status-dot"
                    style={{ backgroundColor: colors.dot }}
                  />
                  {getStatusIcon(service.status)}
                </div>
              </div>
              <div className="service-metrics">
                <div className="metric">
                  <span className="metric-label">Uptime</span>
                  <span className="metric-value">{formatUptime(service.uptime)}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Latency</span>
                  <span
                    className="metric-value"
                    style={{ color: getLatencyColor(service.latency) }}
                  >
                    {formatLatency(service.latency)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="last-check">
        Last health check: {lastCheck.toLocaleTimeString()}
      </div>

      <style jsx>{`
        .system-health {
          padding: 8px 0;
        }

        .services-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .service-item {
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .service-name {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .service-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .service-metrics {
          display: flex;
          gap: 16px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }

        .metric {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .metric-label {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          font-weight: 500;
        }

        .metric-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .last-check {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #9ca3af;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default SystemHealth;
