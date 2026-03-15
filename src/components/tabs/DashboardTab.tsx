import React from 'react';
import { FileText, Smartphone, Camera, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

interface StatCardProps {
  icon: React.ElementType;
  value: string | number;
  label: string;
  trend?: string;
}

function StatCard({ icon: Icon, value, label, trend }: StatCardProps) {
  return (
    <div className="p-4 bg-card rounded-lg border shadow-sm">
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5 text-muted-foreground" />
        {trend && (
          <span className={`text-xs ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export function DashboardTab() {
  const stats = {
    documents: 0,
    devices: 0,
    cameras: 0,
    motionEvents: 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} value={stats.documents} label="Documents Analyzed" trend="+0" />
        <StatCard icon={Smartphone} value={stats.devices} label="Devices Connected" />
        <StatCard icon={Camera} value={statss.cameras} label="Active Cameras" />
        <StatCard icon={Activity} value={stats.motionEvents} label="Motion Events" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 bg-card rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">NexusDocs Core: Online</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Serenity-Forensics: Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">MotionCam: Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">OpenClaw Gateway: Configure in Settings</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-card rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="text-sm text-muted-foreground">
            No recent activity. Start by connecting a device or uploading documents.
          </div>
        </div>
      </div>
    </div>
  );
}
