/**
 * RadarChart Component - Intégration Chart.js
 * Story 3.2
 */

import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import type { RadarConfig } from '../../../core/types';

// Register Chart.js components
Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export class RadarChart {
  private canvas: HTMLCanvasElement | null = null;
  private chart: Chart | null = null;
  private containerId: string;

  constructor(containerId: string) {
    this.containerId = containerId;
  }

  render(config: RadarConfig): void {
    // Destroy existing chart
    this.destroy();

    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container #${this.containerId} not found`);
      return;
    }

    // Create canvas if not exists
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      container.appendChild(this.canvas);
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: config.metrics.map(m => m.name),
        datasets: this.buildDatasets(config)
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0  // Désactivé pour performance (< 100ms)
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            grid: {
              color: 'rgba(255, 255, 255, 0.08)',
              circular: true
            },
            angleLines: {
              color: 'rgba(255, 255, 255, 0.12)'
            },
            pointLabels: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                family: 'Space Grotesk',
                size: 12
              }
            },
            ticks: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: config.datasets.length > 1,
            labels: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: { family: 'Space Grotesk', size: 14 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(26, 26, 37, 0.95)',
            titleColor: '#fff',
            bodyColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                const dataset = config.datasets[context.datasetIndex];
                const rawValue = dataset.rawData[context.dataIndex];
                const metric = config.metrics[context.dataIndex];
                return `${context.dataset.label}: ${rawValue.toFixed(metric.decimals || 1)}`;
              }
            }
          }
        }
      }
    });
  }

  private buildDatasets(config: RadarConfig) {
    return config.datasets.map(ds => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.backgroundColor,
      borderColor: ds.borderColor,
      borderWidth: ds.borderWidth,
      pointBackgroundColor: ds.borderColor,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: ds.borderColor,
      fill: true
    }));
  }

  destroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  /**
   * Retourne le canvas pour export
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }
}
