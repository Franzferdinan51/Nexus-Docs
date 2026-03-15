/**
 * DashboardTab.tsx
 * NexusDocs Intelligence Platform - Unified Overview Dashboard
 * 
 * Provides a comprehensive overview of system status, quick stats,
 * recent activity, and quick actions for the NexusDocs platform.
 */

import React, { useState, useEffect } from 'react';
import { StatsCard } from '../dashboard/StatsCard';
import { ActivityFeed } from '../dashboard/ActivityFeed';
import { SystemStatus } from '../dashboard/SystemStatus';
import { QuickActions } from '../dashboard/QuickActions';

// Types
interface DashboardStats {
  documentsProcessed: number;
  devicesConnected: number;
  motionEvents: number;
  storageUsed: number;
  activeStreams: number;
  alertsPending: number;
}

interface ActivityItem {
  id: string;
  type: 'document' | 'device' | 'motion' | 'alert' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  deviceId?: string;
  severity?: 'low' | 'medium' | 'high';
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  services: ServiceStatus[];
  lastCheck: Date;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  latency?: number;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  disabled?: boolean;
}

// Mock Data (replace with actual API calls)
const mockStats: DashboardStats = {
  documentsProcessed: 1247,
  devicesConnected: 3,
  motionEvents: 89,
  storageUsed: 67,
  activeStreams: 2,
  alertsPending: 5,
};

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'motion',
    title: 'Motion Detected',
    description: 'Motion detected in 3x3 Tent - Camera 1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    deviceId: 'moto-g-play',
    severity: 'medium',
  },
  {
    id: '2',
    type: 'device',
    title: 'Device Connected',
    description: 'Moto G Play connected via wireless ADB',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    deviceId: 'moto-g-play',
  },
  {
    id: '3',
    type: 'document',
    title: 'Document Processed',
    description: 'Phone extraction completed: 1,247 messages',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    severity: 'low',
  },
  {
    id: '4',
    type: 'alert',
    title: 'Storage Warning',
    description: 'Storage usage at 67% - consider cleanup',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    severity: 'medium',
  },
  {
    id: '5',
    type: 'system',
    title: 'System Update',
    description: 'NexusDocs v2.1.0 installed successfully',
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    severity: 'low',
  },
];

const mockSystemHealth: SystemHealth = {
  status: 'healthy',
  services: [
    { name: 'Wireless ADB Service', status: 'online', uptime: 99.9, latency: 12 },
    { name: 'Motion Detection', status: 'online', uptime: 99.7, latency: 45 },
    { name: 'Document Processor', status: 'online', uptime: 99.5, latency: 230 },
    { name: 'WebSocket Server', status: 'online', uptime: 99.8, latency: 8 },
    { name: 'Storage Service', status: 'degraded', uptime: 98.2, latency: 450 },
  ],
  lastCheck: new Date(),
};

// Dashboard Tab Component
export const DashboardTab: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>(mockSystemHealth);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Refresh data periodically
  useEffect(() => {
    const refreshData = async () => {
      // TODO: Replace with actual API calls
      // const response = await fetch('/api/dashboard/stats');
      // setStats(await response.json());
      setLastUpdated(new Date());
    };

    refreshData();
    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'connect-device',
      label: 'Connect Device',
      icon: '📱',
      action: () => console.log('Connect device clicked'),
    },
    {
      id: 'start-extraction',
      label: 'Start Extraction',
      icon: '🔄',
      action: () => console.log('Start extraction clicked'),
    },
    {
      id: 'view-alerts',
      label: 'View Alerts',
      icon: '⚠️',
      action: () => console.log('View alerts clicked'),
      disabled: stats.alertsPending === 0,
    },
    {
      id: 'system-settings',
      label: 'Settings',
      icon: '⚙️',
      action: () => console.log('Settings clicked'),
    },
  ];

  return (
    <div className="dashboard-tab">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>📊 Dashboard</h1>
          <p className="dashboard-subtitle">
            NexusDocs Intelligence Platform Overview
          </p>
        </div>
        <div className="dashboard-last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="stats-grid">
        <StatsCard
          icon="📄"
          value={stats.documentsProcessed.toLocaleString()}
          label="Documents Processed"
          trend={{ value: 12, direction: 'up' }}
          onClick={() => console.log('Navigate to documents')}
          color="blue"
        />
        <StatsCard
          icon="📱"
          value={stats.devicesConnected.toString()}
          label="Devices Connected"
          trend={{ value: 1, direction: 'up' }}
          onClick={() => console.log('Navigate to devices')}
          color="green"
        />
        <StatsCard
          icon="🎬"
          value={stats.motionEvents.toString()}
          label="Motion Events (24h)"
          trend={{ value: 5, direction: 'down' }}
          onClick={() => console.log('Navigate to motion events')}
          color="purple"
        />
        <StatsCard
          icon="💾"
          value={`${stats.storageUsed}%`}
          label="Storage Used"
          trend={{ value: 2, direction: 'up' }}
          onClick={() => console.log('Navigate to storage')}
          color={stats.storageUsed > 80 ? 'red' : 'orange'}
        />
        <StatsCard
          icon="📹"
          value={stats.activeStreams.toString()}
          label="Active Streams"
          onClick={() => console.log('Navigate to streams')}
          color="cyan"
        />
        <StatsCard
          icon="🔔"
          value={stats.alertsPending.toString()}
          label="Pending Alerts"
          onClick={() => console.log('Navigate to alerts')}
          color={stats.alertsPending > 0 ? 'red' : 'gray'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Recent Activity Feed */}
        <div className="dashboard-panel activity-panel">
          <div className="panel-header">
            <h2>📜 Recent Activity</h2>
            <button className="view-all-btn">View All</button>
          </div>
          <ActivityFeed activities={activities} />
        </div>

        {/* System Status */}
        <div className="dashboard-panel status-panel">
          <div className="panel-header">
            <h2>🏥 System Status</h2>
            <div className={`status-badge status-${systemHealth.status}`}>
              {systemHealth.status.toUpperCase()}
            </div>
          </div>
          <SystemHealth services={systemHealth.services} lastCheck={systemHealth.lastCheck} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-panel actions-panel">
        <div className="panel-header">
          <h2>⚡ Quick Actions</h2>
        </div>
        <QuickActions actions={quickActions} />
      </div>

      {/* Styles */}
      <style jsx>{`
        .dashboard-tab {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }

        .dashboard-title h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          color: #111827;
        }

        .dashboard-subtitle {
          margin: 8px 0 0 0;
          font-size: 14px;
          color: #6b7280;
        }

        .dashboard-last-updated {
          font-size: 13px;
          color: #9ca3af;
          font-style: italic;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .dashboard-content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .dashboard-panel {
          background: #ffffff;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .view-all-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 13px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .view-all-btn:hover {
          background: #eff6ff;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-healthy {
          background: #d1fae5;
          color: #065f46;
        }

        .status-degraded {
          background: #fef3c7;
          color: #92400e;
        }

        .status-critical {
          background: #fee2e2;
          color: #991b1b;
        }

        .actions-panel {
          margin-bottom: 0;
        }

        @media (max-width: 1024px) {
          .dashboard-content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardTab;
