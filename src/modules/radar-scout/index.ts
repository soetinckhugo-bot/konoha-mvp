/**
 * RadarScout Plugin - Entry Point
 * Story 3.1
 */

import type { Plugin, CoreAPI, AppState } from '../../core/types';
import { RadarScoutModule } from './RadarScoutModuleV4';
import { defaultMetrics } from './config/metrics';

export default class RadarScoutPlugin implements Plugin {
  readonly id = 'radar-scout';
  readonly name = 'Radar Scout';
  readonly version = '1.0.0';
  readonly icon = '🎯';

  private module: RadarScoutModule | null = null;

  mount(core: CoreAPI): void {
    // FR31: Enregistre les métriques du module
    for (const metric of defaultMetrics) {
      core.registerMetric(metric);
    }

    // Instancie le module avec accès au core
    this.module = new RadarScoutModule(core);
    this.module.render();

    // Émet événement
    core.emit('module:mounted', { id: this.id });
  }

  unmount(): void {
    this.module?.destroy();
    this.module = null;
  }

  canActivate(state: AppState): boolean {
    // Nécessite des données joueurs
    return state.players.length > 0;
  }
}
