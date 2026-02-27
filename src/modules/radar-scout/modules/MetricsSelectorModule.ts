// MetricsSelectorModule.ts - Sélection des métriques par rôle avec dots colorés
// @ts-nocheck
import type { BMADModule } from '../core/types';
import { getMetricsForRole, ALL_METRICS, MetricConfig } from '../config/metrics.config';

export class MetricsSelectorModule implements BMADModule {
  readonly id = 'metrics-selector';
  private container: HTMLElement | null = null;
  private coordinator: any = null;
  private currentRole = 'TOP';
  private isUpdating = false;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    this.renderMetrics();
    
    container.addEventListener('click', (e) => this.handlePillClick(e));
  }

  private renderMetrics(): void {
    const state = this.coordinator.getState();
    const selectedRole = state.selectedPlayer?.role || 'TOP';
    this.currentRole = selectedRole;
    
    const roleMetrics = getMetricsForRole(selectedRole);
    const selectedMetrics = state.selectedMetrics || roleMetrics.map(m => m.id);

    this.container!.innerHTML = `
      <div class="metrics-section">
        <div class="metrics-header">
          <span class="role-badge">${selectedRole}</span>
          <span class="metrics-count">${selectedMetrics.length} sélectionnées</span>
        </div>
        <p class="metrics-hint">Métriques optimisées pour ce rôle</p>
        <div class="metrics-pills">
          ${roleMetrics.map(m => this.renderMetricPill(m, selectedMetrics.includes(m.id))).join('')}
        </div>
      </div>
      <style>
        .metrics-section { animation: fadeIn 0.3s ease; }
        .metrics-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .role-badge { 
          padding: 4px 10px; 
          border-radius: 6px;
          font-size: 11px; 
          font-weight: 800; 
          text-transform: uppercase;
          background: var(--v4-accent);
          color: #000;
        }
        .metrics-count {
          font-size: 11px;
          color: var(--v4-text-muted);
        }
        .metrics-hint { 
          font-size: 11px; 
          color: var(--v4-text-muted); 
          margin: 0 0 12px 0;
        }
        .metrics-pills { 
          display: flex; 
          flex-wrap: wrap; 
          gap: 8px; 
        }
        .metric-pill { 
          display: flex; 
          align-items: center; 
          gap: 8px;
          padding: 8px 12px; 
          background: var(--v4-bg-input); 
          border: 1px solid var(--v4-border); 
          border-radius: 20px;
          color: var(--v4-text); 
          font-size: 12px; 
          font-weight: 500;
          cursor: pointer; 
          transition: all 0.2s ease; 
        }
        .metric-pill:hover { 
          border-color: var(--v4-border-visible); 
          transform: translateY(-1px);
        }
        .metric-pill.active { 
          background: var(--role-glow, rgba(5, 170, 206, 0.15)); 
          border-color: var(--v4-accent); 
          box-shadow: 0 0 12px var(--role-glow, transparent);
        }
        .metric-pill.inverted { 
          border-style: dashed;
          opacity: 0.8;
        }
        .category-dot { 
          width: 8px; 
          height: 8px; 
          border-radius: 50%; 
        }
        .cat-combat { background: #FF6B6B; }
        .cat-farming { background: #FFD93D; }
        .cat-vision { background: #4ECDC4; }
        .cat-early { background: #A855F7; }
        .cat-economy { background: #22C55E; }
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(-5px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
      </style>
    `;
  }

  private renderMetricPill(metric: MetricConfig, isSelected: boolean): string {
    const categoryClasses: Record<string, string> = {
      combat: 'cat-combat',
      farming: 'cat-farming',
      vision: 'cat-vision',
      early: 'cat-early',
      economy: 'cat-economy'
    };

    return `
      <button 
        class="metric-pill ${isSelected ? 'active' : ''} ${metric.inverted ? 'inverted' : ''}" 
        data-metric="${metric.id}"
        title="${metric.description}${metric.inverted ? ' (inversé: plus bas = mieux)' : ''}"
      >
        <span class="category-dot ${categoryClasses[metric.category]}"></span>
        ${metric.label}
      </button>
    `;
  }

  update(state: any): void {
    if (this.isUpdating) return;
    
    const playerRole = state.selectedPlayer?.role;
    
    if (playerRole && playerRole !== this.currentRole) {
      this.isUpdating = true;
      
      const roleMetrics = getMetricsForRole(playerRole);
      const defaultMetrics = roleMetrics.map(m => m.id);
      
      requestAnimationFrame(() => {
        this.coordinator.setState('selectedMetrics', defaultMetrics);
        this.renderMetrics();
        this.isUpdating = false;
      });
    } else {
      this.renderMetrics();
    }
  }

  private handlePillClick(e: Event): void {
    const pill = (e.target as HTMLElement).closest('.metric-pill');
    if (!pill) return;

    const metricId = pill.dataset.metric;
    const state = this.coordinator.getState();
    let selected = [...(state.selectedMetrics || [])];

    if (selected.includes(metricId)) {
      if (selected.length > 3) {
        selected = selected.filter(m => m !== metricId);
      }
    } else {
      selected.push(metricId);
    }

    this.coordinator.setState('selectedMetrics', selected);
    pill.classList.toggle('active', selected.includes(metricId));
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
