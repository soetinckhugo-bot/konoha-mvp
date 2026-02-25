/**
 * ScoreCalculator - Calcul des scores globaux pour le leaderboard
 * Feature Pack V2
 */

import type { Player, MetricConfig, LoLRole } from '../../../core/types';
import { ROLE_WEIGHTS_V4 } from '../config/roleMetrics';

// Utiliser les poids V4 (exportés pour compatibilité)
export const ROLE_WEIGHTS = ROLE_WEIGHTS_V4;

export interface ScoreResult {
  total: number;
  weighted: number;
  breakdown: Record<string, { value: number; weight: number; contribution: number }>;
}

export class ScoreCalculator {
  /**
   * Calcule le score global d'un joueur
   * @param player Joueur à évaluer
   * @param metrics Métriques à considérer
   * @param getNormalizedValue Fonction de normalisation
   */
  calculatePlayerScore(
    player: Player,
    metrics: MetricConfig[],
    getNormalizedValue: (player: Player, metric: MetricConfig) => number
  ): ScoreResult {
    const weights = ROLE_WEIGHTS[player.role] || {};
    let totalScore = 0;
    let totalWeight = 0;
    const breakdown: Record<string, { value: number; weight: number; contribution: number }> = {};

    for (const metric of metrics) {
      const value = player.stats[metric.id];
      if (value === undefined) continue;

      const normalized = getNormalizedValue(player, metric);
      const weight = weights[metric.id] || 1;
      
      const contribution = normalized * weight;
      
      breakdown[metric.id] = {
        value: normalized,
        weight,
        contribution
      };
      
      totalScore += contribution;
      totalWeight += weight;
    }

    const weightedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      total: totalScore,
      weighted: weightedScore,
      breakdown
    };
  }

  /**
   * Calcule les scores pour tous les joueurs
   */
  calculateAllScores(
    players: Player[],
    metrics: MetricConfig[],
    getNormalizedValue: (player: Player, metric: MetricConfig) => number
  ): Map<string, ScoreResult> {
    const results = new Map<string, ScoreResult>();
    
    for (const player of players) {
      const score = this.calculatePlayerScore(player, metrics, getNormalizedValue);
      results.set(player.id, score);
    }
    
    return results;
  }

  /**
   * Récupère le top N joueurs
   */
  getTopPlayers(
    players: Player[],
    metrics: MetricConfig[],
    getNormalizedValue: (player: Player, metric: MetricConfig) => number,
    n: number = 10,
    roleFilter?: LoLRole
  ): { player: Player; score: ScoreResult; rank: number }[] {
    const filteredPlayers = roleFilter 
      ? players.filter(p => p.role === roleFilter)
      : players;

    const scored = filteredPlayers.map(player => ({
      player,
      score: this.calculatePlayerScore(player, metrics, getNormalizedValue),
      rank: 0
    }));

    // Trier par score pondéré décroissant
    scored.sort((a, b) => b.score.weighted - a.score.weighted);

    // Attribuer les rangs
    scored.forEach((item, index) => {
      item.rank = index + 1;
    });

    return scored.slice(0, n);
  }
}
