/**
 * @fileoverview RadarModuleAdapter - Pont entre V4 et BMAD
 * 
 * Adapte le monolithe RadarScoutModuleV4 pour l'interface BMADModule.
 * C'est le "Strangler" qui permet la coexistence des deux systemes.
 * 
 * @example
 * // Enregistrer l'adapter dans le Router
 * const adapter = new RadarModuleAdapter(coreAPI);
 * Router.register('solo', adapter);
 * Router.useLegacy('solo', () => legacyModule.render());
 * 
 * // Le Router choisira automatiquement selon le feature flag
 */

import { RadarScoutModule } from './RadarScoutModuleV4';
import type { CoreAPI } from '../../core/types';
import type { BMADModule, RenderContext } from '../../core/types/bmad';
import Store from '../../core/Store';

/**
 * Adapte RadarScoutModuleV4 pour l'architecture BMAD
 * Implemente l'interface BMADModule
 */
export class RadarModuleAdapter implements BMADModule {
  readonly id = 'radar-v4-adapter';
  
  private core: CoreAPI;
  private legacyModule: RadarScoutModule;
  private container: HTMLElement | null = null;
  private isInitialized = false;
  
  constructor(core: CoreAPI) {
    this.core = core;
    this.legacyModule = new RadarScoutModule(core);
  }
  
  /**
   * Initialise l'adapter
   * Synchronise le Store BMAD avec l'etat V4
   */
  init(): void {
    if (this.isInitialized) return;
    
    console.log('[RadarAdapter] Initializing V4 adapter');
    
    // Synchroniser le Store avec les valeurs initiales de V4
    this.syncStoreWithV4();
    
    // Ecouter les changements de Store pour mettre à jour V4
    this.subscribeToStore();
    
    this.isInitialized = true;
  }
  
  /**
   * Rend le module dans un container
   * C'est le point d'entree appelé par le Router
   */
  render(container: HTMLElement): void {
    console.log('[RadarAdapter] Rendering V4 through adapter');
    
    this.container = container;
    
    // Vider le container
    container.innerHTML = '';
    
    // Rendre le module V4
    this.legacyModule.render();
    
    // Deplacer le DOM de V4 dans notre container
    const v4Container = (this.legacyModule as any).container;
    if (v4Container) {
      container.appendChild(v4Container);
    }
    
    // Synchroniser l'etat initial
    this.applyStoreToV4();
  }
  
  /**
   * Met à jour le module avec un nouveau contexte
   * Appele par le Router lors des changements de state
   */
  update(context: RenderContext): void {
    console.log('[RadarAdapter] Updating V4 with context:', context.mode);
    
    // Synchroniser le Store avec le contexte
    Store.setMultipleState({
      currentView: context.mode,
      selectedPlayerId: context.selectedPlayerId,
      comparedPlayerId: context.comparedPlayerId,
      currentRole: context.currentRole,
      selectedMetrics: context.selectedMetrics,
      centileViewMode: context.centileViewMode,
      players: context.players,
    });
    
    // Appliquer les changements à V4
    this.applyStoreToV4();
  }
  
  /**
   * Detruit le module et nettoie
   */
  destroy(): void {
    console.log('[RadarAdapter] Destroying V4 adapter');
    
    // Nettoyer les listeners
    // (Le Store garde ses propres listeners, ils seront nettoyes par le Router)
    
    // Detruire le module V4
    // Note: V4 n'a pas de methode destroy, on nettoie juste le DOM
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    this.container = null;
    this.isInitialized = false;
  }
  
  // ============================================================================
  // Private Methods - Synchronization
  // ============================================================================
  
  /**
   * Synchronise le Store avec l'etat initial de V4
   */
  private syncStoreWithV4(): void {
    const v4State = this.extractV4State();
    
    Store.setMultipleState({
      currentView: v4State.currentMode,
      currentRole: v4State.currentRole,
      selectedPlayerId: v4State.selectedPlayerId,
      comparedPlayerId: v4State.comparedPlayerId,
      selectedMetrics: v4State.selectedMetrics,
      centileViewMode: v4State.centileViewMode,
    });
  }
  
  /**
   * Extrait l'etat de V4
   */
  private extractV4State(): {
    currentMode: 'solo' | 'compare' | 'benchmark';
    currentRole: string;
    selectedPlayerId: string | null;
    comparedPlayerId: string | null;
    selectedMetrics: string[];
    centileViewMode: 'percentiles' | 'values';
  } {
    const v4 = this.legacyModule as any;
    
    return {
      currentMode: v4.currentMode || 'solo',
      currentRole: v4.currentRole || 'MID',
      selectedPlayerId: v4.selectedPlayerId || null,
      comparedPlayerId: v4.comparedPlayerId || null,
      selectedMetrics: v4.selectedMetrics || ['kda', 'kp', 'cspm', 'dpm', 'visionScore'],
      centileViewMode: v4.centileViewMode || 'percentiles',
    };
  }
  
  /**
   * S'abonne aux changements de Store
   */
  private subscribeToStore(): void {
    // Ecouter les changements qui doivent etre reflétés dans V4
    const keysToSync: Array<keyof ReturnType<typeof this.extractV4State>> = [
      'currentView',
      'currentRole',
      'selectedPlayerId',
      'comparedPlayerId',
      'selectedMetrics',
      'centileViewMode',
    ];
    
    Store.subscribeAll((state, changedKey) => {
      if (keysToSync.includes(changedKey as any)) {
        this.applyStoreToV4();
      }
    });
  }
  
  /**
   * Applique l'etat du Store à V4
   */
  private applyStoreToV4(): void {
    const v4 = this.legacyModule as any;
    const storeState = Store.getAllState();
    
    // Synchroniser chaque propriété
    if (storeState.currentView !== v4.currentMode) {
      v4.currentMode = storeState.currentView;
      this.triggerV4Update('mode');
    }
    
    if (storeState.currentRole !== v4.currentRole) {
      v4.currentRole = storeState.currentRole;
      this.triggerV4Update('role');
    }
    
    if (storeState.selectedPlayerId !== v4.selectedPlayerId) {
      v4.selectedPlayerId = storeState.selectedPlayerId;
      this.triggerV4Update('player');
    }
    
    if (storeState.comparedPlayerId !== v4.comparedPlayerId) {
      v4.comparedPlayerId = storeState.comparedPlayerId;
      this.triggerV4Update('compare');
    }
    
    // Mettre à jour la vue V4
    if (typeof v4.updateView === 'function') {
      v4.updateView();
    }
  }
  
  /**
   * Déclenche les mises à jour V4
   */
  private triggerV4Update(type: string): void {
    const v4 = this.legacyModule as any;
    
    switch (type) {
      case 'mode':
        if (typeof v4.updateView === 'function') {
          v4.updateView();
        }
        break;
        
      case 'role':
        if (typeof v4.updatePlayerSelects === 'function') {
          v4.updatePlayerSelects();
        }
        if (typeof v4.updateLeaderboard === 'function') {
          v4.updateLeaderboard();
        }
        break;
        
      case 'player':
        if (typeof v4.updateView === 'function') {
          v4.updateView();
        }
        if (typeof v4.updateCentilesPanel === 'function') {
          v4.updateCentilesPanel();
        }
        break;
        
      case 'compare':
        if (typeof v4.updateView === 'function') {
          v4.updateView();
        }
        break;
    }
  }
  
  // ============================================================================
  // Public API pour tests et debug
  // ============================================================================
  
  /**
   * Retourne le module V4 sous-jacent (pour debug)
   */
  getLegacyModule(): RadarScoutModule {
    return this.legacyModule;
  }
  
  /**
   * Force une synchronisation complete
   */
  forceSync(): void {
    this.syncStoreWithV4();
    this.applyStoreToV4();
  }
}

export default RadarModuleAdapter;
