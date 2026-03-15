/**
 * LegalNotice.tsx
 * NexusDocs Intelligence Platform - Legal Disclaimer Display
 * 
 * Displays legal disclaimers, terms of service, and privacy notices
 * for the NexusDocs Intelligence Platform.
 */

import React, { useState } from 'react';

interface LegalNoticeProps {
  compact?: boolean;
}

export const LegalNotice: React.FC<LegalNoticeProps> = ({ compact = false }) => {
  const [expanded, setExpanded] = useState(false);

  const version = '2.1.0';
  const buildDate = '2026-03-14';

  if (compact) {
    return (
      <div className="legal-notice-compact">
        <p className="legal-text">
          ⚠️ <strong>For authorized use only.</strong> This system is intended for legitimate
          forensic analysis and device management. Unauthorized access or use is prohibited.
        </p>
        <style jsx>{`
          .legal-notice-compact {
            padding: 12px 16px;
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            border-radius: 4px;
            margin: 16px 0;
          }

          .legal-text {
            margin: 0;
            font-size: 13px;
            color: #92400e;
            line-height: 1.5;
          }

          :global([data-theme='dark']) .legal-notice-compact {
            background: #422006;
            border-left-color: #f59e0b;
          }

          :global([data-theme='dark']) .legal-text {
            color: #fcd34d;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="legal-notice">
      <div className="legal-header">
        <h3>⚖️ Legal Disclaimer & Terms of Use</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="expand-btn"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      {expanded && (
        <div className="legal-content">
          <section className="legal-section">
            <h4>⚠️ Authorized Use Only</h4>
            <p>
              The NexusDocs Intelligence Platform is designed for legitimate forensic analysis,
              device management, and intelligence gathering purposes. Access to and use of this
              system is restricted to authorized personnel only.
            </p>
          </section>

          <section className="legal-section">
            <h4>📋 Compliance Requirements</h4>
            <p>Users must comply with all applicable laws and regulations, including but not limited to:</p>
            <ul>
              <li>Electronic Communications Privacy Act (ECPA)</li>
              <li>Computer Fraud and Abuse Act (CFAA)</li>
              <li>General Data Protection Regulation (GDPR) if applicable</li>
              <li>Local and federal privacy laws</li>
            </ul>
          </section>

          <section className="legal-section">
            <h4>🔒 Data Handling</h4>
            <p>
              All data extracted, processed, or stored by this system must be handled in accordance
              with applicable privacy laws and organizational policies. Users are responsible for
              obtaining proper authorization before accessing any device or data.
            </p>
          </section>

          <section className="legal-section">
            <h4>⚡ No Warranty</h4>
            <p>
              This software is provided "as is" without warranty of any kind, express or implied.
              The developers assume no liability for any damages arising from the use or misuse
              of this software.
            </p>
          </section>

          <section className="legal-section">
            <h4>📝 Version Information</h4>
            <div className="version-info">
              <div><strong>Version:</strong> {version}</div>
              <div><strong>Build Date:</strong> {buildDate}</div>
              <div><strong>Platform:</strong> NexusDocs Intelligence Platform</div>
            </div>
          </section>

          <div className="legal-acknowledgment">
            <p>
              By using this system, you acknowledge that you have read, understood, and agree
              to comply with these terms and all applicable laws.
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        .legal-notice {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 16px 0;
        }

        .legal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .legal-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .expand-btn {
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 13px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .expand-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .legal-content {
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
        }

        .legal-section {
          margin-bottom: 20px;
        }

        .legal-section h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .legal-section p {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
        }

        .legal-section ul {
          margin: 0;
          padding-left: 20px;
          font-size: 14px;
          color: #6b7280;
        }

        .legal-section li {
          margin-bottom: 4px;
          line-height: 1.5;
        }

        .version-info {
          background: #f9fafb;
          padding: 12px;
          border-radius: 4px;
          font-size: 13px;
          color: #4b5563;
        }

        .version-info div {
          margin-bottom: 4px;
        }

        .version-info div:last-child {
          margin-bottom: 0;
        }

        .legal-acknowledgment {
          margin-top: 24px;
          padding: 16px;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 4px;
        }

        .legal-acknowledgment p {
          margin: 0;
          font-size: 13px;
          color: #92400e;
          font-weight: 500;
        }

        :global([data-theme='dark']) .legal-notice {
          background: #1f2937;
          border-color: #374151;
        }

        :global([data-theme='dark']) .legal-header h3 {
          color: #f9fafb;
        }

        :global([data-theme='dark']) .legal-section h4 {
          color: #e5e7eb;
        }

        :global([data-theme='dark']) .legal-section p,
        :global([data-theme='dark']) .legal-section li {
          color: #9ca3af;
        }

        :global([data-theme='dark']) .version-info {
          background: #374151;
          color: #d1d5db;
        }

        :global([data-theme='dark']) .legal-acknowledgment {
          background: #422006;
          border-left-color: #f59e0b;
        }

        :global([data-theme='dark']) .legal-acknowledgment p {
          color: #fcd34d;
        }
      `}</style>
    </div>
  );
};

export default LegalNotice;
