/**
 * DuelView Component - Mode VS / Tête-à-tête
 * Feature Pack V2 - Mode Duel
 */

import type { Player, MetricConfig, CoreAPI } from '../../../core/types';
import { GradeCalculator } from '../services/GradeCalculator';
import { WinProbability } from '../services/WinProbability';

export interface DuelViewProps {
  player1: Player;
  player2: Player;
  metrics: MetricConfig[];
  core: CoreAPI;
}

export interface DuelResult {
  player1Wins: number;
  player2Wins: number;
  winProbability: {
    player1: number;
    player2: number;
  };
  metricComparisons: MetricComparison[];
}

export interface MetricComparison {
  metric: MetricConfig;
  player1Value: number;
  player2Value: number;
  winner: 'player1' | 'player2' | 'tie';
  difference: number;
  percentDiff: number;
}

export class DuelView {
  private container: HTMLElement | null = null;
  private core: CoreAPI;
  private winProbability: WinProbability;

  constructor(core: CoreAPI) {
    this.core = core;
    this.winProbability = new WinProbability();
  }

  render(props: DuelViewProps): HTMLElement {
    try {
      const { player1, player2, metrics } = props;
      
      this.container = document.createElement('div');
      this.container.className = 'duel-view';

      const result = this.calculateDuel(player1, player2, metrics);

      this.container.innerHTML = `
        <div class="duel-header">
          <div class="duel-player duel-player-1">
            <div class="player-avatar" style="background: var(--kono-primary)">${player1.name.charAt(0)}</div>
            <h3 class="player-name">${player1.name}</h3>
            <span class="player-team">${player1.team}</span>
            <span class="player-role">${player1.role}</span>
          </div>
          
          <div class="duel-vs-section">
            <div class="vs-badge">VS</div>
            <div class="win-probability">
              <div class="probability-bar">
                <div class="probability-fill player1" style="width: ${result.winProbability.player1}%"></div>
                <div class="probability-fill player2" style="width: ${result.winProbability.player2}%"></div>
              </div>
              <span class="probability-label">${result.winProbability.player1}% - ${result.winProbability.player2}%</span>
            </div>
          </div>
          
          <div class="duel-player duel-player-2">
            <div class="player-avatar" style="background: var(--kono-danger)">${player2.name.charAt(0)}</div>
            <h3 class="player-name">${player2.name}</h3>
            <span class="player-team">${player2.team}</span>
            <span class="player-role">${player2.role}</span>
          </div>
        </div>

        <div class="duel-score">
          <div class="score-box ${result.player1Wins > result.player2Wins ? 'winner' : ''}">
            <span class="score-value">${result.player1Wins}</span>
            <span class="score-label">Métriques gagnées</span>
          </div>
          <div class="score-divider">:</div>
          <div class="score-box ${result.player2Wins > result.player1Wins ? 'winner' : ''}">
            <span class="score-value">${result.player2Wins}</span>
            <span class="score-label">Métriques gagnées</span>
          </div>
        </div>

        <div class="duel-metrics">
          ${result.metricComparisons.map(comp => this.renderMetricComparison(comp)).join('')}
        </div>
      `;

      return this.container;
    } catch (error) {
      console.error('[DuelView] Render error:', error);
      this.container = document.createElement('div');
      this.container.className = 'duel-view error';
      this.container.innerHTML = `<p class="error-message">Erreur lors du chargement du duel</p>`;
      return this.container;
    }
  }

  private renderMetricComparison(comp: MetricComparison): string {
    try {
      const { metric, player1Value, player2Value, winner, difference } = comp;
      
      const p1Normalized = this.getNormalizedValue(player1Value, metric);
      const p2Normalized = this.getNormalizedValue(player2Value, metric);
      const p1Grade = GradeCalculator.getGrade(p1Normalized);
      const p2Grade = GradeCalculator.getGrade(p2Normalized);
      
      const p1Class = winner === 'player1' ? 'winner' : winner === 'player2' ? 'loser' : '';
      const p2Class = winner === 'player2' ? 'winner' : winner === 'player1' ? 'loser' : '';
      
      return `
        <div class="duel-metric-row">
          <div class="metric-player metric-player-1 ${p1Class}">
            <span class="metric-grade grade-${p1Grade.toLowerCase()}">${p1Grade}</span>
            <span class="metric-value">${this.formatValue(player1Value, metric)}</span>
          </div>
          
          <div class="metric-info">
            <span class="metric-icon">${metric.icon || '📊'}</span>
            <span class="metric-name">${metric.name}</span>
            ${winner !== 'tie' ? `<span class="metric-diff ${winner === 'player1' ? 'positive' : 'negative'}">${winner === 'player1' ? '+' : '-'}${Math.abs(difference).toFixed(1)}</span>` : '<span class="metric-diff tie">=</span>'}
          </div>
          
          <div class="metric-player metric-player-2 ${p2Class}">
            <span class="metric-value">${this.formatValue(player2Value, metric)}</span>
            <span class="metric-grade grade-${p2Grade.toLowerCase()}">${p2Grade}</span>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('[DuelView] Metric comparison error:', error);
      return '';
    }
  }

  calculateDuel(player1: Player, player2: Player, metrics: MetricConfig[]): DuelResult {
    let player1Wins = 0;
    let player2Wins = 0;
    const metricComparisons: MetricComparison[] = [];

    for (const metric of metrics) {
      const p1Value = player1.stats[metric.id] || 0;
      const p2Value = player2.stats[metric.id] || 0;
      
      // Normaliser pour comparaison
      const p1Normalized = this.getNormalizedValue(p1Value, metric);
      const p2Normalized = this.getNormalizedValue(p2Value, metric);
      
      let winner: 'player1' | 'player2' | 'tie';
      const diff = Math.abs(p1Normalized - p2Normalized);
      
      if (diff < 5) {
        winner = 'tie';
      } else if (p1Normalized > p2Normalized) {
        winner = 'player1';
        player1Wins++;
      } else {
        winner = 'player2';
        player2Wins++;
      }

      metricComparisons.push({
        metric,
        player1Value: p1Value,
        player2Value: p2Value,
        winner,
        difference: Math.abs(p1Value - p2Value),
        percentDiff: p1Value !== 0 ? ((p1Value - p2Value) / p1Value) * 100 : 0
      });
    }

    // Utiliser WinProbability pour calcul sophistiqué
    const p1Metrics = metricComparisons.map(c => 
      this.getNormalizedValue(c.player1Value, c.metric)
    );
    const p2Metrics = metricComparisons.map(c => 
      this.getNormalizedValue(c.player2Value, c.metric)
    );
    
    const winProb = this.winProbability.calculateSimple(p1Metrics, p2Metrics);
    
    return {
      player1Wins,
      player2Wins,
      winProbability: winProb,
      metricComparisons
    };
  }

  private getNormalizedValue(value: number, metric: MetricConfig): number {
    try {
      return this.core.normalize.normalize(value, metric);
    } catch (error) {
      console.warn('[DuelView] Normalize error:', error);
      return 50; // Valeur par défaut
    }
  }

  private formatValue(value: number, metric: MetricConfig): string {
    if (value === undefined || value === null) return '-';
    
    const decimals = metric.decimals ?? 1;
    
    switch (metric.format) {
      case 'percentage':
        return `${value.toFixed(decimals)}%`;
      case 'integer':
        return Math.round(value).toString();
      case 'decimal':
      default:
        return value.toFixed(decimals);
    }
  }

  destroy(): void {
    this.container?.remove();
    this.container = null;
  }
}
