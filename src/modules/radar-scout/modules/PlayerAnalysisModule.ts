// PlayerAnalysisModule.ts - Carte d'analyse complète du joueur
// @ts-nocheck
import type { BMADModule } from '../core/types';
import { percentileService, PlayerAnalysis } from '../services/PercentileService';
import { ALL_METRICS, formatMetricValue } from '../config/metrics.config';

export class PlayerAnalysisModule implements BMADModule {
  readonly id = 'player-analysis';
  private container: HTMLElement | null = null;
  private coordinator: any = null;
  private analysis: PlayerAnalysis | null = null;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    container.innerHTML = `
      <div class="analysis-card" id="analysis-content">
        <div class="analysis-empty">Sélectionnez un joueur</div>
      </div>
      <style>
        .analysis-card {
          background: var(--v4-bg-card);
          border: 1px solid var(--v4-border);
          border-radius: 12px;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }
        .analysis-empty {
          text-align: center;
          padding: 40px;
          color: var(--v4-text-muted);
          font-size: 14px;
        }
        
        /* Header avec Tier */
        .analysis-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--v4-border);
        }
        .tier-display {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .tier-badge-large {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 800;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .tier-info h3 {
          margin: 0;
          font-size: 18px;
          color: var(--v4-text);
        }
        .tier-info p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: var(--v4-text-muted);
        }
        .rank-display {
          text-align: right;
        }
        .rank-number {
          font-size: 24px;
          font-weight: 700;
          color: var(--v4-accent);
        }
        .rank-total {
          font-size: 13px;
          color: var(--v4-text-muted);
        }
        
        /* Stats grid */
        .analysis-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .stat-box {
          background: var(--v4-bg-input);
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: var(--v4-text);
        }
        .stat-label {
          font-size: 11px;
          color: var(--v4-text-muted);
          margin-top: 4px;
          text-transform: uppercase;
        }
        
        /* Forces/Faiblesses */
        .analysis-section {
          margin-top: 16px;
        }
        .section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--v4-text-muted);
          margin-bottom: 10px;
          letter-spacing: 0.5px;
        }
        .metric-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .metric-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: var(--v4-bg-input);
          border-radius: 8px;
          border-left: 3px solid transparent;
        }
        .metric-row.excellent { border-left-color: #3FE0D0; }
        .metric-row.good { border-left-color: #22C55E; }
        .metric-row.average { border-left-color: #FACC15; }
        .metric-row.poor { border-left-color: #EF4444; }
        
        .metric-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--v4-text);
        }
        .metric-detail {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .metric-percentile {
          font-size: 12px;
          font-weight: 700;
          color: var(--v4-accent);
        }
        .metric-grade {
          width: 22px;
          height: 22px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
        }
        .grade-S { background: #3FE0D0; color: #000; }
        .grade-A { background: #22C55E; color: #000; }
        .grade-B { background: #FACC15; color: #000; }
        .grade-C { background: #F59E0B; color: #000; }
        .grade-D { background: #EF4444; color: #fff; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    `;

    this.update(coordinator.getState());
  }

  update(state: any): void {
    const player = state.selectedPlayer;
    const players = state.players || [];
    const content = this.container?.querySelector('#analysis-content');

    if (!content) return;

    if (!player || players.length === 0) {
      content.innerHTML = '<div class="analysis-empty">Sélectionnez un joueur pour voir l\'analyse</div>';
      return;
    }

    // Calculer l'analyse
    this.analysis = percentileService.calculateOverallScore(player, players);
    const { overall, metrics } = this.analysis;

    // Trier les métriques par percentile
    const sortedMetrics = Object.entries(metrics)
      .map(([id, result]) => ({ id, ...result }))
      .sort((a, b) => b.percentile - a.percentile);

    const top3 = sortedMetrics.slice(0, 3);
    const bottom3 = sortedMetrics.slice(-3).reverse();

    content.innerHTML = `
      <div class="analysis-header">
        <div class="tier-display">
          <div class="tier-badge-large grade-${overall.grade}">${overall.grade}</div>
          <div class="tier-info">
            <h3>Tier ${overall.grade}</h3>
            <p>Score global: ${overall.score.toFixed(1)}%</p>
          </div>
        </div>
        <div class="rank-display">
          <div class="rank-number">#${overall.rank}</div>
          <div class="rank-total">sur ${overall.total} joueurs</div>
        </div>
      </div>

      <div class="analysis-stats">
        <div class="stat-box">
          <div class="stat-value">${overall.percentile}%</div>
          <div class="stat-label">Percentile</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${sortedMetrics.filter(m => m.grade === 'S' || m.grade === 'A').length}</div>
          <div class="stat-label">Stats S/A</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${sortedMetrics.length}</div>
          <div class="stat-label">Métriques</div>
        </div>
      </div>

      <div class="analysis-section">
        <div class="section-title">Forces (Top 3)</div>
        <div class="metric-list">
          ${top3.map(m => this.renderMetricRow(m, 'excellent')).join('')}
        </div>
      </div>

      <div class="analysis-section">
        <div class="section-title">Axes d'amélioration</div>
        <div class="metric-list">
          ${bottom3.map(m => this.renderMetricRow(m, m.grade === 'D' ? 'poor' : 'average')).join('')}
        </div>
      </div>
    `;

    // Mettre à jour le grade dans le radar aussi
    this.updateRadarGrade(overall.grade);
  }

  private renderMetricRow(metric: any, cssClass: string): string {
    const config = ALL_METRICS.find(m => m.id === metric.id);
    const percentileText = metric.percentile >= 90 ? 'Top 10%' : 
                          metric.percentile >= 75 ? 'Top 25%' : 
                          metric.percentile >= 50 ? 'Top 50%' : 'Bottom 50%';

    return `
      <div class="metric-row ${cssClass}">
        <span class="metric-name">${config?.label || metric.id}</span>
        <div class="metric-detail">
          <span class="metric-percentile">${percentileText}</span>
          <span class="metric-grade grade-${metric.grade}">${metric.grade}</span>
        </div>
      </div>
    `;
  }

  private updateRadarGrade(grade: string): void {
    // Mettre à jour le badge dans le radar chart
    const radarModule = this.coordinator?.modules?.get('radar-chart');
    if (radarModule?.updateGrade) {
      radarModule.updateGrade(grade);
    }
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
    this.analysis = null;
  }
}
