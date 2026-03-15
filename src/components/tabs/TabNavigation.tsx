import React from 'react';
import { FileText, LayoutDashboard, Smartphone, Camera, Settings } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'phone', label: 'Phone Forensics', icon: Smartphone },
  { id: 'motioncam', label: 'MotionCam', icon: Camera },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="flex items-center gap-1 p-1 bg-card border-b" role="tablist">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-accent text-muted-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
