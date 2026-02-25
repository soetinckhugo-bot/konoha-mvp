/**
 * StorageService - Persistance localStorage
 * Story 2.6
 */

import type { Player } from './types';

const STORAGE_KEYS = {
  PLAYERS: 'konoha_players',
  METRIC_RANGES: 'konoha_metric_ranges',
  STATE: 'konoha_state',
  METRICS: 'konoha_metrics',
  LAST_IMPORT: 'konoha_last_import'
} as const;

export interface RoleMetricRanges {
  global: Record<string, { min: number; max: number }>;
  byRole: Record<string, Record<string, { min: number; max: number }>>;
}

export class StorageService {
  /**
   * Sauvegarde des données
   */
  set<T>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (err) {
      console.error(`Failed to save to localStorage [${key}]:`, err);
      
      // Gérer quota exceeded
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }
    }
  }

  /**
   * Charge des données
   */
  get<T>(key: string): T | null {
    try {
      const serialized = localStorage.getItem(key);
      if (!serialized) return null;
      return JSON.parse(serialized) as T;
    } catch (err) {
      console.error(`Failed to load from localStorage [${key}]:`, err);
      return null;
    }
  }

  /**
   * Supprime des données
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Efface toutes les données KONOHA
   */
  clear(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Vérifie si des données existent
   */
  hasData(): boolean {
    return localStorage.getItem(STORAGE_KEYS.PLAYERS) !== null;
  }

  /**
   * Retourne la taille utilisée (approximative)
   */
  getUsage(): number {
    let total = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) total += item.length * 2;  // UTF-16 = 2 bytes/char
    });
    return total;
  }

  private handleQuotaExceeded(): void {
    console.warn('Storage quota exceeded, clearing old data');
    this.clear();
    alert('Stockage local plein. Les données ont été effacées. Veuillez réimporter votre CSV.');
  }

  // Méthodes spécifiques
  savePlayers(players: Player[]): void {
    this.set(STORAGE_KEYS.PLAYERS, players);
    this.set(STORAGE_KEYS.LAST_IMPORT, Date.now());
  }

  loadPlayers(): Player[] | null {
    return this.get<Player[]>(STORAGE_KEYS.PLAYERS);
  }

  saveMetricRanges(ranges: RoleMetricRanges): void {
    this.set(STORAGE_KEYS.METRIC_RANGES, ranges);
  }

  loadMetricRanges(): RoleMetricRanges | null {
    return this.get<RoleMetricRanges>(STORAGE_KEYS.METRIC_RANGES);
  }
}
