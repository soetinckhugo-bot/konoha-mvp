/**
 * @fileoverview RadarDataService - Génération des configurations radar
 * 
 * Ce service transforme les données brutes des joueurs en configurations
 * Chart.js prêtes à être rendues. Il gère le caching et les différents modes
 * de visualisation (solo, comparaison, benchmark).
 * 
 * @module RadarDataService
 * @version 1.0.0
 * @author KONOHA Team
 */

import type { Player, MetricConfig, RadarConfig, RadarDataset, RadarViewMode } from '../../../core/types';
import { GradeCalculator } from './GradeCalculator';

export class RadarDataService {
  /** Cache interne pour éviter les recalculs */
  private cache = new Map<string, RadarConfig>();

  /**
   * Génère ou récupère depuis le cache une configuration radar
   * 
   * @param mode - Mode de visualisation ('solo' | 'compare' | 'benchmark')
   * @param playerId - ID du joueur principal
   * @param metrics - Liste des métriques à afficher
   * @param players - Pool de tous les joueurs
   * @param comparedPlayerId - ID du joueur à comparer (mode 'compare')
   * @param getNormalizedValue - Fonction de normalisation optionnelle
   * @returns Configuration RadarConfig pour Chart.js
   * 
   * @example
   * ```typescript
   * const config = service.getConfig('solo', 'player1', metrics, players);
   * radarChart.render(config);
   * ```
   */
  getConfig(
    mode: RadarViewMode,
    playerId: string,
    metrics: MetricConfig[],
    players: Player[],
    comparedPlayerId?: string,
    getNormalizedValue?: (player: Player, metric: MetricConfig) => number
  ): RadarConfig {
    const cacheKey = `${mode}-${playerId}-${metrics.map(m => m.id).join(',')}-${comparedPlayerId || ''}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const config = this.buildConfig(mode, playerId, metrics, players, comparedPlayerId, getNormalizedValue);
    this.cache.set(cacheKey, config);
    return config;
  }

  private buildConfig(
    mode: RadarViewMode,
    playerId: string,
    metrics: MetricConfig[],
    players: Player[],
    comparedPlayerId?: string,
    getNormalizedValue?: (player: Player, metric: MetricConfig) => number
  ): RadarConfig {
    const player = players.find(p => p.id === playerId);
    if (!player) throw new Error(`Player ${playerId} not found`);

    const datasets: RadarDataset[] = [];

    // Dataset principal (joueur sélectionné)
    datasets.push(this.createPlayerDataset(player, metrics, 'var(--kono-primary)', getNormalizedValue));

    // Dataset secondaire selon le mode
    if (mode === 'compare' && comparedPlayerId) {
      const compared = players.find(p => p.id === comparedPlayerId);
      if (compared) {
        datasets.push(this.createPlayerDataset(compared, metrics, 'var(--kono-danger)', getNormalizedValue));
      }
    } else if (mode === 'benchmark') {
      const avgDataset = this.createAverageDataset(players, player.role, metrics, getNormalizedValue);
      datasets.push(avgDataset);
    }

    return {
      metrics,
      datasets,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: { r: { min: 0, max: 100, ticks: { display: false } } }
      }
    };
  }

  private createPlayerDataset(
    player: Player,
    metrics: MetricConfig[],
    colorVar: string,
    getNormalizedValue?: (player: Player, metric: MetricConfig) => number
  ): RadarDataset {
    const color = colorVar.startsWith('var(') 
      ? getComputedStyle(document.documentElement).getPropertyValue(colorVar.replace('var(', '').replace(')', '')).trim() || '#4ECDC4'
      : colorVar;
    
    // Calculer les valeurs normalisées
    const data = metrics.map(m => getNormalizedValue 
      ? getNormalizedValue(player, m) 
      : (player.stats[m.id] || 0));
    
    // Calculer les grades pour chaque point (pour coloration)
    const pointTiers = data.map(value => GradeCalculator.getGrade(value));
    
    return {
      label: player.name,
      playerId: player.id,
      data,
      rawData: metrics.map(m => player.stats[m.id] || 0),
      backgroundColor: color + '33',  // 20% opacity
      borderColor: color,
      borderWidth: 2,
      pointTiers
    };
  }

  private createAverageDataset(
    players: Player[],
    role: string,
    metrics: MetricConfig[],
    getNormalizedValue?: (player: Player, metric: MetricConfig) => number
  ): RadarDataset {
    // Filtrer joueurs du même rôle
    const rolePlayers = players.filter(p => p.role === role);
    
    if (rolePlayers.length === 0) {
      return {
        label: `Moyenne ${role}`,
        playerId: 'average',
        data: metrics.map(() => 50),
        rawData: metrics.map(() => 0),
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 2
      };
    }

    // Calculer moyenne pour chaque métrique
    const avgData = metrics.map(m => {
      const values = rolePlayers.map(p => getNormalizedValue 
        ? getNormalizedValue(p, m) 
        : (p.stats[m.id] || 0));
      return values.reduce((a, b) => a + b, 0) / values.length;
    });

    const avgRawData = metrics.map(m => {
      const values = rolePlayers.map(p => p.stats[m.id] || 0);
      return values.reduce((a, b) => a + b, 0) / values.length;
    });

    return {
      label: `Moyenne ${role} (${rolePlayers.length} joueurs)`,
      playerId: 'average',
      data: avgData,
      rawData: avgRawData,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.5)',
      borderWidth: 2,
      borderDash: [5, 5]
    } as RadarDataset;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
