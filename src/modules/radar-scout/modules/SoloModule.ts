/**
 * @fileoverview SoloModule - Premier module BMAD
 * 
 * Module de demonstration pour le nouveau systeme BMAD.
 * Affiche le radar d'un joueur unique.
 * 
 * @example
 * const solo = new SoloModule();
 * solo.init();
 * solo.render(container);
 */

import type { BMADModule, RenderContext } from '../../../core/types/bmad';
import type { CoreAPI } from '../../../core/types';
import Store from '../../../core/Store';
import { PercentileService } from '../services/PercentileService';
import { GradeService } from '../services/GradeService';
import { PlayerFilterService } from '../services/PlayerFilterService';

/**
 * Module BMAD pour le mode Solo
 * Premier module implementant la nouvelle architecture
 */
export class SoloModule implements BMADModule {
  readonly id = 'solo-module-bmad';
  
  private container: HTMLElement | null = null;
  private percentileService: PercentileService;
  private gradeService: GradeService;
  private playerFilterService: PlayerFilterService;
  private unsubscribe: (() => void) | null = null;
  
  constructor(_core?: CoreAPI) {
    this.percentileService = new PercentileService();
    this.gradeService = new GradeService();
    this.playerFilterService = new PlayerFilterService();
  }
  
  /**
   * Initialise le module
   */
  init(): void {
    console.log('[SoloModule] Initialized');
    
    // Subscribe to store changes
    this.unsubscribe = Store.subscribe('selectedPlayerId', () => {
      this.update({} as RenderContext);
    });
  }
  
  /**
   * Rend le module dans un container
   */
  render(container: HTMLElement): void {
    this.container = container;
    
    // Create module structure
    const wrapper = document.createElement('div');
    wrapper.className = 'solo-module-bmad';
    wrapper.innerHTML = `
      <div class="solo-header">
        <h2>Mode Solo - BMAD</h2>
        <p>Analyse individuelle des joueurs</p>
      </div>
      <div class="solo-content">
        <div class="placeholder-radar">
          <p>Radar Chart BMAD</p>
          <p>Utilisez RadarChartModule pour le rendu complet</p>
        </div>
      </div>
    `;
    
    container.appendChild(wrapper);
    
    // Render completed
    console.log('[SoloModule] Rendered successfully');
  }
  
  /**
   * Met à jour le module
   */
  update(_context: RenderContext): void {
    if (!this.container) return;
    
    // Update logic here
    console.log('[SoloModule] Updated');
  }
  
  /**
   * Detruit le module
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    console.log('[SoloModule] Destroyed');
  }
}
