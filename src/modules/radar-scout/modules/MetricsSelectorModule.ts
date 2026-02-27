// MetricsSelectorModule.ts - Sélection des métriques par rôle
// @ts-nocheck
import type { BMADModule } from '../core/types';
import { getMetricsForRole, ALL_METRICS, MetricConfig } from '../config/metrics.config';

export class MetricsSelectorModule implements BMADModule {
  readonly id = 'metrics-selector';
  private container: HTMLElement | null = null;
  private coordinator: any = null;
  private currentRole = 'TOP';
  private isUpdating = false; // 🔒 Protection boucle infinie

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
    const selectedMetrics = state.selectedMetrics || roleMetrics.slice(0, 6).map(m => m.id);

    this.container!.innerHTML = `
      <div class="metrics-section">
        <div class="metrics-role-badge" style="background: var(--role-${selectedRole.toLowerCase()}, #4ECDC4);">
          ${selectedRole}
        </div>
        <p class="metrics-hint">Métriques optimisées pour ce rôle</p>
        <div class="v4-metrics-pills">
          ${roleMetrics.map(m => this.renderMetricPill(m, selectedMetrics.includes(m.id))).join('')}
        </div>
      </div>
      <style>
        .metrics-section { animation: fadeIn 0.3s ease; }
        .metrics-role-badge { 
          display: inline-block; padding: 4px 10px; border-radius: 4px;
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          color: #000; margin-bottom: 8px;
        }
        .metrics-hint { 
          font-size: 11px; color: var(--v4-text-muted); margin: 0 0 12px 0;
        }
        .v4-metrics-pills { display: flex; flex-wrap: wrap; gap: 8px; }
        .v4-metric-pill { 
          display: flex; align-items: center; gap: 6px;
          padding: 8px 12px; background: var(--v4-bg-input); 
          border: 1px solid var(--v4-border); border-radius: 20px;
          color: var(--v4-text); font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.2s ease; position: relative;
        }
        .v4-metric-pill:hover { border-color: var(--v4-border-visible); }
        .v4-metric-pill.active { 
          background: var(--role-glow, rgba(5, 170, 206, 0.15)); 
          border-color: var(--v4-accent); 
          box-shadow: 0 0 12px var(--role-glow, transparent);
        }
        .v4-metric-pill.inverted { border-style: dashed; }
        .metric-category { 
          width: 6px; height: 6px; border-radius: 50%; 
        }
        .category-combat { background: #FF6B6B; }
        .category-farming { background: #FFD93D; }
        .category-vision { background: #4ECDC4; }
        .category-early { background: #A855F7; }
        .category-economy { background: #22C55E; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      </style>
    `;
  }

  private renderMetricPill(metric: MetricConfig, isSelected: boolean): string {
    const categoryColors: Record<string, string> = {
      combat: 'category-combat',
      farming: 'category-farming',
      vision: 'category-vision',
      early: 'category-early',
      economy: 'category-economy'
    };

    return `
      <button 
        class="v4-metric-pill ${isSelected ? 'active' : ''} ${metric.inverted ? 'inverted' : ''}" 
        data-metric="${metric.id}"
        title="${metric.description}${metric.inverted ? ' (inversé: plus bas = mieux)' : ''}"
      >
        <span class="metric-category ${categoryColors[metric.category]}"></span>
        ${metric.label}
      </button>
    `;
  }

  update(state: any): void {
    // 🔒 Éviter boucle infinie
    if (this.isUpdating) return;
    
    const playerRole = state.selectedPlayer?.role;
    
    // Si le rôle change, re-render avec les métriques par défaut
    if (playerRole && playerRole !== this.currentRole) {
      this.isUpdating = true;
      
      // Mettre à jour avec les métriques par défaut du nouveau rôle
      const roleMetrics = getMetricsForRole(playerRole);
      const defaultMetrics = roleMetrics.map(m => m.id); // Toutes les métriques du rôle
      
      // Utiliser requestAnimationFrame pour éviter la boucle synchrone
      requestAnimationFrame(() => {
        this.coordinator.setState('selectedMetrics', defaultMetrics);
        this.renderMetrics();
        this.isUpdating = false;
      });
    } else {
      // Juste mettre à jour l'UI sans changer l'état
      this.renderMetrics();
    }
  }

  private handlePillClick(e: Event): void {
    const pill = (e.target as HTMLElement).closest('.v4-metric-pill');
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
    
    // Update UI
    pill.classList.toggle('active', selected.includes(metricId));
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
