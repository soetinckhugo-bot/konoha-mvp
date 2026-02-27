/**
 * @fileoverview GradeService - Calcul des grades S/A/B/C/D
 * 
 * Service uniformisé combinant GradeCalculator existant + logique V4
 * Gère les grades pour les stats individuelles et les joueurs
 * 
 * @example
 * const service = new GradeService();
 * const grade = service.getGrade(85);  // 'A'
 * const color = service.getColor('A'); // '#22C55E'
 */

import type { Player } from '../../../core/types';
import type { IGradeService } from '../../../core/types/bmad';
import { PercentileService } from './PercentileService';

/**
 * Configuration des grades
 */
interface GradeConfig {
  min: number;
  max: number;
  label: string;
  color: string;
  description: string;
}

/**
 * Seuils pour les grades de stats (métriques individuelles)
 * Plus strict que les grades joueurs
 */
const STATS_GRADES: Record<string, GradeConfig> = {
  S: { min: 90, max: 100, label: 'Elite', color: '#00D9C0', description: 'Elite' },
  A: { min: 75, max: 89, label: 'Excellent', color: '#22C55E', description: 'Excellent' },
  B: { min: 55, max: 74, label: 'Good', color: '#FACC15', description: 'Bon' },
  C: { min: 35, max: 54, label: 'Average', color: '#F59E0B', description: 'Moyen' },
  D: { min: 0, max: 34, label: 'Weak', color: '#EF4444', description: 'Faible' },
};

/**
 * Seuils pour les grades de joueurs (plus permissifs)
 */
const PLAYER_GRADES: Record<string, GradeConfig> = {
  S: { min: 75, max: 100, label: 'Elite', color: '#00D9C0', description: 'Elite' },
  A: { min: 60, max: 74, label: 'Excellent', color: '#22C55E', description: 'Excellent' },
  B: { min: 50, max: 59, label: 'Good', color: '#FACC15', description: 'Bon' },
  C: { min: 0, max: 49, label: 'Average', color: '#F59E0B', description: 'Moyen' },
};

/**
 * Service de calcul des grades
 * Uniformise la logique entre GradeCalculator et V4
 */
export class GradeService implements IGradeService {
  private percentileService: PercentileService;
  
  constructor() {
    this.percentileService = new PercentileService();
  }
  
  /**
   * Retourne le grade pour un percentile (stats individuelles)
   * Seuils stricts: S(90+), A(75+), B(55+), C(35+), D(<35)
   * 
   * @param percentile - Percentile 0-100
   * @returns Grade S/A/B/C/D
   */
  getGrade(percentile: number): 'S' | 'A' | 'B' | 'C' | 'D' {
    // Clamp entre 0 et 100
    const p = Math.max(0, Math.min(100, percentile));
    
    if (p >= 90) return 'S';
    if (p >= 75) return 'A';
    if (p >= 55) return 'B';
    if (p >= 35) return 'C';
    return 'D';
  }
  
  /**
   * Retourne le grade pour un joueur (seuils plus permissifs)
   * Seuils: S(75+), A(60+), B(50+), C(<50)
   * 
   * @param averagePercentile - Percentile moyen du joueur
   * @returns Grade S/A/B/C
   */
  getPlayerGradeFromAverage(averagePercentile: number): 'S' | 'A' | 'B' | 'C' {
    const p = Math.max(0, Math.min(100, averagePercentile));
    
    if (p >= 75) return 'S';
    if (p >= 60) return 'A';
    if (p >= 50) return 'B';
    return 'C';
  }
  
  /**
   * Calcule le grade global d'un joueur
   * 
   * @param player - Joueur à évaluer
   * @param allPlayers - Tous les joueurs pour comparaison
   * @returns Grade S/A/B/C
   */
  getPlayerGrade(player: Player, allPlayers: Player[]): 'S' | 'A' | 'B' | 'C' {
    // Métriques clés pour évaluer un joueur
    const keyMetrics = ['kda', 'kp', 'cspm', 'dpm', 'visionScore'];
    
    // Calculer les percentiles pour chaque métrique
    const percentiles = this.percentileService.calculatePercentiles(
      player,
      keyMetrics,
      allPlayers
    );
    
    // Calculer la moyenne
    const avg = this.percentileService.calculateAveragePercentile(percentiles);
    
    // Retourner le grade
    return this.getPlayerGradeFromAverage(avg);
  }
  
  /**
   * Retourne la couleur associée à un grade
   * 
   * @param grade - Grade S/A/B/C/D
   * @returns Code couleur hex
   */
  getColor(grade: string): string {
    const upperGrade = grade.toUpperCase();
    return STATS_GRADES[upperGrade]?.color || '#888888';
  }
  
  /**
   * Retourne le label (description) d'un grade
   * 
   * @param grade - Grade S/A/B/C/D
   * @returns Label (Elite, Excellent, etc.)
   */
  getLabel(grade: string): string {
    const upperGrade = grade.toUpperCase();
    return STATS_GRADES[upperGrade]?.label || 'Unknown';
  }
  
  /**
   * Retourne la description complète d'un grade
   * 
   * @param grade - Grade S/A/B/C/D
   * @returns Description
   */
  getDescription(grade: string): string {
    const upperGrade = grade.toUpperCase();
    return STATS_GRADES[upperGrade]?.description || 'Inconnu';
  }
  
  /**
   * Retourne la configuration complète d'un grade
   * 
   * @param grade - Grade S/A/B/C/D
   * @returns Configuration du grade
   */
  getGradeConfig(grade: string): GradeConfig | null {
    const upperGrade = grade.toUpperCase();
    return STATS_GRADES[upperGrade] || null;
  }
  
  /**
   * Retourne tous les grades disponibles
   * 
   * @returns Liste des grades S/A/B/C/D
   */
  getAllGrades(): string[] {
    return ['S', 'A', 'B', 'C', 'D'];
  }
  
  /**
   * Calcule le grade pour une métrique spécifique d'un joueur
   * 
   * @param player - Joueur
   * @param metric - Métrique
   * @param allPlayers - Tous les joueurs
   * @returns Grade S/A/B/C/D
   */
  getMetricGrade(
    player: Player,
    metric: string,
    allPlayers: Player[]
  ): 'S' | 'A' | 'B' | 'C' | 'D' {
    const percentile = this.percentileService.calculatePercentile(
      player.stats[metric] || 0,
      metric,
      allPlayers.filter(p => p.role === player.role),
      this.percentileService.isInvertedMetric(metric)
    );
    
    return this.getGrade(percentile);
  }
  
  /**
   * Calcule les grades pour toutes les métriques d'un joueur
   * 
   * @param player - Joueur
   * @param metrics - Liste des métriques
   * @param allPlayers - Tous les joueurs
   * @returns Map métrique -> grade
   */
  getAllMetricGrades(
    player: Player,
    metrics: string[],
    allPlayers: Player[]
  ): Map<string, 'S' | 'A' | 'B' | 'C' | 'D'> {
    const grades = new Map<string, 'S' | 'A' | 'B' | 'C' | 'D'>();
    
    for (const metric of metrics) {
      const grade = this.getMetricGrade(player, metric, allPlayers);
      grades.set(metric, grade);
    }
    
    return grades;
  }
  
  /**
   * Formate un grade avec style pour affichage
   * 
   * @param grade - Grade S/A/B/C/D
   * @returns HTML string stylisé
   */
  formatGradeBadge(grade: string): string {
    const color = this.getColor(grade);
    return `
      <span style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${color};
        color: ${grade === 'D' ? '#fff' : '#000'};
        font-weight: 700;
        font-size: 14px;
      ">${grade}</span>
    `;
  }
}

// Export singleton
export const gradeService = new GradeService();
export default GradeService;
