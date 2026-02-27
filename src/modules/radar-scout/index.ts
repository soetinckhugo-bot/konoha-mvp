// KONOHA - Radar Scout Module v2.0
// BMAD Architecture - Big Modulith Architecture Design

// Core
export { ModuleCoordinator } from './core/ModuleCoordinator';
export type { BMADModule, Player } from './core/types';

// Modules BMAD
export { PlayerSelectModule } from './modules/PlayerSelectModule';
export { ModeSelectorModule } from './modules/ModeSelectorModule';
export { RoleFilterModule } from './modules/RoleFilterModule';
export { MetricsSelectorModule } from './modules/MetricsSelectorModule';
export { RadarChartModule } from './modules/RadarChartModule';
export { LeaderboardModule } from './modules/LeaderboardModule';

// Plugin Entry Point
export { default } from './RadarScoutPlugin';
export { default as RadarScoutPlugin } from './RadarScoutPlugin';
