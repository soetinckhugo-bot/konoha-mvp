/**
 * RadarScout Plugin - Entry Point
 * Version 2.0.0 - BMAD Architecture
 * 
 * Migration: V4 → BMAD
 * @see docs/phase2/week7-8-migration-guide.md
 */

import type { Plugin, CoreAPI, AppState } from '../../core/types';
import { FeatureFlagService } from '../../core/services/FeatureFlagService';
import { registerBMADModules } from './integration/registerModules';

// Legacy V4 (deprecated)
import { RadarScoutModule as RadarScoutModuleV4 } from './RadarScoutModuleV4';

export default class RadarScoutPlugin implements Plugin {
  readonly id = 'radar-scout';
  readonly name = 'Radar Scout';
  readonly version = '2.0.0';
  readonly icon = '🎯';

  private module: RadarScoutModuleV4 | null = null;
  private useBMAD: boolean = true;

  mount(core: CoreAPI): void {
    // Check feature flag
    this.useBMAD = FeatureFlagService.isEnabled('useBMAD');

    if (this.useBMAD) {
      console.log('[RadarScout] Using BMAD architecture v2.0.0');
      this.mountBMAD(core);
    } else {
      console.warn('[RadarScout] Using deprecated V4 architecture');
      this.mountV4(core);
    }

    // Émet événement
    core.emit('module:mounted', { 
      id: this.id, 
      version: this.version,
      architecture: this.useBMAD ? 'BMAD' : 'V4'
    });
  }

  private mountBMAD(core: CoreAPI): void {
    // Register all BMAD modules
    registerBMADModules();

    // Enable default modules
    FeatureFlagService.enable('soloMode');
    FeatureFlagService.enable('compareMode');
    FeatureFlagService.enable('benchmarkMode');
    FeatureFlagService.enable('playerSelectModule');
    FeatureFlagService.enable('leaderboardModule');
    FeatureFlagService.enable('centilesPanelModule');

    // Render via BMAD
    const container = document.createElement('div');
    container.className = 'radar-scout-bmad-container';
    
    // Add CSS
    this.injectStyles();

    // Initial render
    const context = {
      store: {
        getState: (key: string) => core.getState()[key as keyof AppState],
        setState: (key: string, value: any) => core.setState({ [key]: value } as Partial<AppState>),
        subscribe: core.on.bind(core),
      },
      container,
      mode: 'solo',
      selectedPlayer: core.getState().players[0] || null,
      selectedMetricIds: ['kda', 'kp', 'cspm', 'dpm', 'visionScore'],
      currentRole: 'MID',
      players: core.getState().players,
    };

    // Mount to DOM
    const root = document.getElementById('app') || document.body;
    root.appendChild(container);

    // Emit ready
    core.emit('radar-scout:ready', { architecture: 'BMAD' });
  }

  private mountV4(core: CoreAPI): void {
    // Legacy V4 mounting
    this.module = new RadarScoutModuleV4(core);
    this.module.render();
  }

  private injectStyles(): void {
    // Inject BMAD styles if not already present
    if (!document.getElementById('bmad-styles')) {
      const link = document.createElement('link');
      link.id = 'bmad-styles';
      link.rel = 'stylesheet';
      link.href = '/src/modules/radar-scout/styles/bmad-modules.css';
      document.head.appendChild(link);
    }
  }

  unmount(): void {
    if (this.useBMAD) {
      // Cleanup BMAD
      const container = document.querySelector('.radar-scout-bmad-container');
      container?.remove();
    } else {
      // Cleanup V4
      this.module?.destroy();
    }
    this.module = null;
  }

  canActivate(state: AppState): boolean {
    // Nécessite des données joueurs
    return state.players.length > 0;
  }
}

// Exports BMAD
export { PlayerSelectModule } from './modules/PlayerSelectModule';
export { LeaderboardModule } from './modules/LeaderboardModule';
export { CentilesPanelModule } from './modules/CentilesPanelModule';
export { CompareModule } from './modules/CompareModule';
export { BenchmarkModule } from './modules/BenchmarkModule';

// Exports Services
export { PercentileService } from './services/PercentileService';
export { GradeService } from './services/GradeService';
export { PlayerFilterService } from './services/PlayerFilterService';

// Exports Integration
export { registerBMADModules, BMAD_FEATURE_FLAGS } from './integration/registerModules';
