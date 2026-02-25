/**
 * @fileoverview NormalizationService - Service de normalisation des valeurs métriques
 * 
 * Ce service gère la normalisation des valeurs brutes vers une échelle 0-100,
 * le calcul des percentiles et l'attribution des grades (S/A/B/C).
 * 
 * @module NormalizationService
 * @version 1.0.0
 * @author KONOHA Team
 */

import type { MetricConfig, LoLRole, Player, Grade } from './types';
import { GRADE_THRESHOLDS } from './types';

/** Résultat d'une normalisation complète */
export interface NormalizedValue {
  /** Valeur brute originale */
  raw: number;
  /** Valeur normalisée sur échelle 0-100 */
  normalized: number;
  /** Percentile dans la distribution (0-100) */
  percentile: number;
  /** Grade attribué (S/A/B/C) */
  grade: Grade;
}

/** Plage de valeurs pour une métrique */
export interface MetricRange {
  /** Valeur minimale */
  min: number;
  /** Valeur maximale */
  max: number;
}

export class NormalizationService {
  private metricRanges: Record<string, MetricRange> = {};
  private centiles: Record<string, number[]> = {};

  /**
   * Définit les plages de valeurs pour les métriques
   * @param ranges - Object mapping metricId -> {min, max}
   */
  setMetricRanges(ranges: Record<string, MetricRange>): void {
    this.metricRanges = ranges;
  }

  /**
   * Définit les distributions de centiles
   * @param centiles - Object mapping metricId -> tableau de valeurs triées
   */
  setCentiles(centiles: Record<string, number[]>): void {
    this.centiles = centiles;
  }

  /**
   * Normalise une valeur selon la configuration métrique
   * 
   * @param value - Valeur brute à normaliser
   * @param metric - Configuration de la métrique
   * @param role - Rôle optionnel pour plages spécifiques
   * @returns Valeur normalisée entre 0 et 100
   * 
   * @example
   * ```typescript
   * const normalized = service.normalize(5.2, kdaMetric, 'MID');
   * // Returns: 52 (sur échelle 0-100)
   * ```
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
   * Calcule le centile d'une valeur dans la distribution
   * 
   * @param value - Valeur à évaluer
   * @param metricId - Identifiant de la métrique
   * @returns Percentile (0-100), 50 par défaut si pas de données
   */
  calculatePercentile(value: number, metricId: string): number {
    const distribution = this.centiles[metricId];
    if (!distribution || distribution.length === 0) return 50;

    // Nombre de valeurs inférieures
    const below = distribution.filter(v => v < value).length;
    return (below / distribution.length) * 100;
  }

  /**
   * Détermine le grade selon le percentile (4 tiers)
   * 
   * @param percentile - Percentile (0-100)
   * @returns Grade S (90-100), A (80-89), B (60-79), C (<60)
   */
  getGrade(percentile: number): Grade {
    if (percentile >= GRADE_THRESHOLDS.S) return 'S';
    if (percentile >= GRADE_THRESHOLDS.A) return 'A';
    if (percentile >= GRADE_THRESHOLDS.B) return 'B';
    return 'C';
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
