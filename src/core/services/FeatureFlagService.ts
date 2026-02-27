/**
 * @fileoverview Feature Flag Service - BMAD Phase 1
 * Gestion des feature flags avec localStorage + query params override
 * 
 * @example
 * // Usage basique
 * if (FeatureFlagService.isEnabled('compareMode')) {
 *   showCompareButton();
 * }
 * 
 * // URL override: ?ff_compareMode=false désactive temporairement
 * // localStorage: persistance des préférences utilisateur
 */

export interface FeatureFlags {
  // Modes d'analyse
  soloMode: boolean;
  compareMode: boolean;
  benchmarkMode: boolean;
  
  // Features UI
  centilesPanel: boolean;
  leaderboard: boolean;
  exportPNG: boolean;
  overlayChart: boolean;
  
  // Features expérimentales
  teamMode: boolean;      // 5v5 team comparison
  quadMode: boolean;      // 1v1v1v1
  duelMode: boolean;      // Mode VS full screen
}

export type FeatureFlagKey = keyof FeatureFlags;

const DEFAULT_FLAGS: FeatureFlags = {
  soloMode: true,
  compareMode: true,
  benchmarkMode: true,
  centilesPanel: true,
  leaderboard: true,
  exportPNG: true,
  overlayChart: true,
  teamMode: false,    // Experimental - désactivé par défaut
  quadMode: false,    // Experimental - désactivé par défaut
  duelMode: false,    // Experimental - désactivé par défaut
};

const STORAGE_KEY = 'hugoscout_feature_flags';
const URL_PARAM_PREFIX = 'ff_';

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: FeatureFlags;
  private urlParams: URLSearchParams;
  
  private constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
    this.flags = this.loadFlags();
  }
  
  /**
   * Singleton - une seule instance globale
   */
  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }
  
  /**
   * Charge les flags depuis localStorage + URL params
   */
  private loadFlags(): FeatureFlags {
    // 1. Commencer avec les defaults
    let flags = { ...DEFAULT_FLAGS };
    
    // 2. Override avec localStorage (persistance utilisateur)
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const storedFlags = JSON.parse(stored);
        flags = { ...flags, ...storedFlags };
      }
    } catch (e) {
      console.warn('[FeatureFlag] Failed to load from localStorage:', e);
    }
    
    // 3. Override avec URL params (priorité maximale)
    Object.keys(flags).forEach((key) => {
      const paramKey = URL_PARAM_PREFIX + key;
      const paramValue = this.urlParams.get(paramKey);
      
      if (paramValue !== null) {
        (flags as any)[key] = paramValue === 'true' || paramValue === '1';
      }
    });
    
    return flags;
  }
  
  /**
   * Sauvegarde dans localStorage
   */
  private saveFlags(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.flags));
    } catch (e) {
      console.warn('[FeatureFlag] Failed to save to localStorage:', e);
    }
  }
  
  /**
   * Vérifie si un flag est activé
   */
  public static isEnabled(key: FeatureFlagKey): boolean {
    return FeatureFlagService.getInstance().flags[key];
  }
  
  /**
   * Active un flag
   */
  public static enable(key: FeatureFlagKey): void {
    const instance = FeatureFlagService.getInstance();
    instance.flags[key] = true;
    instance.saveFlags();
    instance.notifyChange(key, true);
  }
  
  /**
   * Désactive un flag
   */
  public static disable(key: FeatureFlagKey): void {
    const instance = FeatureFlagService.getInstance();
    instance.flags[key] = false;
    instance.saveFlags();
    instance.notifyChange(key, false);
  }
  
  /**
   * Toggle un flag
   */
  public static toggle(key: FeatureFlagKey): boolean {
    const instance = FeatureFlagService.getInstance();
    const newValue = !instance.flags[key];
    instance.flags[key] = newValue;
    instance.saveFlags();
    instance.notifyChange(key, newValue);
    return newValue;
  }
  
  /**
   * Réinitialise un flag à sa valeur par défaut
   */
  public static reset(key: FeatureFlagKey): void {
    const instance = FeatureFlagService.getInstance();
    const defaultValue = DEFAULT_FLAGS[key];
    instance.flags[key] = defaultValue;
    instance.saveFlags();
    instance.notifyChange(key, defaultValue);
  }
  
  /**
   * Réinitialise tous les flags
   */
  public static resetAll(): void {
    const instance = FeatureFlagService.getInstance();
    instance.flags = { ...DEFAULT_FLAGS };
    instance.saveFlags();
    console.log('[FeatureFlag] All flags reset to defaults');
  }
  
  /**
   * Récupère tous les flags actuels
   */
  public static getAll(): FeatureFlags {
    return { ...FeatureFlagService.getInstance().flags };
  }
  
  /**
   * Récupère les valeurs par défaut
   */
  public static getDefaults(): FeatureFlags {
    return { ...DEFAULT_FLAGS };
  }
  
  /**
   * Vérifie si un flag a été overridé par URL
   */
  public static isOverriddenByURL(key: FeatureFlagKey): boolean {
    const instance = FeatureFlagService.getInstance();
    const paramKey = URL_PARAM_PREFIX + key;
    return instance.urlParams.has(paramKey);
  }
  
  // ============================================================================
  // Event System - Notifications de changement
  // ============================================================================
  
  private listeners: Set<(key: FeatureFlagKey, value: boolean) => void> = new Set();
  
  private notifyChange(key: FeatureFlagKey, value: boolean): void {
    console.log(`[FeatureFlag] ${key} = ${value}`);
    this.listeners.forEach(listener => listener(key, value));
  }
  
  /**
   * S'abonne aux changements de flags
   * @returns Fonction de désabonnement
   */
  public static onChange(
    callback: (key: FeatureFlagKey, value: boolean) => void
  ): () => void {
    const instance = FeatureFlagService.getInstance();
    instance.listeners.add(callback);
    
    // Retourne la fonction de cleanup
    return () => {
      instance.listeners.delete(callback);
    };
  }
  
  // ============================================================================
  // Helpers pour les modes spécifiques
  // ============================================================================
  
  /**
   * Vérifie si au moins un mode d'analyse est activé
   */
  public static hasAnyAnalysisMode(): boolean {
    return (
      FeatureFlagService.isEnabled('soloMode') ||
      FeatureFlagService.isEnabled('compareMode') ||
      FeatureFlagService.isEnabled('benchmarkMode')
    );
  }
  
  /**
   * Retourne la liste des modes actifs
   */
  public static getActiveModes(): string[] {
    const modes: string[] = [];
    if (FeatureFlagService.isEnabled('soloMode')) modes.push('solo');
    if (FeatureFlagService.isEnabled('compareMode')) modes.push('compare');
    if (FeatureFlagService.isEnabled('benchmarkMode')) modes.push('benchmark');
    return modes;
  }
  
  /**
   * Mode fallback si tous les modes sont désactivés
   */
  public static getFallbackMode(): 'solo' | 'compare' | 'benchmark' {
    if (FeatureFlagService.isEnabled('soloMode')) return 'solo';
    if (FeatureFlagService.isEnabled('compareMode')) return 'compare';
    return 'benchmark';
  }
}

// Export singleton pour import direct
export const featureFlags = FeatureFlagService;
