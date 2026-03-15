/**
 * Dashboard Components - Index Export
 * NexusDocs Intelligence Platform
 */

export { StatsCard } from './StatsCard';
export { ActivityFeed } from './ActivityFeed';
export { SystemHealth as SystemStatus } from './SystemStatus';
export { QuickActions } from './QuickActions';

// Re-export types
export type {
  StatsCardProps,
  TrendIndicator,
} from './StatsCard';

export type {
  ActivityItem,
  ActivityFeedProps,
  ActivityType,
  Severity,
} from './ActivityFeed';

export type {
  ServiceStatus,
  SystemHealthProps,
} from './SystemStatus';

export type {
  QuickAction,
  QuickActionsProps,
} from './QuickActions';
