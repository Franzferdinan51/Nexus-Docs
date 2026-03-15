# Dashboard Components

> **NexusDocs Intelligence Platform** - Reusable Dashboard UI Components

This directory contains reusable React components for building dashboard interfaces in the NexusDocs platform.

---

## Components

### 1. StatsCard

**Purpose**: Display a single metric with icon, value, label, and optional trend indicator.

**Features**:
- ✅ Customizable icon (emoji or component)
- ✅ Trend indicators (up/down/neutral)
- ✅ Color themes (blue, green, red, orange, purple, cyan, gray)
- ✅ Click-through navigation
- ✅ Loading state support
- ✅ Accessible (keyboard navigable, ARIA labels)

**Usage**:
```tsx
import { StatsCard } from './StatsCard';

<StatsCard
  icon="📄"
  value="1,247"
  label="Documents Processed"
  trend={{ value: 12, direction: 'up' }}
  onClick={() => navigate('/documents')}
  color="blue"
/>
```

**Props**:
| Prop | Type | Required | Default |
|------|------|----------|---------|
| `icon` | `string` | ✅ Yes | - |
| `value` | `string | number` | ✅ Yes | - |
| `label` | `string` | ✅ Yes | - |
| `trend` | `TrendIndicator` | ❌ No | - |
| `onClick` | `() => void` | ❌ No | - |
| `color` | `ColorTheme` | ❌ No | `'blue'` |
| `disabled` | `boolean` | ❌ No | `false` |
| `loading` | `boolean` | ❌ No | `false` |

---

### 2. ActivityFeed

**Purpose**: Display a chronological list of recent system activities.

**Features**:
- ✅ Activity type icons
- ✅ Severity indicators
- ✅ Time-ago formatting
- ✅ Device badges
- ✅ Click handlers
- ✅ Scrollable with max height

**Usage**:
```tsx
import { ActivityFeed } from './ActivityFeed';

const activities = [
  {
    id: '1',
    type: 'motion',
    title: 'Motion Detected',
    description: 'Motion detected in 3x3 Tent',
    timestamp: new Date(),
    deviceId: 'moto-g-play',
    severity: 'medium',
  },
];

<ActivityFeed 
  activities={activities} 
  maxItems={10}
  onItemClick={(activity) => console.log(activity)}
/>
```

**Props**:
| Prop | Type | Required | Default |
|------|------|----------|---------|
| `activities` | `ActivityItem[]` | ✅ Yes | - |
| `maxItems` | `number` | ❌ No | `10` |
| `onItemClick` | `(item) => void` | ❌ No | - |

---

### 3. SystemStatus (SystemHealth)

**Purpose**: Display health status of system services.

**Features**:
- ✅ Service status indicators (online/offline/degraded)
- ✅ Uptime percentages
- ✅ Latency display with color coding
- ✅ Last check timestamp
- ✅ Color-coded status badges

**Usage**:
```tsx
import { SystemStatus } from './SystemStatus';

const services = [
  {
    name: 'Wireless ADB Service',
    status: 'online',
    uptime: 99.9,
    latency: 12,
  },
];

<SystemStatus 
  services={services} 
  lastCheck={new Date()}
/>
```

**Props**:
| Prop | Type | Required | Default |
|------|------|----------|---------|
| `services` | `ServiceStatus[]` | ✅ Yes | - |
| `lastCheck` | `Date` | ✅ Yes | - |

---

### 4. QuickActions

**Purpose**: Provide quick access to common actions and workflows.

**Features**:
- ✅ Multiple layouts (horizontal, vertical, grid)
- ✅ Icon + label display
- ✅ Keyboard shortcuts
- ✅ Disabled state support
- ✅ Hover effects

**Usage**:
```tsx
import { QuickActions } from './QuickActions';

const actions = [
  {
    id: 'connect-device',
    label: 'Connect Device',
    icon: '📱',
    action: () => console.log('Connect'),
  },
];

<QuickActions 
  actions={actions} 
  layout="grid"
/>
```

**Props**:
| Prop | Type | Required | Default |
|------|------|----------|---------|
| `actions` | `QuickAction[]` | ✅ Yes | - |
| `layout` | `'horizontal' | 'vertical' | 'grid'` | ❌ No | `'grid'` |

---

## Type Definitions

```typescript
// Common types used across components

type ActivityType = 'document' | 'device' | 'motion' | 'alert' | 'system';
type Severity = 'low' | 'medium' | 'high';
type ColorTheme = 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'cyan' | 'gray';

interface TrendIndicator {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  label?: string;
}

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  deviceId?: string;
  severity?: Severity;
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
  description?: string;
  shortcut?: string;
}
```

---

## Styling

All components use **CSS-in-JS** with `styled-jsx` for scoped styles.

### Customization

Components can be customized via:
1. **Props** (color, layout, etc.)
2. **CSS overrides** (global styles)
3. **Theme provider** (for consistent theming)

### Responsive Design

All components are responsive and adapt to different screen sizes:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

---

## Accessibility

All components follow **WCAG 2.1 AA** guidelines:

- ✅ Proper ARIA labels
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Screen reader support
- ✅ Color contrast ratios

---

## Testing

Components include comprehensive test coverage:

```bash
# Run unit tests
npm test -- src/components/dashboard

# Run integration tests
npm test -- src/components/dashboard/*.integration.test.tsx

# Run E2E tests
npm run test:e2e -- dashboard
```

---

## Examples

### Complete Dashboard Layout

```tsx
import { StatsCard, ActivityFeed, SystemStatus, QuickActions } from './dashboard';

export const Dashboard = () => {
  return (
    <div className="dashboard">
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatsCard icon="📄" value="1,247" label="Documents" color="blue" />
        <StatsCard icon="📱" value="3" label="Devices" color="green" />
        <StatsCard icon="🎬" value="89" label="Motion Events" color="purple" />
        <StatsCard icon="💾" value="67%" label="Storage" color="orange" />
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        <div className="panel">
          <h2>Recent Activity</h2>
          <ActivityFeed activities={activities} />
        </div>
        <div className="panel">
          <h2>System Status</h2>
          <SystemStatus services={services} lastCheck={new Date()} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="panel">
        <h2>Quick Actions</h2>
        <QuickActions actions={actions} layout="grid" />
      </div>
    </div>
  );
};
```

### With Real Data

```tsx
import { useEffect, useState } from 'react';
import { StatsCard } from './dashboard';

export const DashboardWithRealData = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <LoadingSkeleton />;

  return (
    <div className="stats-grid">
      <StatsCard
        icon="📄"
        value={stats.documentsProcessed.toLocaleString()}
        label="Documents Processed"
        trend={{ value: 12, direction: 'up' }}
        color="blue"
      />
      <StatsCard
        icon="📱"
        value={stats.devicesConnected}
        label="Devices Connected"
        color="green"
      />
      {/* ... more cards */}
    </div>
  );
};
```

---

## Contributing

When adding new dashboard components:

1. **Create component** in this directory
2. **Add TypeScript types** for props
3. **Write tests** (unit + integration)
4. **Document** in this README
5. **Export** from `index.ts`
6. **Ensure accessibility** (WCAG 2.1 AA)

---

## See Also

- [Dashboard Specification](../../integration/dashboard-spec.md) - Complete technical spec
- [DashboardTab](../tabs/DashboardTab.tsx) - Main dashboard container
- [Component Specs](../../integration/component-specs.md) - Overall component architecture

---

*Last Updated: 2026-03-14*  
*NexusDocs Intelligence Platform*
