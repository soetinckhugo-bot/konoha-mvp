// MetricsSelectorModule.ts - Design exact comme les screenshots
// @ts-nocheck
import type { BMADModule } from '../core/types';
import { getMetricsForRole, ALL_METRICS } from '../config/metrics.config';

export class MetricsSelectorModule implements BMADModule {
  readonly id = 'metrics-selector';
  private container: HTMLElement | null = null;
  private coordinator: any = null;
  private currentRole = 'ALL';
  private isUpdating = false;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    this.renderMetrics();
  }

  private renderMetrics(): void {
    const state = this.coordinator.getState();
    const selectedRole = state.currentRole || 'ALL';
    this.currentRole = selectedRole;
    
    const roleMetrics = getMetricsForRole(selectedRole);
    const selectedMetrics = state.selectedMetrics || roleMetrics.map(m => m.id);

    this.container!.innerHTML = `
      <div class="metrics-section">
        <div class="metrics-header">
          <span class="metrics-icon">☰</span>
          <span class="metrics-title">${selectedRole === 'ALL' ? 'ALL METRICS' : `METRICS ${selectedRole}`}</span>
        </div>
        <div class="metrics-grid">
          ${roleMetrics.map(m => this.renderMetricPill(m, selectedMetrics.includes(m.id))).join('')}
        </div>
      </div>
      <style>
        .metrics-section {
          animation: fadeIn 0.3s ease;
        }
        .metrics-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .metrics-icon {
          font-size: 16px;
          color: var(--v4-text-muted);
        }
        .metrics-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--v4-text);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .metrics-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .metric-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 14px;
          background: rgba(78, 205, 196, 0.15);
          border: 1px solid rgba(78, 205, 196, 0.3);
          border-radius: 20px;
          color: #4ECDC4;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .metric-pill:hover {
          background: rgba(78, 205, 196, 0.25);
          transform: translateY(-1px);
        }
        .metric-pill.inverted {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #FF6B6B;
        }
        .metric-pill.inverted:hover {
          background: rgba(239, 68, 68, 0.25);
        }
        .metric-pill.selected {
          background: var(--v4-accent);
          border-color: var(--v4-accent);
          color: #000;
        }
        .metric-arrow {
          font-size: 10px;
          opacity: 0.8;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    `;

    // Click handlers
    this.container!.querySelectorAll('.metric-pill').forEach(pill => {
      pill.addEventListener('click', (e) => this.handlePillClick(e));
    });
  }

  private renderMetricPill(metric: any, isSelected: boolean): string {
    const arrow = metric.inverted ? '↓' : '↑';
    const invertedClass = metric.inverted ? 'inverted' : '';
    const selectedClass = isSelected ? 'selected' : '';

    return `
      <button 
        class="metric-pill ${invertedClass} ${selectedClass}" 
        data-metric="${metric.id}"
        title="${metric.description}"
      >
        ${metric.label}
        <span class="metric-arrow">${arrow}</span>
      </button>
    `;
  }

  update(state: any): void {
    if (this.isUpdating) return;
    
    const currentRole = state.currentRole || 'ALL';
    
    if (currentRole !== this.currentRole) {
      this.isUpdating = true;
      
      // Mettre à jour avec TOUTES les métriques du nouveau rôle
      const roleMetrics = getMetricsForRole(currentRole);
      const allMetricIds = roleMetrics.map(m => m.id);
      
      requestAnimationFrame(() => {
        this.coordinator.setState('selectedMetrics', allMetricIds);
        this.renderMetrics();
        this.isUpdating = false;
      });
    } else {
      // Juste mettre à jour l'UI
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
      // Ne pas désélectionner si c'est la dernière métrique
      if (selected.length > 1) {
        selected = selected.filter(m => m !== metricId);
      }
    } else {
      selected.push(metricId);
    }

    this.coordinator.setState('selectedMetrics', selected);
    pill.classList.toggle('selected', selected.includes(metricId));
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
