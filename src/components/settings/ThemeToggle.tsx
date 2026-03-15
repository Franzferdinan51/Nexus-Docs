/**
 * ThemeToggle.tsx
 * NexusDocs Intelligence Platform - Light/Dark Mode Toggle
 * 
 * Provides a toggle switch for changing the application theme
 * between light and dark modes.
 */

import React, { useState, useEffect } from 'react';

interface ThemeToggleProps {
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ onThemeChange }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Load from localStorage or default to 'light'
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexusdocs-theme');
      return (saved === 'dark' || saved === 'light') ? saved : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexusdocs-theme', theme);
    
    if (onThemeChange) {
      onThemeChange(theme);
    }
  }, [theme, onThemeChange]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="theme-toggle">
      <button
        onClick={toggleTheme}
        className="theme-toggle-button"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <span className="theme-icon">
          {theme === 'light' ? '🌙' : '☀️'}
        </span>
        <span className="theme-label">
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </span>
      </button>

      <style jsx>{`
        .theme-toggle {
          display: inline-block;
        }

        .theme-toggle-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f3f4f6;
          border: 2px solid #e5e7eb;
          border-radius: 9999px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          transition: all 0.2s ease;
        }

        .theme-toggle-button:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
        }

        .theme-toggle-button:active {
          transform: scale(0.98);
        }

        .theme-icon {
          font-size: 18px;
          line-height: 1;
        }

        .theme-label {
          white-space: nowrap;
        }

        /* Dark mode styles */
        :global([data-theme='dark']) .theme-toggle-button {
          background: #374151;
          border-color: #4b5563;
          color: #f9fafb;
        }

        :global([data-theme='dark']) .theme-toggle-button:hover {
          background: #4b5563;
          border-color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default ThemeToggle;
