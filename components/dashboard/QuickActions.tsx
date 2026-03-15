/**
 * QuickActions.tsx
 * NexusDocs Intelligence Platform - Quick Action Buttons Component
 * 
 * Provides quick access to common actions and workflows.
 */

import React from 'react';

// Types
interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  disabled?: boolean;
  description?: string;
  shortcut?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  layout?: 'horizontal' | 'vertical' | 'grid';
}

/**
 * QuickActions Component
 */
export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  layout = 'grid',
}) => {
  const handleAction = (action: QuickAction) => {
    if (!action.disabled && action.action) {
      action.action();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    action: QuickAction
  ) => {
    if ((e.key === 'Enter' || e.key === ' ') && !action.disabled) {
      e.preventDefault();
      action.action();
    }
  };

  return (
    <div className={`quick-actions layout-${layout}`}>
      {actions.map((action) => (
        <button
          key={action.id}
          className={`action-button ${action.disabled ? 'disabled' : ''}`}
          onClick={() => handleAction(action)}
          onKeyDown={(e) => handleKeyDown(e, action)}
          disabled={action.disabled}
          title={action.description || action.label}
          aria-label={action.label}
        >
          <span className="action-icon">{action.icon}</span>
          <span className="action-label">{action.label}</span>
          {action.shortcut && (
            <kbd className="action-shortcut">{action.shortcut}</kbd>
          )}
          {action.disabled && (
            <span className="disabled-overlay">Disabled</span>
          )}
        </button>
      ))}

      <style jsx>{`
        .quick-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .layout-horizontal {
          flex-direction: row;
        }

        .layout-vertical {
          flex-direction: column;
        }

        .layout-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        }

        .action-button {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 20px;
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 120px;
          min-height: 100px;
          font-family: inherit;
        }

        .action-button:hover:not(.disabled) {
          border-color: #3b82f6;
          background: #eff6ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(59, 130, 246, 0.15);
        }

        .action-button:active:not(.disabled) {
          transform: translateY(0);
        }

        .action-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f9fafb;
        }

        .action-button:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .action-button:focus:not(:focus-visible) {
          outline: none;
        }

        .action-button:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .action-icon {
          font-size: 32px;
          line-height: 1;
        }

        .action-label {
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
          text-align: center;
        }

        .action-shortcut {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 2px 6px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 10px;
          font-family: monospace;
          color: #6b7280;
        }

        .disabled-overlay {
          position: absolute;
          bottom: 8px;
          font-size: 10px;
          color: #9ca3af;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        @media (max-width: 640px) {
          .quick-actions {
            grid-template-columns: repeat(2, 1fr);
          }

          .action-button {
            min-height: 80px;
            padding: 12px 16px;
          }

          .action-icon {
            font-size: 24px;
          }

          .action-label {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default QuickActions;
