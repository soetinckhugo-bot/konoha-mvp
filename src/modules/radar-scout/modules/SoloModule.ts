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
import { FeatureFlagService } from '../../../core/services/FeatureFlagService';
// RadarChart import removed - using RadarChartModule instead
import { RadarDataService } from '../services/RadarDataService';
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
  private radarChart: RadarChart | null = null;
  private dataService: RadarDataService;
  private percentileService: PercentileService;
  private gradeService: GradeService;
  private playerFilterService: PlayerFilterService;
  private core: CoreAPI | null = null;
  private unsubscribe: (() => void) | null = null;
  
  constructor(core?: CoreAPI) {
    this.dataService = new RadarDataService();
    this.percentileService = new PercentileService();
    this.gradeService = new GradeService();
    this.playerFilterService = new PlayerFilterService();
    if (core) this.core = core;
  }
  
  /**
   * Initialise le module
   */
  init(): void {
    console.log('[SoloModule] Initializing BMAD solo module');
    
    // S'abonner aux changements de state pertinents
    this.unsubscribe = Store.subscribeAll((state, changedKey) => {
      if (this.container) {
        this.handleStateChange(changedKey);
      }
    });
  }
  
  /**
   * Rend le module
   */
  render(container: HTMLElement): void {
    console.log('[SoloModule] Rendering BMAD solo view');
    
    this.container = container;
    container.innerHTML = '';
    
    // Creer la structure HTML
    const wrapper = document.createElement('div');
    wrapper.className = 'bmad-solo-module';
    wrapper.innerHTML = `
      <style>
        .bmad-solo-module {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #0a0a0f;
          color: #e0e0e0;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .bmad-solo-header {
          padding: 16px 20px;
          border-bottom: 1px solid #2d2d44;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .bmad-solo-title {
          font-size: 18px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bmad-solo-badge {
          background: #22C55E;
          color: #000;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
        }
        .bmad-solo-content {
          flex: 1;
          display: flex;
          padding: 20px;
          gap: 20px;
        }
        .bmad-solo-left {
          width: 280px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .bmad-solo-card {
          background: #16162a;
          border: 1px solid #2d2d44;
          border-radius: 12px;
          padding: 16px;
        }
        .bmad-solo-card-title {
          font-size: 12px;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        .bmad-solo-player-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .bmad-solo-player-name {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
        }
        .bmad-solo-player-team {
          font-size: 13px;
          color: #666;
        }
        .bmad-solo-grade {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          font-size: 24px;
          font-weight: 700;
          margin-top: 8px;
        }
        .bmad-solo-grade.S { background: #00D9C0; color: #000; }
        .bmad-solo-grade.A { background: #22C55E; color: #000; }
        .bmad-solo-grade.B { background: #FACC15; color: #000; }
        .bmad-solo-grade.C { background: #F59E0B; color: #000; }
        .bmad-solo-grade.D { background: #EF4444; color: #fff; }
        .bmad-solo-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .bmad-solo-radar-container {
          width: 100%;
          max-width: 500px;
          aspect-ratio: 1;
        }
        .bmad-solo-empty {
          text-align: center;
          color: #666;
        }
        .bmad-solo-empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .bmad-solo-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .bmad-solo-metric {
          background: #0f0f1a;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .bmad-solo-metric-value {
          font-weight: 600;
          color: #3FE0D0;
        }
      </style>
      
      <div class="bmad-solo-header">
        <div class="bmad-solo-title">
          <span>Analyse Solo</span>
          <span class="bmad-solo-badge">BMAD</span>
        </div>
      </div>
      
      <div class="bmad-solo-content">
        <div class="bmad-solo-left">
          <div class="bmad-solo-card">
            <div class="bmad-solo-card-title">Joueur Selectionne</div>
            <div id="bmad-solo-player" class="bmad-solo-player-info">
              <div class="bmad-solo-empty">
                <div class="bmad-solo-empty-icon">👤</div>
                <div>Aucun joueur selectionne</div>
              </div>
            </div>
          </div>
          
          <div class="bmad-solo-card">
            <div class="bmad-solo-card-title">Metriques Actives</div>
            <div id="bmad-solo-metrics" class="bmad-solo-metrics"></div>
          </div>
        </div>
        
        <div class="bmad-solo-center">
          <div id="bmad-solo-radar" class="bmad-solo-radar-container"></div>
        </div>
      </div>
    `;
    
    container.appendChild(wrapper);
    
    // Rendu initial
    this.updateView();
  }
  
  /**
   * Met a jour le module avec un contexte
   */
  update(context: RenderContext): void {
    console.log('[SoloModule] Updating with context');
    this.updateView();
  }
  
  /**
   * Detruit le module
   */
  destroy(): void {
    console.log('[SoloModule] Destroying');
    
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    if (this.radarChart) {
      // Cleanup chart.js si necessaire
      this.radarChart = null;
    }
    
    this.container = null;
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  private handleStateChange(changedKey: string): void {
    const keysToReact = [
      'selectedPlayerId',
      'selectedMetrics',
      'currentRole',
      'players',
    ];
    
    if (keysToReact.includes(changedKey)) {
      this.updateView();
    }
  }
  
  private updateView(): void {
    if (!this.container) return;
    
    const player = Store.getSelectedPlayer();
    const metrics = Store.getState('selectedMetrics');
    
    this.updatePlayerInfo(player);
    this.updateMetricsList(metrics);
    this.updateRadar(player, metrics);
  }
  
  private updatePlayerInfo(player: any): void {
    const container = this.container!.querySelector('#bmad-solo-player');
    if (!container) return;
    
    if (!player) {
      container.innerHTML = `
        <div class="bmad-solo-empty">
          <div class="bmad-solo-empty-icon">👤</div>
          <div>Aucun joueur selectionne</div>
        </div>
      `;
      return;
    }
    
    // Calculer le grade avec GradeService
    const players = Store.getState('players');
    const percentile = this.percentileService.calculatePercentile(
      player.stats?.kda || 0,
      'kda',
      this.playerFilterService.filterByRole(players, player.role),
      false
    );
    const grade = this.gradeService.getGrade(percentile);
    const gradeColor = this.gradeService.getColor(grade);
    
    container.innerHTML = `
      <div class="bmad-solo-player-name">${player.name}</div>
      <div class="bmad-solo-player-team">${player.team} • ${player.role}</div>
      <div class="bmad-solo-grade ${grade}" style="background: ${gradeColor}">
        ${grade}
      </div>
    `;
  }
  
  private updateMetricsList(metrics: string[]): void {
    const container = this.container!.querySelector('#bmad-solo-metrics');
    if (!container) return;
    
    if (metrics.length === 0) {
      container.innerHTML = '<div style="color: #666; font-size: 12px;">Aucune metrique selectionnee</div>';
      return;
    }
    
    container.innerHTML = metrics.map(m => `
      <div class="bmad-solo-metric">
        <span>${m.toUpperCase()}</span>
      </div>
    `).join('');
  }
  
  private updateRadar(player: any, metrics: string[]): void {
    const container = this.container!.querySelector('#bmad-solo-radar');
    if (!container) return;
    
    if (!player || metrics.length === 0) {
      container.innerHTML = `
        <div class="bmad-solo-empty" style="height: 100%; display: flex; flex-direction: column; justify-content: center;">
          <div class="bmad-solo-empty-icon">📊</div>
          <div>Selectionnez un joueur pour voir le radar</div>
        </div>
      `;
      return;
    }
    
    // Pour la demo, on affiche un placeholder
    // En production, integrer Chart.js ici
    container.innerHTML = `
      <div style="
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #0f0f1a;
        border-radius: 12px;
        border: 1px dashed #2d2d44;
      ">
        <div style="font-size: 64px; margin-bottom: 16px;">🎯</div>
        <div style="color: #888; font-size: 14px;">
          Radar Chart placeholder
        </div>
        <div style="color: #666; font-size: 12px; margin-top: 8px;">
          ${metrics.length} metriques • ${player.name}
        </div>
      </div>
    `;
  }
}

export default SoloModule;
