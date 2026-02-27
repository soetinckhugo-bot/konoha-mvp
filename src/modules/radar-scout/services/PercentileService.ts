// PercentileService.ts - Calcul des centiles par métrique
// @ts-nocheck

export interface PercentileResult {
  value: number;
  percentile: number;
  rank: number;
  total: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export class PercentileService {
  private cache: Map<string, number[]> = new Map();

  // Calculer les centiles pour tous les joueurs d'un dataset
  calculatePercentiles(players: any[], metric: string): Map<string, PercentileResult> {
    const values = players
      .map(p => ({ id: p.id, value: p.stats?.[metric] || 0 }))
      .filter(v => !isNaN(v.value));

    if (values.length === 0) return new Map();

    // Trier par valeur décroissante
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

  // Obtenir le grade selon le percentile
  private getGrade(percentile: number): 'S' | 'A' | 'B' | 'C' | 'D' {
    if (percentile >= 90) return 'S';
    if (percentile >= 75) return 'A';
    if (percentile >= 50) return 'B';
    if (percentile >= 25) return 'C';
    return 'D';
  }

  // Calculer le score global pondéré d'un joueur
  calculateOverallScore(player: any, weights: Record<string, number>): number {
    const stats = player.stats || {};
    let totalWeight = 0;
    let weightedSum = 0;

    Object.entries(weights).forEach(([metric, weight]) => {
      const value = stats[metric];
      if (value !== undefined && !isNaN(value)) {
        weightedSum += value * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  // Pondérations par rôle
  getRoleWeights(role: string): Record<string, number> {
    const weights: Record<string, Record<string, number>> = {
      TOP: { kda: 1.2, kp: 0.8, cspm: 1.3, visionScore: 0.7, dpm: 1.0, gd15: 1.5 },
      JUNGLE: { kda: 1.3, kp: 1.5, cspm: 0.8, visionScore: 1.2, dpm: 0.9, gd15: 1.3 },
      MID: { kda: 1.2, kp: 1.0, cspm: 1.2, visionScore: 0.8, dpm: 1.4, gd15: 1.3 },
      ADC: { kda: 1.0, kp: 0.9, cspm: 1.4, visionScore: 0.6, dpm: 1.5, gd15: 1.2 },
      SUPPORT: { kda: 1.1, kp: 1.4, cspm: 0.5, visionScore: 1.5, dpm: 0.6, gd15: 1.0 }
    };
    return weights[role] || weights.TOP;
  }

  // Calculer la moyenne d'une métrique pour un groupe de joueurs
  calculateAverage(players: any[], metric: string): number {
    const values = players
      .map(p => p.stats?.[metric])
      .filter(v => v !== undefined && !isNaN(v));
    
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

// Singleton export
export const percentileService = new PercentileService();
