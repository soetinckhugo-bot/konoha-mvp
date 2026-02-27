// KONOHA - Radar Scout Module v2.0
// BMAD Architecture - Big Modulith Architecture Design

// Core
export { ModuleCoordinator } from './core/ModuleCoordinator';
export type { BMADModule, Player } from './core/types';

// Design System
export { Icons, injectIcon, createIcon } from './design/Icons';

// Config
export { 
  ALL_METRICS, 
  ROLE_METRICS,
  getMetricsForRole,
  normalizeMetric,
  formatMetricValue
} from './config/metrics.config';
export type { MetricConfig } from './config/metrics.config';

// Services
export { PercentileService, percentileService } from './services/PercentileService';
export type { PercentileResult, PlayerAnalysis } from './services/PercentileService';

// Modules BMAD
export { PlayerSelectModule } from './modules/PlayerSelectModule';
export { ModeSelectorModule } from './modules/ModeSelectorModule';
export { RoleFilterModule } from './modules/RoleFilterModule';
export { MetricsSelectorModule } from './modules/MetricsSelectorModule';
export { RadarChartModule } from './modules/RadarChartModule';
export { LeaderboardModule } from './modules/LeaderboardModule';
export { PlayerTiersModule } from './modules/PlayerTiersModule';
export { PlayerAnalysisModule } from './modules/PlayerAnalysisModule';
export { ExportModule } from './modules/ExportModule';
export { LexiqueModule } from './modules/LexiqueModule';

// Plugin Entry Point
export { default } from './RadarScoutPlugin';
export { default as RadarScoutPlugin } from './RadarScoutPlugin';
