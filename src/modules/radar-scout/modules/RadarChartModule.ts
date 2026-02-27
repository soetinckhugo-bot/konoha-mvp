// RadarChartModule.ts - Affiche TOUTES les métriques sélectionnées
// @ts-nocheck
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import type { BMADModule } from '../core/types';
import { normalizeMetric, formatMetricValue, ALL_METRICS } from '../config/metrics.config';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export class RadarChartModule implements BMADModule {
  readonly id = 'radar-chart';
  private container: HTMLElement | null = null;
  private coordinator: any = null;
  private chart: Chart | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private showPercentile = true;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    container.innerHTML = `
      <div class="v4-radar-header">
        <div class="v4-player-badge">
          <span id="radar-chart-player-name" class="v4-player-name">Sélectionnez un joueur</span>
          <span id="radar-chart-role-tag" class="v4-role-tag" style="display:none;"></span>
          <span id="radar-chart-grade" class="v4-grade-badge" style="display:none;"></span>
        </div>
        <div class="v4-view-toggle">
          <button class="v4-toggle-btn" id="radar-toggle-values">Valeurs</button>
          <button class="v4-toggle-btn active" id="radar-toggle-percentile">% Centiles</button>
        </div>
      </div>
      <div class="v4-radar-container">
        <canvas id="radar-chart-canvas"></canvas>
      </div>
      <style>
        .v4-radar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid var(--v4-border);
        }
        .v4-player-badge {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .v4-player-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--v4-text);
        }
        .v4-role-tag {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          background: var(--v4-accent);
          color: #000;
        }
        .v4-grade-badge {
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 800;
        }
        .grade-S { background: #00D9C0; color: #000; }
        .grade-A { background: #00E676; color: #000; }
        .grade-B { background: #FFD93D; color: #000; }
        .grade-C { background: #FF9F43; color: #000; }
        .grade-D { background: #FF6B6B; color: #fff; }
        .v4-view-toggle {
          display: flex;
          gap: 8px;
        }
        .v4-toggle-btn {
          padding: 6px 14px;
          background: var(--v4-bg-input);
          border: 1px solid var(--v4-border);
          border-radius: 6px;
          color: var(--v4-text-muted);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .v4-toggle-btn:hover {
          border-color: var(--v4-border-visible);
          color: var(--v4-text);
        }
        .v4-toggle-btn.active {
          background: var(--v4-accent);
          border-color: var(--v4-accent);
          color: #000;
        }
        .v4-radar-container {
          position: relative;
          height: 400px;
          padding: 16px;
        }
        #radar-chart-canvas {
          max-height: 100%;
        }
      </style>
    `;

    this.canvas = container.querySelector('#radar-chart-canvas') as HTMLCanvasElement;
    
    container.querySelector('#radar-toggle-values')?.addEventListener('click', () => {
      this.showPercentile = false;
      container.querySelector('#radar-toggle-values')?.classList.add('active');
      container.querySelector('#radar-toggle-percentile')?.classList.remove('active');
      this.renderChart();
    });

    container.querySelector('#radar-toggle-percentile')?.addEventListener('click', () => {
      this.showPercentile = true;
      container.querySelector('#radar-toggle-percentile')?.classList.add('active');
      container.querySelector('#radar-toggle-values')?.classList.remove('active');
      this.renderChart();
    });

    this.update(coordinator.getState());
  }

  update(state: any): void {
    this.updateHeader(state);
    this.renderChart();
  }

  private updateHeader(state: any): void {
    const player = state.selectedPlayer;
    const nameEl = this.container?.querySelector('#radar-chart-player-name');
    const roleEl = this.container?.querySelector('#radar-chart-role-tag') as HTMLElement;
    const gradeEl = this.container?.querySelector('#radar-chart-grade') as HTMLElement;

    if (player) {
      if (nameEl) nameEl.textContent = player.name;
      if (roleEl) {
        roleEl.textContent = player.role;
        roleEl.style.display = 'inline-block';
      }
    } else {
      if (nameEl) nameEl.textContent = 'Sélectionnez un joueur';
      if (roleEl) roleEl.style.display = 'none';
      if (gradeEl) gradeEl.style.display = 'none';
    }
  }

  private renderChart(): void {
    const state = this.coordinator.getState();
    const player = state.selectedPlayer;
    
    if (!player || !this.canvas) return;

    this.chart?.destroy();

    const stats = player.stats || {};
    const metrics = state.selectedMetrics || [];
    
    // 🔥 Afficher TOUTES les métriques sélectionnées (pas de limite)
    const labels = metrics.map(m => {
      const config = ALL_METRICS.find(metric => metric.id === m);
      return config?.label || m;
    });
    
    const data = metrics.map(m => {
      const val = stats[m] ?? 0;
      return this.showPercentile ? normalizeMetric(val, m) : val;
    });

    // Couleur selon le rôle
    const roleColors: Record<string, string> = {
      TOP: '#FF6B6B',
      JUNGLE: '#00E676', 
      MID: '#00D4FF',
      ADC: '#FFD93D',
      SUPPORT: '#E040FB'
    };
    const color = roleColors[player.role] || '#4ECDC4';

    this.chart = new Chart(this.canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: player.name,
          data,
          backgroundColor: color + '33',
          borderColor: color,
          borderWidth: 2,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: color
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: this.showPercentile ? 100 : undefined,
            ticks: { display: false },
            grid: { color: 'rgba(148,163,184,0.1)' },
            angleLines: { color: 'rgba(148,163,184,0.1)' },
            pointLabels: {
              color: '#94a3b8',
              font: { size: 10, family: 'Inter', weight: '600' }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(21,21,30,0.95)',
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(148,163,184,0.2)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (ctx: any) => {
                const metricId = metrics[ctx.dataIndex];
                const rawValue = stats[metricId] ?? 0;
                const normalized = normalizeMetric(rawValue, metricId);
                
                if (this.showPercentile) {
                  return `${ctx.label}: ${normalized.toFixed(0)}% (raw: ${formatMetricValue(rawValue, metricId)})`;
                }
                return `${ctx.label}: ${formatMetricValue(rawValue, metricId)}`;
              }
            }
          }
        }
      }
    });
  }

  destroy(): void {
    this.chart?.destroy();
    this.container = null;
    this.coordinator = null;
  }
}
