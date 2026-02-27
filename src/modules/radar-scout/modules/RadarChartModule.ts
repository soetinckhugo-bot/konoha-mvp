// RadarChartModule.ts - BMAD Pattern
// @ts-nocheck
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import type { BMADModule } from '../core/types';

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
        </div>
        <div class="v4-view-toggle">
          <button class="v4-toggle-btn" id="radar-toggle-values">Valeurs</button>
          <button class="v4-toggle-btn active" id="radar-toggle-percentile">% Centiles</button>
        </div>
      </div>
      <div class="v4-radar-container">
        <canvas id="radar-chart-canvas"></canvas>
      </div>
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
    const roleEl = this.container?.querySelector('#radar-chart-role-tag');

    if (player) {
      if (nameEl) nameEl.textContent = player.name;
      if (roleEl) {
        roleEl.textContent = player.role;
        roleEl.className = `v4-role-tag role-${player.role.toLowerCase()}`;
        roleEl.setAttribute('style', 'display:inline-block;');
      }
    } else {
      if (nameEl) nameEl.textContent = 'Sélectionnez un joueur';
      if (roleEl) roleEl.setAttribute('style', 'display:none;');
    }
  }

  private renderChart(): void {
    const state = this.coordinator.getState();
    const player = state.selectedPlayer;
    
    if (!player || !this.canvas) return;

    this.chart?.destroy();

    const stats = player.stats || {};
    const metrics = state.selectedMetrics || [];
    const labels = metrics.map(m => this.getMetricLabel(m));
    const data = metrics.map(m => {
      const val = stats[m] || 0;
      return this.showPercentile ? this.normalizeValue(val, m) : val;
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
              font: { size: 12, family: 'Inter', weight: '600' }
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
                const metric = metrics[ctx.dataIndex];
                const rawValue = stats[metric] || 0;
                const percentile = this.normalizeValue(rawValue, metric);
                return this.showPercentile 
                  ? `${ctx.label}: ${percentile.toFixed(0)}% (raw: ${rawValue.toFixed(1)})`
                  : `${ctx.label}: ${rawValue.toFixed(1)}`;
              }
            }
          }
        }
      }
    });
  }

  private normalizeValue(value: number, metric: string): number {
    const ranges: Record<string, [number, number]> = {
      kda: [0, 10], kp: [0, 100], cspm: [5, 10],
      visionScore: [20, 100], dpm: [300, 800], gd15: [-500, 1500]
    };
    const [min, max] = ranges[metric] || [0, 100];
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  }

  private getMetricLabel(metric: string): string {
    const labels: Record<string, string> = {
      kda: 'KDA', kp: 'KP%', cspm: 'CSPM', visionScore: 'VISION',
      dpm: 'DPM', gd15: 'GD@15'
    };
    return labels[metric] || metric.toUpperCase();
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
