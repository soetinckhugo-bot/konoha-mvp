// PercentileService.ts - Calcul des centiles
// @ts-nocheck
import { normalizeMetric } from '../config/metrics.config';

export interface PercentileResult {
  value: number;
  percentile: number;
  rank: number;
  total: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface PlayerAnalysis {
  player: any;
  overall: {
    score: number;
    percentile: number;
    grade: 'S' | 'A' | 'B' | 'C' | 'D';
    rank: number;
  };
  metrics: Record<string, PercentileResult>;
}

export class PercentileService {
  // Calculer les centiles pour une métrique
  calculatePercentiles(players: any[], metric: string): Map<string, PercentileResult> {
    const values = players
      .map(p => ({ id: p.id, value: p.stats?.[metric] ?? 0 }))
      .filter(v => !isNaN(v.value));

    if (values.length === 0) return new Map();

    const sorted = [...values].sort((a, b) => b.value - a.value);
    const results = new Map<string, PercentileResult>();

    sorted.forEach((item, index) => {
      const percentile = ((sorted.length - index - 1) / (sorted.length - 1)) * 100;
      results.set(item.id, {
        value: item.value,
        percentile: Math.round(percentile),
        rank: index + 1,
        total: sorted.length,
        grade: this.getGrade(percentile)
      });
    });

    return results;
  }

  getGrade(percentile: number): 'S' | 'A' | 'B' | 'C' | 'D' {
    if (percentile >= 90) return 'S';
    if (percentile >= 75) return 'A';
    if (percentile >= 50) return 'B';
    if (percentile >= 25) return 'C';
    return 'D';
  }

  // Calculer le score global
  calculateOverallScore(player: any, players: any[]): PlayerAnalysis {
    const metrics: Record<string, PercentileResult> = {};
    
    // Utiliser toutes les métriques disponibles pour le joueur
    const metricIds = Object.keys(player.stats || {});
    
    let totalPercentile = 0;
    let count = 0;

    metricIds.forEach(metricId => {
      const percentiles = this.calculatePercentiles(players, metricId);
      const result = percentiles.get(player.id);
      
      if (result) {
        metrics[metricId] = result;
        totalPercentile += result.percentile;
        count++;
      }
    });

    const overallPercentile = count > 0 ? totalPercentile / count : 0;
    
    // Calculer le rang
    const allScores = players.map(p => {
      let score = 0;
      let cnt = 0;
      metricIds.forEach(m => {
        const pct = this.calculatePercentiles(players, m).get(p.id);
        if (pct) {
          score += pct.percentile;
          cnt++;
        }
      });
      return { id: p.id, score: cnt > 0 ? score / cnt : 0 };
    }).sort((a, b) => b.score - a.score);
    
    const rank = allScores.findIndex(s => s.id === player.id) + 1;

    return {
      player,
      overall: {
        score: parseFloat(overallPercentile.toFixed(1)),
        percentile: Math.round(overallPercentile),
        grade: this.getGrade(overallPercentile),
        rank
      },
      metrics
    };
  }
}

export const percentileService = new PercentileService();
