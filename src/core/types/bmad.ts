/**
 * @fileoverview BMAD Architecture Types
 * Core interfaces pour la nouvelle architecture modulaire
 * 
 * BMAD = Brainiac Modular Architecture Design
 * Remplace le monolithe RadarScoutModuleV4 (1225 lignes)
 */

import type { Player } from './index';
export type { Player };

// ============================================================================
// Core Module Interface
// ============================================================================

/**
 * Interface de base pour tous les modules BMAD
 * Chaque module doit implementer cette interface
 */
export interface BMADModule {
  /** Identifiant unique du module */
  readonly id: string;
  
  /** Initialise le module */
  init(): void;
  
  /** Rend le module dans un container */
  render(container: HTMLElement): void;
  
  /** Met a jour le module avec de nouvelles donnees */
  update(context: RenderContext): void;
  
  /** Detruit le module et nettoie les ressources */
  destroy(): void;
}

// ============================================================================
// Render Context
// ============================================================================

/**
 * Contexte de rendu passe a tous les modules
 * Contient l'etat global de l'application
 */
export interface RenderContext {
  /** Mode d'analyse actuel */
  mode: 'solo' | 'compare' | 'benchmark' | 'team';
  
  /** Joueur principal selectionne */
  selectedPlayerId: string | null;
  
  /** Joueur compare (mode compare) */
  comparedPlayerId: string | null;
  
  /** Role filtre (TOP, JUNGLE, MID, ADC, SUPPORT, ALL) */
  currentRole: string;
  
  /** Metriques selectionnees pour le radar */
  selectedMetrics: string[];
  
  /** Mode d'affichage des percentiles */
  centileViewMode: 'percentiles' | 'values';
  
  /** Donnees des joueurs */
  players: Player[];
  
  /** Timestamp de la derniere mise a jour */
  lastUpdate: number;
}

// ============================================================================
// Store & State Management
// ============================================================================

/**
 * Etat global de l'application
 * Remplace les 12 variables privees de RadarScoutModuleV4
 */
export interface AppState {
  // Navigation
  currentView: 'solo' | 'compare' | 'benchmark';
  
  // Selections
  selectedPlayerId: string | null;
  comparedPlayerId: string | null;
  currentRole: string;
  
  // Configuration
  selectedMetrics: string[];
  centileViewMode: 'percentiles' | 'values';
  
  // Donnees
  players: Player[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  expandedPanels: Set<string>;
}

/**
 * Type pour les cles de state (utilise pour les selectors)
 */
export type StateKey = keyof AppState;

/**
 * Fonction de selection (selector)
 */
export type Selector<T> = (state: AppState) => T;

/**
 * Listener de changement de state
 */
export type StateListener = (state: AppState, changedKey: StateKey) => void;

// ============================================================================
// Events
// ============================================================================

/**
 * Types d'evenements BMAD
 */
export type BMADEventType = 
  | 'player:select'
  | 'player:compare'
  | 'role:change'
  | 'metric:toggle'
  | 'mode:change'
  | 'view:toggle'
  | 'flag:change';

/**
 * Payload d'evenement
 */
export interface BMADEvent {
  type: BMADEventType;
  payload: unknown;
  timestamp: number;
  source: string;
}

/**
 * Handler d'evenement
 */
export type BMADEventHandler = (event: BMADEvent) => void;

// ============================================================================
// Services
// ============================================================================

/**
 * Interface du PercentileService
 * Extrait de RadarScoutModuleV4 (lignes 1088-1112)
 */
export interface IPercentileService {
  /**
   * Calcule le percentile d'une valeur dans un ensemble
   * @param value Valeur a evaluer
   * @param metricId ID de la metrique
   * @param rolePlayers Joueurs du meme role
   * @param isInverted true si lower-is-better (ex: deaths)
   * @returns Percentile 0-100
   */
  calculatePercentile(
    value: number,
    metricId: string,
    rolePlayers: Player[],
    isInverted: boolean
  ): number;
  
  /**
   * Calcule les percentiles pour plusieurs metriques
   */
  calculatePercentiles(
    player: Player,
    metrics: string[],
    allPlayers: Player[]
  ): Map<string, number>;
}

/**
 * Interface du GradeService
 * Uniformise GradeCalculator existant
 */
export interface IGradeService {
  /**
   * Retourne le grade S/A/B/C/D pour un percentile
   */
  getGrade(percentile: number): 'S' | 'A' | 'B' | 'C' | 'D';
  
  /**
   * Retourne la couleur associee au grade
   */
  getColor(grade: string): string;
  
  /**
   * Retourne le label (Elite, Excellent, etc.)
   */
  getLabel(grade: string): string;
  
  /**
   * Calcule le grade global d'un joueur
   */
  getPlayerGrade(player: Player, allPlayers: Player[]): 'S' | 'A' | 'B' | 'C' | 'D';
}

/**
 * Interface du PlayerFilterService
 * Extrait de RadarScoutModuleV4
 */
export interface IPlayerFilterService {
  /**
   * Filtre les joueurs par role
   */
  filterByRole(players: Player[], role: string): Player[];
  
  /**
   * Trie les joueurs par score
   */
  sortByScore(players: Player[], metric: string, descending?: boolean): Player[];
  
  /**
   * Recherche par nom
   */
  searchByName(players: Player[], query: string): Player[];
  
  /**
   * Top N joueurs
   */
  getTopPlayers(players: Player[], n: number, metric?: string): Player[];
}

// ============================================================================
// Router
// ============================================================================

/**
 * Interface du Router (Strangler Facade)
 * Route les appels entre ancien et nouveau systeme
 */
export interface IModuleRouter {
  /**
   * Rend le module approprie selon le contexte et les feature flags
   */
  render(context: RenderContext, container: HTMLElement): HTMLElement;
  
  /**
   * Enregistre un module pour un mode
   */
  register(mode: string, module: BMADModule): void;
  
  /**
   * Utilise le systeme legacy pour un mode
   */
  useLegacy(mode: string, legacyRenderer: () => HTMLElement): void;
  
  /**
   * Verifie si le nouveau systeme est actif pour un mode
   */
  isNewSystemActive(mode: string): boolean;
}

// ============================================================================
// Module Configurations
// ============================================================================

/**
 * Configuration d'un module
 */
export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  featureFlag: string;
  dependencies: string[];
}

/**
 * Configuration du systeme
 */
export interface SystemConfig {
  modules: ModuleConfig[];
  defaultMode: string;
  fallbackMode: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type pour les metriques supportees
 */
export type MetricId = 
  | 'kda' | 'kp' | 'cspm' | 'dpm' | 'visionScore'
  | 'gd15' | 'csd15' | 'fb' | 'dth'
  | 'gpm' | 'xpd15' | 'dmg' | 'vs';

/**
 * Type pour les roles
 */
export type Role = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT' | 'ALL';

/**
 * Options de configuration radar
 */
export interface RadarConfig {
  metrics: string[];
  players: Player[];
  showPercentiles: boolean;
  animation: boolean;
  theme: 'dark' | 'light';
}
