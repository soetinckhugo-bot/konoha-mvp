/**
 * Registration des modules BMAD
 * 
 * Ce fichier enregistre tous les modules BMAD dans le Router
 * avec leurs feature flags respectifs.
 * 
 * Pattern Strangler Fig : Les modules sont enregistrés mais
 * ne s'activent que si leur feature flag est enabled.
 */

import { Router } from '../../../core/Router';
import { PlayerFilterService } from '../services/PlayerFilterService';
import { PercentileService } from '../services/PercentileService';
import { GradeService } from '../services/GradeService';
import { SoloModule } from '../modules/SoloModule';
import { PlayerSelectModule } from '../modules/PlayerSelectModule';
import { LeaderboardModule } from '../modules/LeaderboardModule';
import { CentilesPanelModule } from '../modules/CentilesPanelModule';
import { CompareModule } from '../modules/CompareModule';
import { BenchmarkModule } from '../modules/BenchmarkModule';
import { RadarChartModule } from '../modules/RadarChartModule';
import { ExportService } from '../services/ExportService';

/**
 * Enregistre tous les modules BMAD dans le Router
 * 
 * @example
 * registerBMADModules(); // À appeler au démarrage
 */
export function registerBMADModules(): void {
  console.log('[BMAD] Registering modules...');
  
  // Services partagés (singletons)
  const playerFilterService = new PlayerFilterService();
  const percentileService = new PercentileService();
  const gradeService = new GradeService();
  
  // ============================================================
  // Modules Principaux (Modes)
  // ============================================================
  
  // Mode Solo - Vue individuelle joueur
  Router.register('solo', new SoloModule(), { flag: 'soloMode' });
  
  // Mode Compare - Comparaison 2 joueurs
  Router.register('compare', new CompareModule(percentileService, gradeService, playerFilterService), {
    flag: 'compareMode'
  });
  
  // Mode Benchmark - vs Moyenne
  Router.register('benchmark', new BenchmarkModule(percentileService, gradeService, playerFilterService), {
    flag: 'benchmarkMode'
  });
  
  // ============================================================
  // Modules UI (Composants réutilisables)
  // ============================================================
  
  // PlayerSelect - Dropdown de sélection
  Router.register('player-select', new PlayerSelectModule(playerFilterService), {
    flag: 'playerSelectModule'
  });
  
  // Leaderboard - Top 12 classement
  Router.register('leaderboard', new LeaderboardModule(playerFilterService, gradeService), {
    flag: 'leaderboardModule'
  });
  
  // CentilesPanel - Panneaux Fight/Vision/Resources
  Router.register('centiles', new CentilesPanelModule(percentileService, gradeService), {
    flag: 'centilesPanel'
  });
  
  // RadarChart - Graphique radar
  Router.register('radar-chart', new RadarChartModule(percentileService, gradeService), {
    flag: 'radarChartModule'
  });
  
  console.log('[BMAD] Modules registered successfully');
}

/**
 * Enregistre le fallback legacy V4
 * 
 * @param legacyRenderer - Fonction de rendu V4
 */
export function registerLegacyFallback(legacyRenderer: (mode: string, container: HTMLElement) => void): void {
  console.log('[BMAD] Registering legacy fallback...');
  
  Router.useLegacy('solo', (ctx, container) => legacyRenderer('solo', container));
  Router.useLegacy('compare', (ctx, container) => legacyRenderer('compare', container));
  Router.useLegacy('benchmark', (ctx, container) => legacyRenderer('benchmark', container));
  
  console.log('[BMAD] Legacy fallback registered');
}

/**
 * Feature flags disponibles
 */
export const BMAD_FEATURE_FLAGS = {
  // Modes principaux
  soloMode: 'soloMode',
  compareMode: 'compareMode',
  benchmarkMode: 'benchmarkMode',
  
  // Modules UI
  playerSelectModule: 'playerSelectModule',
  leaderboardModule: 'leaderboardModule',
  centilesPanel: 'centilesPanelModule',
  radarChart: 'radarChartModule',
  
  // Services
  exportService: 'exportService',
  
  // Fonctionnalités
  centilesDisplay: 'centilesDisplay',
  leaderboard: 'leaderboard',
  exportPNG: 'exportPNG',
  overlayChart: 'overlayChart',
} as const;

export default registerBMADModules;
