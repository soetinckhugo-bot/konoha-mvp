// PercentilePanelModule.ts - Affichage des centiles BMAD
// @ts-nocheck
import type { BMADModule } from '../core/types';
import { percentileService, PercentileResult } from '../services/PercentileService';

export class PercentilePanelModule implements BMADModule {
  readonly id = 'percentile-panel';
  private container: HTMLElement | null = null;
  private coordinator: any = null;
  private selectedMetrics: string[] = ['kda', 'kp', 'cspm', 'visionScore', 'dpm', 'gd15'];

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    container.innerHTML = `
      <div class="v4-card-header compact">
        <span class="v4-header-icon">📊</span>
        <span class="v4-header-title">Analyse Centiles</span>
      </div>
      <div class="v4-card-body" id="percentile-content">
        <div class="percentile-empty">Sélectionnez un joueur</div>
      </div>
      <style>
        .percentile-empty { text-align: center; padding: 20px; color: var(--v4-text-muted); font-size: 13px; }
        .percentile-grid { display: grid; gap: 8px; }
        .percentile-item { 
          display: flex; align-items: center; gap: 10px; 
          padding: 10px 12px; background: var(--v4-bg-input); 
          border-radius: 8px; border: 1px solid transparent;
          transition: all 0.2s ease;
        }
        .percentile-item:hover { border-color: var(--v4-accent); }
        .percentile-metric { flex: 1; font-size: 12px; font-weight: 600; color: var(--v4-text); }
        .percentile-value { font-size: 13px; color: var(--v4-text-secondary); min-width: 50px; text-align: right; }
        .percentile-bar { flex: 1; height: 6px; background: var(--v4-bg); border-radius: 3px; overflow: hidden; max-width: 80px; }
        .percentile-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
        .percentile-grade { 
          width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
          border-radius: 4px; font-size: 12px; font-weight: 800; 
        }
        .grade-S { background: #3FE0D0; color: #000; }
        .grade-A { background: #22C55E; color: #000; }
        .grade-B { background: #FACC15; color: #000; }
        .grade-C { background: #F59E0B; color: #000; }
        .grade-D { background: #EF4444; color: #fff; }
        .percentile-overall { 
          margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--v4-border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .percentile-overall-label { font-size: 12px; font-weight: 600; color: var(--v4-text); }
        .percentile-overall-grade { 
          padding: 4px 12px; border-radius: var(--radius-pill);
          font-size: 14px; font-weight: 800;
        }
      </style>
    `;

    this.update(coordinator.getState());
  }

  update(state: any): void {
    const player = state.selectedPlayer;
    const players = state.players || [];
    const content = this.container?.querySelector('#percentile-content');
    
    if (!content) return;

    if (!player || players.length === 0) {
      content.innerHTML = '<div class="percentile-empty">Sélectionnez un joueur</div>';
      return;
    }

    // Calculer les centiles pour chaque métrique
    const metrics = state.selectedMetrics || this.selectedMetrics;
    const percentileData: Array<{ metric: string; result: PercentileResult | undefined }> = [];
    
    metrics.forEach(metric => {
      const percentiles = percentileService.calculatePercentiles(players, metric);
      const result = percentiles.get(player.id);
      if (result) {
        percentileData.push({ metric, result });
      }
    });

    // Calculer grade global
    const weights = percentileService.getRoleWeights(player.role);
    const overallScore = percentileService.calculateOverallScore(player, weights);
    const overallPercentile = this.calculateOverallPercentile(percentileData);
    const overallGrade = this.getOverallGrade(overallPercentile);

    // Rendre
    content.innerHTML = `
      <div class="percentile-grid">
        ${percentileData.map(({ metric, result }) => `
          <div class="percentile-item">
            <span class="percentile-metric">${this.getMetricLabel(metric)}</span>
            <span class="percentile-value">${result.value.toFixed(1)}</span>
            <div class="percentile-bar">
              <div class="percentile-fill grade-${result.grade}" style="width: ${result.percentile}%; background: ${this.getGradeColor(result.grade)}"></div>
            </div>
            <span class="percentile-grade grade-${result.grade}">${result.grade}</span>
          </div>
        `).join('')}
      </div>
      <div class="percentile-overall">
        <span class="percentile-overall-label">Score Global</span>
        <span class="percentile-overall-grade grade-${overallGrade}">${overallGrade}</span>
      </div>
    `;
  }

  private getMetricLabel(metric: string): string {
    const labels: Record<string, string> = {
      kda: 'KDA', kp: 'KP%', cspm: 'CSPM', visionScore: 'Vision',
      dpm: 'DPM', gd15: 'GD@15', csd15: 'CSD@15', xpd15: 'XPD@15'
    };
    return labels[metric] || metric.toUpperCase();
  }

  private getGradeColor(grade: string): string {
    const colors: Record<string, string> = {
      S: '#3FE0D0', A: '#22C55E', B: '#FACC15', C: '#F59E0B', D: '#EF4444'
    };
    return colors[grade] || '#888';
  }

  private calculateOverallPercentile(data: Array<{ result?: PercentileResult }>): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + (item.result?.percentile || 0), 0);
    return sum / data.length;
  }

  private getOverallGrade(percentile: number): 'S' | 'A' | 'B' | 'C' | 'D' {
    if (percentile >= 90) return 'S';
    if (percentile >= 75) return 'A';
    if (percentile >= 50) return 'B';
    if (percentile >= 25) return 'C';
    return 'D';
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
