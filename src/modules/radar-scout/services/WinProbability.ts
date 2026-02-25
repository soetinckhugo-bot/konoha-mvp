/**
 * WinProbability - Calcul de probabilité de victoire pour le mode Duel
 * Feature Pack V2
 */

import type { Player, MetricConfig } from '../../../core/types';

export interface WinProbabilityResult {
  player1: number;
  player2: number;
  draw: number;
  factors: {
    metricAdvantage: number;
    consistencyBonus: number;
    roleMatchupModifier: number;
  };
}

export class WinProbability {
  /**
   * Calcule la probabilité de victoire entre deux joueurs
   * Basé sur une heuristique simple comparant leurs performances
   */
  calculate(
    player1: Player,
    player2: Player,
    metrics: MetricConfig[],
    getNormalizedValue: (player: Player, metric: MetricConfig) => number
  ): WinProbabilityResult {
    // Calculer les avantages par métrique
    let player1Advantages = 0;
    let player2Advantages = 0;
    let totalAdvantageDiff = 0;
    const metricDiffs: number[] = [];

    for (const metric of metrics) {
      const p1Value = player1.stats[metric.id];
      const p2Value = player2.stats[metric.id];
      
      if (p1Value === undefined || p2Value === undefined) continue;

      const p1Norm = getNormalizedValue(player1, metric);
      const p2Norm = getNormalizedValue(player2, metric);
      
      const diff = p1Norm - p2Norm;
      metricDiffs.push(diff);
      
      if (diff > 5) {
        player1Advantages++;
        totalAdvantageDiff += diff;
      } else if (diff < -5) {
        player2Advantages++;
        totalAdvantageDiff += Math.abs(diff);
      }
    }

    // Calculer la cohérence (écart-type des différences)
    const avgDiff = metricDiffs.reduce((a, b) => a + b, 0) / metricDiffs.length;
    const variance = metricDiffs.reduce((sum, diff) => sum + Math.pow(diff - avgDiff, 2), 0) / metricDiffs.length;
    const stdDev = Math.sqrt(variance);
    
    // Un joueur cohérent a un écart-type faible
    const consistencyBonus = Math.max(0, (20 - stdDev) / 20); // 0 à 1

    // Facteur d'avantage métrique
    const totalMetrics = player1Advantages + player2Advantages;
    const metricAdvantage = totalMetrics > 0 
      ? (player1Advantages - player2Advantages) / totalMetrics 
      : 0;

    // Probabilité de base
    let p1Base = 50 + (metricAdvantage * 30) + (avgDiff * 0.3);
    
    // Ajouter le bonus de cohérence si le joueur 1 a l'avantage
    if (p1Base > 50) {
      p1Base += consistencyBonus * 5;
    } else {
      p1Base -= consistencyBonus * 5;
    }

    // Limiter entre 5% et 95% (jamais 0% ou 100%)
    const player1Prob = Math.max(5, Math.min(95, p1Base));
    const player2Prob = 100 - player1Prob;

    // Probabilité de match nul (si les scores sont très proches)
    const drawThreshold = 10; // Si diff < 10%, considéré comme match nul
    const drawProb = Math.abs(player1Prob - 50) < (drawThreshold / 2) ? 5 : 0;
    
    // Réajuster pour le match nul
    const adjustedP1 = player1Prob - (drawProb / 2);
    const adjustedP2 = player2Prob - (drawProb / 2);

    return {
      player1: Math.round(adjustedP1),
      player2: Math.round(adjustedP2),
      draw: Math.round(drawProb),
      factors: {
        metricAdvantage,
        consistencyBonus,
        roleMatchupModifier: 0 // Pour extension future
      }
    };
  }

  /**
   * Version simplifiée pour comparaison rapide
   */
  calculateSimple(
    player1Metrics: number[],
    player2Metrics: number[]
  ): { player1: number; player2: number } {
    let p1Wins = 0;
    let p2Wins = 0;

    for (let i = 0; i < Math.min(player1Metrics.length, player2Metrics.length); i++) {
      if (player1Metrics[i] > player2Metrics[i]) {
        p1Wins++;
      } else if (player2Metrics[i] > player1Metrics[i]) {
        p2Wins++;
      }
    }

    const total = p1Wins + p2Wins;
    if (total === 0) return { player1: 50, player2: 50 };

    return {
      player1: Math.round((p1Wins / total) * 100),
      player2: Math.round((p2Wins / total) * 100)
    };
  }
}
