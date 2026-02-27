// MetricsSelectorModule.ts - BMAD Pattern
// @ts-nocheck
import type { BMADModule } from '../core/types';

export class MetricsSelectorModule implements BMADModule {
  readonly id = 'metrics-selector';
  private container: HTMLElement | null = null;
  private coordinator: any = null;
  private metrics = [
    { id: 'kda', label: 'KDA' },
    { id: 'kp', label: 'KP%' },
    { id: 'cspm', label: 'CSPM' },
    { id: 'visionScore', label: 'Vision' },
    { id: 'dpm', label: 'DPM' },
    { id: 'gd15', label: 'GD@15' },
  ];

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    this.renderPills();
    
    container.addEventListener('click', (e) => this.handlePillClick(e));
  }

  private renderPills(): void {
    const state = this.coordinator.getState();
    const selected = state.selectedMetrics || [];

    this.container!.innerHTML = `
      <div class="v4-metrics-pills">
        ${this.metrics.map(m => `
          <button class="v4-metric-pill ${selected.includes(m.id) ? 'active' : ''}" data-metric="${m.id}">
            ${m.label}
          </button>
        `).join('')}
      </div>
    `;
  }

  update(state: any): void {
    // Re-render si les métriques changent
    this.renderPills();
  }

  private handlePillClick(e: Event): void {
    const pill = (e.target as HTMLElement).closest('.v4-metric-pill');
    if (!pill) return;

    const metric = pill.dataset.metric;
    const state = this.coordinator.getState();
    let selected = [...state.selectedMetrics];

    if (selected.includes(metric)) {
      if (selected.length > 3) {
        selected = selected.filter(m => m !== metric);
      }
    } else {
      selected.push(metric);
    }

    this.coordinator.setState('selectedMetrics', selected);
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
