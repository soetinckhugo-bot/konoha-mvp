/**
 * @fileoverview Store - State Management Centralise
 * Remplace les 12 variables privees de RadarScoutModuleV4
 * 
 * Pattern: Observable Store avec Selectors
 * @example
 * // S'abonner aux changements
 * const unsubscribe = Store.subscribe('selectedPlayerId', (value) => {
 *   console.log('Joueur change:', value);
 * });
 * 
 * // Modifier le state
 * Store.setState('selectedPlayerId', 'player-123');
 * 
 * // Selectionner avec memoization
 * const selectedPlayer = Store.select(getSelectedPlayer);
 */

import type { AppState, StateKey, StateListener, Selector } from './types/bmad';
import type { Player } from './types';

// ============================================================================
// Default State
// ============================================================================

const DEFAULT_STATE: AppState = {
  currentView: 'solo',
  selectedPlayerId: null,
  comparedPlayerId: null,
  currentRole: 'MID',
  selectedMetrics: ['kda', 'kp', 'cspm', 'dpm', 'visionScore'],
  centileViewMode: 'percentiles',
  players: [],
  isLoading: false,
  error: null,
  expandedPanels: new Set(),
};

// ============================================================================
// Store Class
// ============================================================================

export class Store {
  private static instance: Store;
  private state: AppState;
  private listeners: Map<StateKey, Set<StateListener>>;
  private globalListeners: Set<StateListener>;
  
  private constructor() {
    this.state = { ...DEFAULT_STATE };
    this.listeners = new Map();
    this.globalListeners = new Set();
    
    // Initialize listener sets for each key
    Object.keys(DEFAULT_STATE).forEach((key) => {
      this.listeners.set(key as StateKey, new Set());
    });
  }
  
  /**
   * Singleton - une seule instance globale
   */
  public static getInstance(): Store {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }
  
  /**
   * Recupere la valeur d'une cle
   */
  public static getState<K extends StateKey>(key: K): AppState[K] {
    return Store.getInstance().state[key];
  }
  
  /**
   * Recupere tout le state (utiliser avec parcimonie)
   */
  public static getAllState(): Readonly<AppState> {
    return Object.freeze({ ...Store.getInstance().state });
  }
  
  /**
   * Modifie une valeur et notifie les listeners
   */
  public static setState<K extends StateKey>(key: K, value: AppState[K]): void {
    const instance = Store.getInstance();
    const oldValue = instance.state[key];
    
    // Ne pas notifier si la valeur n'a pas change
    if (oldValue === value) return;
    
    instance.state[key] = value;
    instance.notify(key);
  }
  
  /**
   * Modifie plusieurs valeurs en une seule transaction
   */
  public static setMultipleState(updates: Partial<AppState>): void {
    const instance = Store.getInstance();
    const changedKeys: StateKey[] = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      const stateKey = key as StateKey;
      if (instance.state[stateKey] !== value) {
        instance.state[stateKey] = value as any;
        changedKeys.push(stateKey);
      }
    });
    
    // Notifier pour chaque cle changee
    changedKeys.forEach(key => instance.notify(key));
  }
  
  /**
   * S'abonne aux changements d'une cle specifique
   * @returns Fonction de desabonnement
   */
  public static subscribe<K extends StateKey>(
    key: K,
    listener: (value: AppState[K], state: AppState) => void
  ): () => void {
    const instance = Store.getInstance();
    const keyListeners = instance.listeners.get(key);
    
    if (!keyListeners) {
      console.warn(`[Store] Unknown state key: ${key}`);
      return () => {};
    }
    
    // Wrapper pour avoir la signature StateListener
    const wrapper: StateListener = (state, changedKey) => {
      if (changedKey === key) {
        listener(state[key], state);
      }
    };
    
    keyListeners.add(wrapper);
    
    // Retourne la fonction de cleanup
    return () => {
      keyListeners.delete(wrapper);
    };
  }
  
  /**
   * S'abonne a tous les changements de state
   * @returns Fonction de desabonnement
   */
  public static subscribeAll(listener: StateListener): () => void {
    const instance = Store.getInstance();
    instance.globalListeners.add(listener);
    
    return () => {
      instance.globalListeners.delete(listener);
    };
  }
  
  /**
   * Selectionne une valeur derivee du state (avec memoization basique)
   */
  public static select<T>(selector: Selector<T>): T {
    return selector(Store.getInstance().state);
  }
  
  /**
   * Selectionne et s'abonne aux mises a jour
   */
  public static selectAndSubscribe<T>(
    selector: Selector<T>,
    listener: (value: T) => void
  ): () => void {
    // Valeur initiale
    const initialValue = Store.select(selector);
    listener(initialValue);
    
    // S'abonner a tous les changements et re-evaluer le selector
    return Store.subscribeAll((state) => {
      const newValue = selector(state);
      listener(newValue);
    });
  }
  
  /**
   * Reinitialise le state aux valeurs par defaut
   */
  public static reset(): void {
    const instance = Store.getInstance();
    instance.state = { ...DEFAULT_STATE };
    
    // Notifier tous les listeners
    Object.keys(DEFAULT_STATE).forEach((key) => {
      instance.notify(key as StateKey);
    });
  }
  
  /**
   * Reinitialise une cle specifique
   */
  public static resetKey<K extends StateKey>(key: K): void {
    Store.setState(key, DEFAULT_STATE[key]);
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  private notify(changedKey: StateKey): void {
    const state = this.state;
    
    // Notifier les listeners specifiques a cette cle
    const keyListeners = this.listeners.get(changedKey);
    if (keyListeners) {
      keyListeners.forEach(listener => listener(state, changedKey));
    }
    
    // Notifier les listeners globaux
    this.globalListeners.forEach(listener => listener(state, changedKey));
  }
  
  // ============================================================================
  // Helpers pour cas d'usage communs
  // ============================================================================
  
  /**
   * Recupere le joueur selectionne
   */
  public static getSelectedPlayer(): Player | undefined {
    const players = Store.getState('players');
    const selectedId = Store.getState('selectedPlayerId');
    return players.find(p => p.id === selectedId);
  }
  
  /**
   * Recupere le joueur compare
   */
  public static getComparedPlayer(): Player | undefined {
    const players = Store.getState('players');
    const comparedId = Store.getState('comparedPlayerId');
    return players.find(p => p.id === comparedId);
  }
  
  /**
   * Recupere les joueurs filtres par role
   */
  public static getPlayersByRole(role: string): Player[] {
    const players = Store.getState('players');
    if (role === 'ALL') return players;
    return players.filter(p => p.role === role);
  }
  
  /**
   * Active/desactive une metrique
   */
  public static toggleMetric(metricId: string): void {
    const currentMetrics = Store.getState('selectedMetrics');
    const newMetrics = currentMetrics.includes(metricId)
      ? currentMetrics.filter(m => m !== metricId)
      : [...currentMetrics, metricId];
    
    Store.setState('selectedMetrics', newMetrics);
  }
  
  /**
   * Change de mode d'analyse
   */
  public static setMode(mode: AppState['currentView']): void {
    Store.setState('currentView', mode);
  }
  
  /**
   * Selectionne un joueur
   */
  public static selectPlayer(playerId: string | null): void {
    Store.setState('selectedPlayerId', playerId);
  }
  
  /**
   * Compare avec un joueur
   */
  public static compareWith(playerId: string | null): void {
    Store.setState('comparedPlayerId', playerId);
  }
  
  /**
   * Change le role courant
   */
  public static setRole(role: string): void {
    Store.setState('currentRole', role);
  }
  
  /**
   * Toggle un panneau expand/collapse
   */
  public static togglePanel(panelId: string): void {
    const current = Store.getState('expandedPanels');
    const newSet = new Set(current);
    
    if (newSet.has(panelId)) {
      newSet.delete(panelId);
    } else {
      newSet.add(panelId);
    }
    
    Store.setState('expandedPanels', newSet);
  }
}

// Export singleton
export default Store;
