/**
 * @fileoverview Integration - Point d'entree BMAD
 * 
 * Configure et initialise le Router avec les modules BMAD et legacy.
 * A appeler au demarrage de l'application.
 * 
 * @example
 * // main.ts ou point d'entree
 * import { initializeBMAD } from './core/integration';
 * import { coreAPI } from './core';
 * 
 * initializeBMAD(coreAPI);
 * 
 * // Utiliser le Router
 * import { Router } from './core/Router';
 * 
 * const container = document.getElementById('app');
 * Router.render({
 *   mode: 'solo',
 *   selectedPlayerId: 'player-1',
 *   // ...
 * }, container);
 */

import type { CoreAPI } from './types';
import { Router } from './Router';
import Store from './Store';
import { FeatureFlagService } from './services/FeatureFlagService';

// Modules
import { RadarModuleAdapter } from '../modules/radar-scout/RadarModuleAdapter';
import { SoloModule } from '../modules/radar-scout/modules/SoloModule';

/**
 * Initialise l'architecture BMAD
 * Enregistre les modules dans le Router
 */
export function initializeBMAD(core: CoreAPI): void {
  console.log('[BMAD] Initializing architecture...');
  
  // ============================================================================
  // 1. Synchroniser les donnees CoreAPI avec le Store
  // ============================================================================
  
  const players = core.getState('players') || [];
  const selectedPlayerId = core.getState('selectedPlayerId');
  
  Store.setMultipleState({
    players,
    selectedPlayerId,
    currentRole: 'MID',
    selectedMetrics: ['kda', 'kp', 'cspm', 'dpm', 'visionScore'],
  });
  
  // Ecouter les changements CoreAPI pour synchroniser Store
  core.subscribe('players', (players) => {
    Store.setState('players', players);
  });
  
  core.subscribe('selectedPlayerId', (id) => {
    Store.setState('selectedPlayerId', id);
  });
  
  // ============================================================================
  // 2. Creer les adapters et modules
  // ============================================================================
  
  // Adapter pour V4 (legacy)
  const v4Adapter = new RadarModuleAdapter(core);
  
  // Nouveau module BMAD (Solo)
  const soloModule = new SoloModule(core);
  
  // ============================================================================
  // 3. Enregistrer dans le Router
  // ============================================================================
  
  // Mode Solo : nouveau systeme BMAD (derriere feature flag)
  Router.register('solo', soloModule);
  
  // Legacy fallback pour Solo (V4)
  Router.useLegacy('solo', () => {
    // Creer une instance temporaire de V4 pour le rendu
    const { RadarScoutModule } = require('../modules/radar-scout/RadarScoutModuleV4');
    const v4Module = new RadarScoutModule(core);
    v4Module.render();
    return (v4Module as any).container;
  });
  
  // Mode Compare : utilise V4 pour l'instant (pas encore migre)
  Router.useLegacy('compare', () => {
    const { RadarScoutModule } = require('../modules/radar-scout/RadarScoutModuleV4');
    const v4Module = new RadarScoutModule(core);
    v4Module.render();
    return (v4Module as any).container;
  });
  
  // Mode Benchmark : utilise V4 pour l'instant
  Router.useLegacy('benchmark', () => {
    const { RadarScoutModule } = require('../modules/radar-scout/RadarScoutModuleV4');
    const v4Module = new RadarScoutModule(core);
    v4Module.render();
    return (v4Module as any).container;
  });
  
  // ============================================================================
  // 4. Configuration initiale des feature flags
  // ============================================================================
  
  // Par defaut, tous les modes utilisent V4 (securite)
  // Pour activer BMAD, utiliser URL: ?ff_soloMode=true
  
  console.log('[BMAD] Architecture initialized');
  console.log('[BMAD] Registered modes:', Router.getRegisteredModes());
  console.log('[BMAD] Feature flags:', FeatureFlagService.getAll());
  
  // Log des modes actifs
  console.log('[BMAD] New system modes:', Router.getNewSystemModes());
  console.log('[BMAD] Legacy modes:', Router.getLegacyModes());
}

/**
 * Rend l'application avec le mode courant du Store
 */
export function renderCurrentMode(container: HTMLElement): void {
  const mode = Store.getState('currentView');
  const context = {
    mode,
    selectedPlayerId: Store.getState('selectedPlayerId'),
    comparedPlayerId: Store.getState('comparedPlayerId'),
    currentRole: Store.getState('currentRole'),
    selectedMetrics: Store.getState('selectedMetrics'),
    centileViewMode: Store.getState('centileViewMode'),
    players: Store.getState('players'),
    lastUpdate: Date.now(),
  };
  
  Router.render(context, container);
}

/**
 * Change de mode et re-rend
 */
export function switchMode(mode: 'solo' | 'compare' | 'benchmark', container: HTMLElement): void {
  Store.setState('currentView', mode);
  renderCurrentMode(container);
}

/**
 * Cleanup BMAD
 */
export function cleanupBMAD(): void {
  console.log('[BMAD] Cleaning up...');
  Router.destroy();
  Store.reset();
}

export default { initializeBMAD, renderCurrentMode, switchMode, cleanupBMAD };
