/**
 * ActivityFeed.tsx
 * NexusDocs Intelligence Platform - Recent Activity Feed Component
 * 
 * Displays a chronological list of recent system activities.
 */

import React from 'react';

// Types
interface ActivityItem {
  id: string;
  type: 'document' | 'device' | 'motion' | 'alert' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  deviceId?: string;
  severity?: 'low' | 'medium' | 'high';
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  onItemClick?: (activity: ActivityItem) => void;
}

// Icon mapping for activity types
const activityIcons = {
  document: '📄',
  device: '📱',
  motion: '🎬',
  alert: '⚠️',
  system: '⚙️',
};

// Color mapping for severity
const severityColors = {
  low: '#6b7280',
  medium: '#f59e0b',
  high: '#ef4444',
};

/**
 * ActivityFeed Component
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  maxItems = 10,
  onItemClick,
}) => {
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="activity-feed">
      {displayedActivities.length === 0 ? (
        <div className="no-activities">
          <p>No recent activity</p>
        </div>
      ) : (
        <ul className="activity-list">
          {displayedActivities.map((activity) => (
            <li
              key={activity.id}
              className={`activity-item ${onItemClick ? 'clickable' : ''}`}
              onClick={() => onItemClick?.(activity)}
              role={onItemClick ? 'button' : undefined}
              tabIndex={onItemClick ? 0 : undefined}
            >
              <div className="activity-icon">
                {activityIcons[activity.type]}
              </div>
              <div className="activity-content">
                <div className="activity-header">
                  <h4 className="activity-title">{activity.title}</h4>
                  <span className="activity-time">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
                <p className="activity-description">{activity.description}</p>
                {activity.deviceId && (
                  <div className="activity-device">
                    <span className="device-badge">{activity.deviceId}</span>
                  </div>
                )}
                {activity.severity && (
                  <div
                    className="severity-indicator"
                    style={{ backgroundColor: severityColors[activity.severity] }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .activity-feed {
          max-height: 400px;
          overflow-y: auto;
        }

        .no-activities {
          text-align: center;
          padding: 40px 20px;
          color: #9ca3af;
        }

        .activity-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
          position: relative;
        }

        .activity-item.clickable {
          cursor: pointer;
        }

        .activity-item.clickable:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .activity-icon {
          font-size: 24px;
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .activity-content {
          flex: 1;
          min-width: 0;
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .activity-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .activity-time {
          font-size: 12px;
          color: #9ca3af;
          flex-shrink: 0;
          margin-left: 8px;
        }

        .activity-description {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
          line-height: 1.4;
        }

        .activity-device {
          margin-top: 6px;
        }

        .device-badge {
          display: inline-block;
          padding: 2px 8px;
          background: #e5e7eb;
          border-radius: 9999px;
          font-size: 11px;
          color: #374151;
          font-weight: 500;
        }

        .severity-indicator {
          position: absolute;
          left: 0;
          top: 12px;
          width: 3px;
          height: calc(100% - 24px);
          border-radius: 2px;
        }

        /* Focus styles */
        .activity-item:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .activity-item:focus:not(:focus-visible) {
          outline: none;
        }

        .activity-item:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default ActivityFeed;
