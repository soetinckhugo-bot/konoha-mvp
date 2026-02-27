// PercentileService.ts - Calcul des centiles avec config complète
// @ts-nocheck
import { 
  ALL_METRICS, 
  ROLE_WEIGHTS, 
  METRIC_RANGES,
  normalizeMetric,
  getWeightsForRole 
} from '../config/metrics.config';

export interface PercentileResult {
  value: number;
  percentile: number;
  rank: number;
  total: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  normalized: number;
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
  // Calculer les centiles pour une métrique spécifique
  calculatePercentiles(players: any[], metricId: string): Map<string, PercentileResult> {
    const values = players
      .map(p => ({ 
        id: p.id, 
        value: p.stats?.[metricId] ?? 0,
        rawValue: p.stats?.[metricId] ?? 0
      }))
      .filter(v => !isNaN(v.value));

    if (values.length === 0) return new Map();

    // Trier par valeur décroissante
    const sorted = [...values].sort((a, b) => b.value - a.value);
    const results = new Map<string, PercentileResult>();

    sorted.forEach((item, index) => {
      const percentile = ((sorted.length - index - 1) / (sorted.length - 1)) * 100;
      const normalized = normalizeMetric(item.rawValue, metricId);
      
      results.set(item.id, {
        value: item.rawValue,
        percentile: Math.round(percentile),
        rank: index + 1,
        total: sorted.length,
        grade: this.getGrade(percentile),
        normalized
      });
    });

    return results;
  }

  // Obtenir le grade selon le percentile
  getGrade(percentile: number): 'S' | 'A' | 'B' | 'C' | 'D' {
    if (percentile >= 90) return 'S';
    if (percentile >= 75) return 'A';
    if (percentile >= 50) return 'B';
    if (percentile >= 25) return 'C';
    return 'D';
  }

  // Calculer le score global pondéré d'un joueur
  calculateOverallScore(player: any, players: any[]): PlayerAnalysis {
    const weights = getWeightsForRole(player.role);
    const metrics: Record<string, PercentileResult> = {};
    
    let totalWeightedPercentile = 0;
    let totalWeight = 0;

    // Calculer chaque métrique pondérée
    Object.entries(weights).forEach(([metricId, weight]) => {
      const percentiles = this.calculatePercentiles(players, metricId);
      const result = percentiles.get(player.id);
      
      if (result) {
        metrics[metricId] = result;
        totalWeightedPercentile += result.percentile * weight;
        totalWeight += weight;
      }
    });

    const overallPercentile = totalWeight > 0 ? totalWeightedPercentile / totalWeight : 0;
    
    // Calculer le rang global
    const allScores = players.map(p => ({
      id: p.id,
      score: this.calculateRawScore(p, players)
    })).sort((a, b) => b.score - a.score);
    
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

  // Calculer le score brut pour le ranking
  private calculateRawScore(player: any, players: any[]): number {
    const weights = getWeightsForRole(player.role);
    let score = 0;
    let count = 0;

    Object.entries(weights).forEach(([metricId, weight]) => {
      const percentiles = this.calculatePercentiles(players, metricId);
      const result = percentiles.get(player.id);
      if (result) {
        score += result.percentile * weight;
        count += weight;
      }
    });

    return count > 0 ? score / count : 0;
  }

  // Calculer la moyenne d'une métrique
  calculateAverage(players: any[], metricId: string): number {
    const values = players
      .map(p => p.stats?.[metricId])
      .filter(v => v !== undefined && !isNaN(v));
    
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  // Obtenir les meilleurs joueurs sur une métrique
  getTopPlayers(players: any[], metricId: string, limit: number = 10): Array<{ player: any; result: PercentileResult }> {
    const percentiles = this.calculatePercentiles(players, metricId);
    return players
      .map(p => ({ player: p, result: percentiles.get(p.id) }))
      .filter(x => x.result)
      .sort((a, b) => (b.result?.percentile || 0) - (a.result?.percentile || 0))
      .slice(0, limit);
  }

  // Comparer deux joueurs
  comparePlayers(player1: any, player2: any, players: any[]): {
    metric: string;
    player1Value: number;
    player2Value: number;
    winner: 'p1' | 'p2' | 'tie';
    diff: number;
  }[] {
    const weights = getWeightsForRole(player1.role);
    const comparison = [];

    Object.keys(weights).forEach(metricId => {
      const percentiles = this.calculatePercentiles(players, metricId);
      const p1Result = percentiles.get(player1.id);
      const p2Result = percentiles.get(player2.id);

      if (p1Result && p2Result) {
        const diff = p1Result.percentile - p2Result.percentile;
        comparison.push({
          metric: metricId,
          player1Value: p1Result.value,
          player2Value: p2Result.value,
          winner: diff > 5 ? 'p1' : diff < -5 ? 'p2' : 'tie',
          diff: Math.abs(diff)
        });
      }
    });

    return comparison.sort((a, b) => b.diff - a.diff);
  }
}

export const percentileService = new PercentileService();
