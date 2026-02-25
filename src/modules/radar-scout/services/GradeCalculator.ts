/**
 * GradeCalculator - Calcul des grades S/A/B/C/D
 * Story 4.1
 */

import { GRADE_THRESHOLDS } from '../../../core/types';

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

export class GradeCalculator {
  /**
   * Détermine le grade selon le centile
   */
  static getGrade(percentile: number): Grade {
    if (percentile >= GRADE_THRESHOLDS.S) return 'S';
    if (percentile >= GRADE_THRESHOLDS.A) return 'A';
    if (percentile >= GRADE_THRESHOLDS.B) return 'B';
    if (percentile >= GRADE_THRESHOLDS.C) return 'C';
    return 'D';
  }

  /**
   * Retourne la couleur associée au grade
   */
  static getGradeColor(grade: Grade): string {
    const colors: Record<Grade, string> = {
      S: 'var(--kono-tier-s)',
      A: 'var(--kono-tier-a)',
      B: 'var(--kono-tier-b)',
      C: 'var(--kono-tier-c)',
      D: 'var(--kono-tier-d)'
    };
    return colors[grade];
  }

  /**
   * Retourne la description du grade
   */
  static getGradeLabel(grade: Grade): string {
    const labels: Record<Grade, string> = {
      S: 'Elite',
      A: 'Excellent',
      B: 'Bon',
      C: 'Moyen',
      D: 'Faible'
    };
    return labels[grade];
  }
}
