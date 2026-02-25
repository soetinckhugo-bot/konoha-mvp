/**
 * AppStateManager - State Management avec pattern Observable
 * Story 1.2
 */

import type { AppState } from './types';

type Callback<T> = (newVal: T, oldVal: T) => void;
type Unsubscribe = () => void;

const INITIAL_STATE: AppState = {
  players: [],
  availableMetrics: [],
  selectedMetrics: [],
  currentModule: null,
  currentView: 'solo',
  currentRole: 'all',
  currentTimeframe: 'all',
  selectedPlayerId: null,
  comparedPlayerId: null,
  metricRanges: {},
  centiles: {},
  isLoading: false,
  error: null,
  sidebarOpen: true
};

export class AppStateManager {
  private state: AppState = { ...INITIAL_STATE };
  private subscribers = new Map<keyof AppState, Set<Callback<unknown>>>();

  /**
   * Lit une valeur du state
   */
  getState<K extends keyof AppState>(key: K): AppState[K] {
    return this.state[key];
  }

  /**
   * Écrit une valeur et notifie les abonnés
   */
  setState<K extends keyof AppState>(key: K, value: AppState[K]): void {
    const oldValue = this.state[key];
    if (oldValue === value) return;

    this.state[key] = value;
    this.notify(key, value, oldValue);
  }

  /**
   * S'abonne aux changements d'une clé
   */
  subscribe<K extends keyof AppState>(
    key: K,
    callback: Callback<AppState[K]>
  ): Unsubscribe {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback as Callback<unknown>);

    // Retourne fonction de désabonnement
    return () => {
      this.subscribers.get(key)?.delete(callback as Callback<unknown>);
    };
  }

  private notify<K extends keyof AppState>(
    key: K,
    newVal: AppState[K],
    oldVal: AppState[K]
  ): void {
    const callbacks = this.subscribers.get(key);
    if (!callbacks) return;

    callbacks.forEach(cb => {
      try {
        cb(newVal as unknown, oldVal as unknown);
      } catch (err) {
        console.error(`Error in subscriber for ${key}:`, err);
      }
    });
  }

  /**
   * Persiste le state dans localStorage
   */
  persist(): void {
    try {
      localStorage.setItem('konoha_state', JSON.stringify(this.state));
    } catch (err) {
      console.error('Failed to persist state:', err);
    }
  }

  /**
   * Restaure le state depuis localStorage
   */
  restore(): void {
    try {
      const saved = localStorage.getItem('konoha_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...INITIAL_STATE, ...parsed };
      }
    } catch (err) {
      console.error('Failed to restore state:', err);
    }
  }

  /**
   * Retourne une copie du state complet (pour canActivate)
   */
  getFullState(): AppState {
    return { ...this.state };
  }
}
