// RadarChartModule.ts - Radar Chart avec toutes les métriques
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
        .v4-grade-badge {
          padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 800;
          margin-left: 8px;
        }
        .grade-S { background: #3FE0D0; color: #000; }
        .grade-A { background: #22C55E; color: #000; }
        .grade-B { background: #FACC15; color: #000; }
        .grade-C { background: #F59E0B; color: #000; }
        .grade-D { background: #EF4444; color: #fff; }
      </style>
    `;

    this.canvas = container.querySelector('#radar-chart-canvas') as HTMLCanvasElement;
    
    // Event listeners
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
        roleEl.className = `v4-role-tag role-${player.role.toLowerCase()}`;
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
    
    // 🔥 PAS DE LIMITE - Toutes les métriques sélectionnées sont affichées
    const labels = metrics.map(m => {
      const config = ALL_METRICS.find(metric => metric.id === m);
      return config?.label || m.toUpperCase();
    });
    
    const data = metrics.map(m => {
      const val = stats[m] || 0;
      return this.showPercentile ? normalizeMetric(val, m) : val;
    });

    const accentColor = this.getRoleColor(player.role);

    this.chart = new Chart(this.canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: player.name,
          data,
          backgroundColor: accentColor + '33',
          borderColor: accentColor,
          borderWidth: 2,
          pointBackgroundColor: accentColor,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: accentColor
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
                const rawValue = stats[metricId] || 0;
                const normalized = normalizeMetric(rawValue, metricId);
                const config = ALL_METRICS.find(m => m.id === metricId);
                
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

  private getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      TOP: '#FF4444', JUNGLE: '#00E676', MID: '#00D4FF',
      ADC: '#FFD700', SUPPORT: '#E040FB'
    };
    return colors[role] || '#05AACE';
  }

  destroy(): void {
    this.chart?.destroy();
    this.container = null;
    this.coordinator = null;
  }
}
