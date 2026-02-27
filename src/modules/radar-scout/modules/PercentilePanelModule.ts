// PercentilePanelModule.ts - Analyse centiles complète avec toutes les métriques
// @ts-nocheck
import type { BMADModule } from '../core/types';
import { percentileService, PercentileResult, PlayerAnalysis } from '../services/PercentileService';
import { ALL_METRICS, formatMetricValue, getWeightsForRole } from '../config/metrics.config';

export class PercentilePanelModule implements BMADModule {
  readonly id = 'percentile-panel';
  private container: HTMLElement | null = null;
  private coordinator: any = null;
  private analysis: PlayerAnalysis | null = null;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    container.innerHTML = `
      <div class="v4-card-header compact">
        <span class="v4-header-icon">📊</span>
        <span class="v4-header-title">Analyse Détaillée</span>
        <div class="tier-badge" id="overall-tier" style="display:none;"></div>
      </div>
      <div class="v4-card-body" id="percentile-content">
        <div class="percentile-empty">Sélectionnez un joueur pour voir l'analyse</div>
      </div>
      <style>
        .percentile-empty { text-align: center; padding: 30px 20px; color: var(--v4-text-muted); font-size: 13px; }
        .analysis-header { 
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--v4-border);
        }
        .analysis-rank { font-size: 13px; color: var(--v4-text-secondary); }
        .analysis-rank strong { color: var(--v4-accent); font-size: 16px; }
        .tier-badge { 
          padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 800;
        }
        .tier-S { background: #3FE0D0; color: #000; }
        .tier-A { background: #22C55E; color: #000; }
        .tier-B { background: #FACC15; color: #000; }
        .tier-C { background: #F59E0B; color: #000; }
        .tier-D { background: #EF4444; color: #fff; }
        
        .metrics-categories { display: flex; flex-direction: column; gap: 16px; }
        .category-section {}
        .category-header { 
          display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
          color: var(--v4-text-muted);
        }
        .category-dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot-combat { background: #FF6B6B; }
        .dot-farming { background: #FFD93D; }
        .dot-vision { background: #4ECDC4; }
        .dot-early { background: #A855F7; }
        .dot-economy { background: #22C55E; }
        
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
        .metric-item { 
          background: var(--v4-bg-input); border-radius: 8px; padding: 10px;
          border: 1px solid transparent; transition: all 0.2s ease;
        }
        .metric-item:hover { border-color: var(--v4-accent); }
        .metric-header { 
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;
        }
        .metric-name { font-size: 11px; font-weight: 600; color: var(--v4-text); }
        .metric-grade { 
          width: 18px; height: 18px; border-radius: 3px; font-size: 10px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }
        .metric-value { font-size: 13px; font-weight: 700; color: var(--v4-text); margin-bottom: 4px; }
        .metric-bar-container { 
          height: 4px; background: var(--v4-bg); border-radius: 2px; overflow: hidden;
        }
        .metric-bar { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
        .metric-percentile { 
          font-size: 10px; color: var(--v4-text-muted); margin-top: 4px; text-align: right;
        }
        
        .weights-info {
          margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--v4-border);
          font-size: 11px; color: var(--v4-text-muted);
        }
        .weights-info strong { color: var(--v4-accent); }
      </style>
    `;

    this.update(coordinator.getState());
  }

  update(state: any): void {
    const player = state.selectedPlayer;
    const players = state.players || [];
    const content = this.container?.querySelector('#percentile-content');
    const overallBadge = this.container?.querySelector('#overall-tier') as HTMLElement;
    
    if (!content) return;

    if (!player || players.length === 0) {
      content.innerHTML = '<div class="percentile-empty">Sélectionnez un joueur pour voir l\'analyse</div>';
      if (overallBadge) overallBadge.style.display = 'none';
      return;
    }

    // Calculer l'analyse complète
    this.analysis = percentileService.calculateOverallScore(player, players);
    
    // Update overall badge
    if (overallBadge) {
      overallBadge.textContent = this.analysis.overall.grade;
      overallBadge.className = `tier-badge tier-${this.analysis.overall.grade}`;
      overallBadge.style.display = 'inline-block';
    }

    // Organiser par catégories
    const metricsByCategory = this.organizeByCategory(this.analysis.metrics);
    
    // Rendre
    content.innerHTML = `
      <div class="analysis-header">
        <span class="analysis-rank">
          Rang <strong>#${this.analysis.overall.rank}</strong> / ${players.length}
        </span>
        <span style="font-size: 12px; color: var(--v4-text-secondary);">
          Score: <strong style="color: var(--v4-accent);">${this.analysis.overall.score}%</strong>
        </span>
      </div>
      
      <div class="metrics-categories">
        ${this.renderCategory('combat', 'Combat', metricsByCategory.combat, '#FF6B6B')}
        ${this.renderCategory('early', 'Early Game', metricsByCategory.early, '#A855F7')}
        ${this.renderCategory('farming', 'Farming', metricsByCategory.farming, '#FFD93D')}
        ${this.renderCategory('vision', 'Vision', metricsByCategory.vision, '#4ECDC4')}
        ${this.renderCategory('economy', 'Économie', metricsByCategory.economy, '#22C55E')}
      </div>
      
      <div class="weights-info">
        Pondération: <strong>${player.role}</strong> (coefficients spécifiques au rôle)
      </div>
    `;
  }

  private organizeByCategory(metrics: Record<string, PercentileResult>): Record<string, Array<{ id: string; result: PercentileResult }>> {
    const byCategory: Record<string, Array<{ id: string; result: PercentileResult }>> = {
      combat: [], farming: [], vision: [], early: [], economy: []
    };

    Object.entries(metrics).forEach(([id, result]) => {
      const config = ALL_METRICS.find(m => m.id === id);
      if (config && byCategory[config.category]) {
        byCategory[config.category].push({ id, result });
      }
    });

    return byCategory;
  }

  private renderCategory(category: string, label: string, items: Array<{ id: string; result: PercentileResult }>, color: string): string {
    if (items.length === 0) return '';

    return `
      <div class="category-section">
        <div class="category-header">
          <span class="category-dot dot-${category}"></span>
          ${label} (${items.length})
        </div>
        <div class="metrics-grid">
          ${items.map(({ id, result }) => {
            const config = ALL_METRICS.find(m => m.id === id);
            return `
              <div class="metric-item" title="${config?.description || ''}">
                <div class="metric-header">
                  <span class="metric-name">${config?.label || id}</span>
                  <span class="metric-grade tier-${result.grade}">${result.grade}</span>
                </div>
                <div class="metric-value">${formatMetricValue(result.value, id)}</div>
                <div class="metric-bar-container">
                  <div class="metric-bar" style="width: ${result.percentile}%; background: ${color};"></div>
                </div>
                <div class="metric-percentile">Top ${100 - result.percentile}%</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
    this.analysis = null;
  }
}
