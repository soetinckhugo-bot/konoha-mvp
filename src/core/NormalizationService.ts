/**
 * NormalizationService - Normalisation des valeurs 0-100
 * Story 2.5
 */

import type { MetricConfig, LoLRole, Player } from './types';
import { GRADE_THRESHOLDS } from './types';

export interface NormalizedValue {
  raw: number;
  normalized: number;  // 0-100
  percentile: number;  // 0-100
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface MetricRange {
  min: number;
  max: number;
}

export class NormalizationService {
  private metricRanges: Record<string, MetricRange> = {};
  private centiles: Record<string, number[]> = {};

  setMetricRanges(ranges: Record<string, MetricRange>): void {
    this.metricRanges = ranges;
  }

  setCentiles(centiles: Record<string, number[]>): void {
    this.centiles = centiles;
  }

  /**
   * Normalise une valeur selon la config métrique
   */
  normalize(
    value: number,
    metric: MetricConfig,
    role?: LoLRole
  ): number {
    // Récupérer plages (role-specific ou global)
    const range = metric.normalize.roleSpecific && role
      ? this.getRoleSpecificRange(metric.id, role)
      : { min: metric.normalize.min, max: metric.normalize.max };

    // Normalisation linéaire
    let normalized = ((value - range.min) / (range.max - range.min)) * 100;

    // Inversion si nécessaire
    if (metric.direction === 'lower-is-better') {
      normalized = 100 - normalized;
    }

    // Clamp entre 0 et 100
    return Math.max(0, Math.min(100, normalized));
  }

  /**
   * Calcule le centile d'une valeur
   */
  calculatePercentile(value: number, metricId: string): number {
    const distribution = this.centiles[metricId];
    if (!distribution || distribution.length === 0) return 50;

    // Nombre de valeurs inférieures
    const below = distribution.filter(v => v < value).length;
    return (below / distribution.length) * 100;
  }

  /**
   * Détermine le grade selon le centile
   */
  getGrade(percentile: number): 'S' | 'A' | 'B' | 'C' | 'D' {
    if (percentile >= GRADE_THRESHOLDS.S) return 'S';
    if (percentile >= GRADE_THRESHOLDS.A) return 'A';
    if (percentile >= GRADE_THRESHOLDS.B) return 'B';
    if (percentile >= GRADE_THRESHOLDS.C) return 'C';
    return 'D';
  }

  /**
   * Normalise complètement une valeur (pour affichage)
   */
  normalizeComplete(
    value: number,
    metric: MetricConfig,
    role?: LoLRole
  ): NormalizedValue {
    const normalized = this.normalize(value, metric, role);
    const percentile = this.calculatePercentile(value, metric.id);
    const grade = this.getGrade(percentile);

    return {
      raw: value,
      normalized,
      percentile,
      grade
    };
  }

  private getRoleSpecificRange(metricId: string, role: LoLRole): MetricRange {
    // Récupérer depuis state.metricRanges (injecté via setMetricRanges)
    const key = `${role}_${metricId}`;
    return this.metricRanges[key] || { min: 0, max: 100 };
  }

  /**
   * Calcule les plages min/max pour toutes les métriques
   */
  calculateRanges(players: Player[]): Record<string, MetricRange> {
    const ranges: Record<string, MetricRange> = {};
    
    if (players.length === 0) return ranges;

    // Extraire toutes les métriques
    const allMetrics = new Set<string>();
    players.forEach(p => {
      Object.keys(p.stats).forEach(key => allMetrics.add(key));
    });

    // Calculer plages
    allMetrics.forEach(metricId => {
      const values = players
        .map(p => p.stats[metricId])
        .filter((v): v is number => v !== undefined);

      if (values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        // Éviter min === max
        if (min === max) {
          ranges[metricId] = { min: min - 1, max: max + 1 };
        } else {
          ranges[metricId] = { min, max };
        }
      }
    });

    return ranges;
  }

  /**
   * Calcule les centiles pour toutes les métriques
   */
  calculateCentiles(players: Player[]): Record<string, number[]> {
    const centiles: Record<string, number[]> = {};
    
    if (players.length === 0) return centiles;

    const allMetrics = new Set<string>();
    players.forEach(p => {
      Object.keys(p.stats).forEach(key => allMetrics.add(key));
    });

    allMetrics.forEach(metricId => {
      centiles[metricId] = players
        .map(p => p.stats[metricId])
        .filter((v): v is number => v !== undefined)
        .sort((a, b) => a - b);
    });

    return centiles;
  }
}
