/**
 * @fileoverview GradeCalculator - Calcul des grades de performance
 * 
 * Deux systèmes distincts:
 * - STATS TIERS: 5 tiers (S/A/B/C/D) pour les métriques individuelles
 * - PLAYER TIERS: 4 tiers (Elite/Excellent/Good/Weak) pour le score global
 * 
 * @module GradeCalculator
 * @version 4.0.0
 */

import { STATS_GRADE_THRESHOLDS, PLAYER_GRADE_THRESHOLDS } from '../../../core/types';

/** Type pour les grades des stats (5 tiers) */
export type StatsGrade = 'S' | 'A' | 'B' | 'C' | 'D';

/** Type pour les grades des joueurs (4 tiers) */
export type PlayerGrade = 'ELITE' | 'EXCELLENT' | 'GOOD' | 'WEAK';

/**
 * Classe utilitaire pour le calcul des grades
 */
export class GradeCalculator {
  // ============================================================================
  // STATS GRADES (5 tiers - pour métriques individuelles)
  // ============================================================================
  
  /**
   * Grade pour une métrique individuelle (5 tiers: S/A/B/C/D)
   * 
   * @param percentile - Percentile (0-100)
   * @returns Grade S (90-100), A (80-90), B (65-80), C (50-65), D (<50)
   */
  static getStatsGrade(percentile: number): StatsGrade {
    if (percentile >= STATS_GRADE_THRESHOLDS.S) return 'S';
    if (percentile >= STATS_GRADE_THRESHOLDS.A) return 'A';
    if (percentile >= STATS_GRADE_THRESHOLDS.B) return 'B';
    if (percentile >= STATS_GRADE_THRESHOLDS.C) return 'C';
    return 'D';
  }

  /**
   * Couleur pour un grade de stats
   */
  static getStatsGradeColor(grade: StatsGrade): string {
    const colors: Record<StatsGrade, string> = {
      S: '#00D9C0',  // Elite - Cyan
      A: '#4ADE80',  // Excellent - Green
      B: '#FACC15',  // Good - Yellow
      C: '#FB923C',  // Average - Orange
      D: '#EF4444'   // Weak - Red
    };
    return colors[grade];
  }

  /**
   * Label pour un grade de stats
   */
  static getStatsGradeLabel(grade: StatsGrade): string {
    const labels: Record<StatsGrade, string> = {
      S: 'Elite',
      A: 'Excellent',
      B: 'Good',
      C: 'Average',
      D: 'Weak'
    };
    return labels[grade];
  }

  // ============================================================================
  // PLAYER GRADES (4 tiers - pour score global)
  // ============================================================================

  /**
   * Grade pour le score global d'un joueur (4 tiers)
   * 
   * @param score - Score global (0-100)
   * @returns Grade ELITE (75-100), EXCELLENT (60-75), GOOD (50-60), WEAK (<50)
   */
  static getPlayerGrade(score: number): PlayerGrade {
    if (score >= PLAYER_GRADE_THRESHOLDS.ELITE) return 'ELITE';
    if (score >= PLAYER_GRADE_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
    if (score >= PLAYER_GRADE_THRESHOLDS.GOOD) return 'GOOD';
    return 'WEAK';
  }

  /**
   * Couleur pour un grade de player
   */
  static getPlayerGradeColor(grade: PlayerGrade): string {
    const colors: Record<PlayerGrade, string> = {
      ELITE: '#00D9C0',     // Cyan
      EXCELLENT: '#4ADE80', // Green
      GOOD: '#FACC15',      // Yellow
      WEAK: '#EF4444'       // Red
    };
    return colors[grade];
  }

  /**
   * Label pour un grade de player
   */
  static getPlayerGradeLabel(grade: PlayerGrade): string {
    const labels: Record<PlayerGrade, string> = {
      ELITE: 'Elite',
      EXCELLENT: 'Excellent',
      GOOD: 'Good',
      WEAK: 'Weak'
    };
    return labels[grade];
  }

  // ============================================================================
  // Méthodes rétrocompatibles
  // ============================================================================

  /**
   * @deprecated Utiliser getStatsGrade ou getPlayerGrade
   */
  static getGrade(percentile: number): 'S' | 'A' | 'B' | 'C' {
    const grade = this.getStatsGrade(percentile);
    return grade === 'D' ? 'C' : grade;
  }

  /**
   * @deprecated Utiliser getStatsGradeColor
   */
  static getGradeColor(grade: string): string {
    return this.getStatsGradeColor(grade as StatsGrade) || '#EF4444';
  }

  /**
   * @deprecated Utiliser getStatsGradeLabel ou getPlayerGradeLabel
   */
  static getGradeLabel(grade: string): string {
    if (grade === 'S') return 'Elite';
    if (grade === 'A') return 'Excellent';
    if (grade === 'B') return 'Good';
    if (grade === 'C') return 'Average';
    return 'Weak';
  }
}
