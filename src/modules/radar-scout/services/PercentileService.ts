/**
 * @fileoverview PercentileService - Calcul des percentiles
 * 
 * Service pur extrait de RadarScoutModuleV4 (lignes 1088-1112)
 * Gère le calcul des percentiles avec support des métriques inversées
 * 
 * @example
 * const service = new PercentileService();
 * const percentile = service.calculate(4.5, 'kda', players, false);
 * // Retourne: 75 (le joueur est meilleur que 75% des joueurs)
 */

import type { Player } from '../../../core/types';
import type { IPercentileService } from '../../../core/types/bmad';

/**
 * Service de calcul des percentiles
 * Implémente l'algorithme de percentile avec inversion support
 */
export class PercentileService implements IPercentileService {
  
  /**
   * Calcule le percentile d'une valeur par rapport à un ensemble
   * 
   * Algorithme: (nombre de valeurs < valeur) / (nombre total) * 100
   * Pour les métriques inversées (lower-is-better): 100 - percentile
   * 
   * @param value - Valeur à évaluer
   * @param metricId - ID de la métrique (pour logs/debug)
   * @param rolePlayers - Joueurs du même rôle à comparer
   * @param isInverted - true si lower-is-better (ex: deaths, ctr%)
   * @returns Percentile entre 0 et 100
   */
  calculatePercentile(
    value: number,
    metricId: string,
    rolePlayers: Player[],
    isInverted: boolean = false
  ): number {
    // Cas edge: pas de joueurs
    if (rolePlayers.length === 0) {
      return 50;
    }
    
    // Extraire toutes les valeurs de la métrique
    const allValues = rolePlayers
      .map(p => p.stats[metricId])
      .filter((v): v is number => v !== undefined && !isNaN(v));
    
    // Cas edge: pas de valeurs valides
    if (allValues.length === 0) {
      return 50;
    }
    
    // Cas edge: un seul joueur
    if (allValues.length === 1) {
      return 50;
    }
    
    // Compter combien de valeurs sont strictement inférieures
    const below = allValues.filter(v => v < value).length;
    const N = allValues.length;
    
    // Calculer le percentile
    let percentile = (below / N) * 100;
    
    // Inverser si nécessaire (pour les métriques où moins = mieux)
    if (isInverted) {
      percentile = 100 - percentile;
    }
    
    // Clamp entre 0 et 100
    return Math.max(0, Math.min(100, percentile));
  }
  
  /**
   * Calcule les percentiles pour plusieurs métriques d'un joueur
   * 
   * @param player - Joueur à évaluer
   * @param metrics - Liste des métriques à calculer
   * @param allPlayers - Tous les joueurs pour comparaison
   * @returns Map métrique -> percentile
   */
  calculatePercentiles(
    player: Player,
    metrics: string[],
    allPlayers: Player[]
  ): Map<string, number> {
    const percentiles = new Map<string, number>();
    
    // Filtrer les joueurs du même rôle
    const rolePlayers = allPlayers.filter(p => p.role === player.role);
    
    for (const metric of metrics) {
      const value = player.stats[metric];
      
      // Si le joueur n'a pas cette métrique, percentile = 50 (médiane)
      if (value === undefined || isNaN(value)) {
        percentiles.set(metric, 50);
        continue;
      }
      
      // Déterminer si la métrique est inversée
      const isInverted = this.isInvertedMetric(metric);
      
      // Calculer le percentile
      const percentile = this.calculatePercentile(
        value,
        metric,
        rolePlayers,
        isInverted
      );
      
      percentiles.set(metric, percentile);
    }
    
    return percentiles;
  }
  
  /**
   * Calcule le percentile moyen pour un ensemble de métriques
   * Utilisé pour le scoring global d'un joueur
   * 
   * @param percentiles - Map des percentiles calculés
   * @returns Percentile moyen
   */
  calculateAveragePercentile(percentiles: Map<string, number>): number {
    if (percentiles.size === 0) {
      return 50;
    }
    
    const values = Array.from(percentiles.values());
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    return sum / values.length;
  }
  
  /**
   * Détermine si une métrique est inversée (lower-is-better)
   * 
   * @param metricId - ID de la métrique
   * @returns true si lower-is-better
   */
  isInvertedMetric(metricId: string): boolean {
    const invertedMetrics = [
      'dth',           // Deaths
      'dth%',          // Death share
      'fbvictim',      // First blood victim
      'ctr%',          // Counter pick rate
    ];
    
    return invertedMetrics.includes(metricId.toLowerCase());
  }
  
  /**
   * Calcule la distribution des percentiles pour un groupe de joueurs
   * Utile pour les statistiques et visualisations
   * 
   * @param players - Joueurs à analyser
   * @param metric - Métrique à évaluer
   * @returns Statistiques de distribution
   */
  calculateDistribution(
    players: Player[],
    metric: string
  ): {
    min: number;
    max: number;
    median: number;
    mean: number;
    stdDev: number;
  } {
    if (players.length === 0) {
      return { min: 0, max: 100, median: 50, mean: 50, stdDev: 0 };
    }
    
    const percentiles = players.map(p => {
      const value = p.stats[metric];
      if (value === undefined || isNaN(value)) return 50;
      
      return this.calculatePercentile(
        value,
        metric,
        players,
        this.isInvertedMetric(metric)
      );
    });
    
    const sorted = [...percentiles].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    const mean = percentiles.reduce((a, b) => a + b, 0) / percentiles.length;
    
    // Écart-type
    const variance = percentiles.reduce((acc, val) => {
      return acc + Math.pow(val - mean, 2);
    }, 0) / percentiles.length;
    const stdDev = Math.sqrt(variance);
    
    return { min, max, median, mean, stdDev };
  }
}

// Export singleton
export const percentileService = new PercentileService();
export default PercentileService;
