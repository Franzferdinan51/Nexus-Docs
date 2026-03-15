/**
 * StatsCard.tsx
 * NexusDocs Intelligence Platform - Reusable Statistics Card Component
 * 
 * Displays a single metric with icon, value, label, and optional trend indicator.
 * Supports click-through to detailed views.
 */

import React from 'react';

// Types
interface TrendIndicator {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  label?: string;
}

interface StatsCardProps {
  /** Icon emoji or component */
  icon: string;
  /** Main value to display */
  value: string | number;
  /** Label/description below the value */
  label: string;
  /** Optional trend indicator */
  trend?: TrendIndicator;
  /** Click handler for navigation */
  onClick?: () => void;
  /** Color theme */
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'cyan' | 'gray';
  /** Disabled state */
  disabled?: boolean;
  /** Tooltip text */
  tooltip?: string;
  /** Loading state */
  loading?: boolean;
  /** Custom className */
  className?: string;
}

// Color configurations
const colorConfig = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'border-blue-200',
    hover: 'hover:border-blue-300',
  },
  green: {
    bg: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    border: 'border-green-200',
    hover: 'hover:border-green-300',
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    border: 'border-red-200',
    hover: 'hover:border-red-300',
  },
  orange: {
    bg: 'bg-orange-50',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    border: 'border-orange-200',
    hover: 'hover:border-orange-300',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    border: 'border-purple-200',
    hover: 'hover:border-purple-300',
  },
  cyan: {
    bg: 'bg-cyan-50',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    border: 'border-cyan-200',
    hover: 'hover:border-cyan-300',
  },
  gray: {
    bg: 'bg-gray-50',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    border: 'border-gray-200',
    hover: 'hover:border-gray-300',
  },
};

/**
 * TrendIndicator Component
 * Displays a small trend arrow with percentage/value
 */
const TrendIndicator: React.FC<{ trend: TrendIndicator }> = ({ trend }) => {
  const { value, direction, label } = trend;
  
  const getArrowIcon = () => {
    switch (direction) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'neutral':
        return '→';
      default:
        return '→';
    }
  };

  const getColorClass = () => {
    // Green for positive (up), red for negative (down)
    // Unless it's something like alerts/errors where down is good
    if (direction === 'up') return 'text-green-600';
    if (direction === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className={`trend-indicator ${getColorClass()}`}>
      <span className="trend-arrow">{getArrowIcon()}</span>
      <span className="trend-value">{value > 0 ? '+' : ''}{value}</span>
      {label && <span className="trend-label">{label}</span>}
    </div>
  );
};

/**
 * StatsCard Component
 * Main reusable statistics card
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  value,
  label,
  trend,
  onClick,
  color = 'blue',
  disabled = false,
  tooltip,
  loading = false,
  className = '',
}) => {
  const config = colorConfig[color] || colorConfig.blue;
  const isClickable = onClick && !disabled && !loading;

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`stats-card ${config.bg} ${config.border} ${config.hover} ${className} ${
        isClickable ? 'clickable' : ''
      } ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      title={tooltip}
      aria-disabled={disabled || loading}
      aria-label={`${label}: ${value}`}
    >
      {/* Icon Section */}
      <div className="stats-card-icon">
        <div className={`icon-wrapper ${config.iconBg}`}>
          <span className={`icon-emoji ${config.iconColor}`}>{icon}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="stats-card-content">
        {loading ? (
          <div className="loading-placeholder">
            <div className="loading-value"></div>
            <div className="loading-label"></div>
          </div>
        ) : (
          <>
            <div className="stats-card-value">{value}</div>
            <div className="stats-card-label">{label}</div>
            {trend && <TrendIndicator trend={trend} />}
          </>
        )}
      </div>

      {/* Click Indicator (if clickable) */}
      {isClickable && (
        <div className="click-indicator">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .stats-card {
          position: relative;
          background: ${config.bg};
          border: 1px solid ${config.border};
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.2s ease;
          cursor: ${isClickable ? 'pointer' : 'default'};
          min-width: 180px;
        }

        .stats-card:hover {
          border-color: ${config.hover.split(' ')[1]};
          transform: ${isClickable ? 'translateY(-2px)' : 'none'};
          box-shadow: ${isClickable ? '0 4px 6px rgba(0, 0, 0, 0.07)' : 'none'};
        }

        .stats-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .stats-card.disabled:hover {
          transform: none;
          box-shadow: none;
        }

        .stats-card-icon {
          display: flex;
          align-items: flex-start;
        }

        .icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          ${config.iconBg}
        }

        .icon-emoji {
          font-size: 24px;
          ${config.iconColor}
        }

        .stats-card-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stats-card-value {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
        }

        .stats-card-label {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .trend-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 4px;
        }

        .trend-arrow {
          font-size: 14px;
        }

        .trend-value {
          font-weight: 700;
        }

        .trend-label {
          color: #9ca3af;
          font-weight: 400;
        }

        .click-indicator {
          position: absolute;
          top: 20px;
          right: 20px;
          color: #9ca3af;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .stats-card:hover .click-indicator {
          opacity: 1;
        }

        .loading-placeholder {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .loading-value {
          height: 32px;
          width: 100px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
          animation: pulse 1.5s infinite;
        }

        .loading-label {
          height: 16px;
          width: 140px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Focus styles for accessibility */
        .stats-card:focus {
          outline: 2px solid ${config.iconColor};
          outline-offset: 2px;
        }

        .stats-card:focus:not(:focus-visible) {
          outline: none;
        }

        .stats-card:focus-visible {
          outline: 2px solid ${config.iconColor};
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default StatsCard;
