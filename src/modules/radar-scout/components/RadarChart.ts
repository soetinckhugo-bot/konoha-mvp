/**
 * RadarChart Component - Intégration Chart.js
 * Story 3.2
 */

import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import type { RadarConfig } from '../../../core/types';

// Register Chart.js components
Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export type RadarViewMode = 'percentiles' | 'values';

export class RadarChart {
  private canvas: HTMLCanvasElement | null = null;
  private chart: Chart | null = null;
  private containerId: string;
  private viewMode: RadarViewMode = 'percentiles';

  constructor(containerId: string) {
    this.containerId = containerId;
  }

  setViewMode(mode: RadarViewMode): void {
    this.viewMode = mode;
  }

  render(config: RadarConfig): void {
    // Destroy existing chart
    this.destroy();

    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container #${this.containerId} not found`);
      return;
    }

    // 🔧 FIX: Clear container to prevent duplicate canvases
    container.innerHTML = '';
    this.canvas = null;

    // Create canvas
    this.canvas = document.createElement('canvas');
    container.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const self = this;
    
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
              color: 'rgba(148, 163, 184, 0.08)',  // V4: very subtle grid
              circular: true,
              lineWidth: 1
            },
            angleLines: {
              display: false  // V4: No radial lines for cleaner look
            },
            pointLabels: {
              color: 'rgba(226, 232, 240, 0.85)',  // V4: labels color
              font: {
                family: 'Space Grotesk',
                size: 11,
                weight: 500
              }
            },
            ticks: {
              display: true,
              stepSize: 25,
              color: 'rgba(148, 163, 184, 0.5)',
              font: {
                family: 'Space Grotesk',
                size: 9
              },
              backdropColor: 'transparent',
              z: 10
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
            // V4 Dark Tooltip Style from design-brief-sally.md
            backgroundColor: '#1B1D2B',
            titleColor: '#E2E8F0',
            bodyColor: 'rgba(226, 232, 240, 0.85)',
            borderColor: 'rgba(148, 163, 184, 0.14)',
            borderWidth: 1,
            cornerRadius: 12,
            padding: 12,
            titleFont: {
              family: 'Space Grotesk',
              size: 14,
              weight: 700
            },
            bodyFont: {
              family: 'Inter',
              size: 13,
              weight: 600
            },
            callbacks: {
              label: (context) => {
                const dataset = config.datasets[context.datasetIndex];
                const metric = config.metrics[context.dataIndex];
                
                if (self.viewMode === 'percentiles') {
                  // Mode PERCENTILES: afficher le percentile + Grade
                  const percentile = Math.round(context.raw as number);
                  const tier = dataset.pointTiers?.[context.dataIndex] || 'C';
                  return `${context.dataset.label}: ${percentile} (Grade ${tier})`;
                } else {
                  // Mode VALUES: afficher la valeur brute
                  const rawValue = dataset.rawData[context.dataIndex];
                  return `${context.dataset.label}: ${rawValue.toFixed(metric.decimals || 1)}`;
                }
              }
            }
          }
        }
      },
      plugins: [{
        id: 'datalabels',
        afterDatasetsDraw(chart) {
          // En mode VALUES, afficher les valeurs sur les points
          if (self.viewMode !== 'values') return;
          
          const ctx = chart.ctx;
          ctx.save();
          ctx.font = 'bold 11px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          chart.data.datasets.forEach((_dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            if (!meta.hidden) {
              meta.data.forEach((point: any, index: number) => {
                const rawValue = config.datasets[datasetIndex].rawData[index];
                const metric = config.metrics[index];
                const label = rawValue.toFixed(metric.decimals || 1);
                
                // Position du point
                const x = point.x;
                const y = point.y;
                
                // Décalage légèrement vers l'extérieur
                const angle = Math.atan2(y - chart.chartArea.top - (chart.chartArea.bottom - chart.chartArea.top) / 2, 
                                         x - chart.chartArea.left - (chart.chartArea.right - chart.chartArea.left) / 2);
                const offset = 15;
                const labelX = x + Math.cos(angle) * offset;
                const labelY = y + Math.sin(angle) * offset;
                
                // V4 Value Bubble Style from design-brief-sally.md
                const textWidth = ctx.measureText(label).width;
                const bubbleWidth = Math.max(34, textWidth + 16);
                const bubbleHeight = 22;
                
                // Cyan bubble background
                ctx.fillStyle = 'rgba(5, 170, 206, 0.85)';
                ctx.beginPath();
                ctx.roundRect(
                  labelX - bubbleWidth/2, 
                  labelY - bubbleHeight/2, 
                  bubbleWidth, 
                  bubbleHeight, 
                  999
                );
                ctx.fill();
                
                // Shadow effect
                ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
                ctx.shadowBlur = 20;
                ctx.shadowOffsetY = 10;
                
                // Dark text on cyan bubble
                ctx.fillStyle = '#0B1020';
                ctx.font = 'bold 12px "Inter", sans-serif';
                ctx.fillText(label, labelX, labelY);
                
                // Reset shadow
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;
              });
            }
          });
          ctx.restore();
        }
      }]
    });
  }

  private buildDatasets(config: RadarConfig) {
    return config.datasets.map(ds => {
      // Si des tiers sont fournis, colorer chaque point selon son tier
      const pointColors = ds.pointTiers?.map(tier => this.getTierColor(tier)) || ds.borderColor;
      const pointRadii = ds.pointTiers?.map(() => 6) || 6;
      
      return {
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.backgroundColor,
        borderColor: ds.borderColor,
        borderWidth: ds.borderWidth,
        pointBackgroundColor: pointColors,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: ds.borderColor,
        pointRadius: pointRadii,
        pointHoverRadius: 8,
        fill: true
      };
    });
  }

  private getTierColor(tier: string): string {
    // V4 Tier Colors from design-brief-sally.md
    const colors: Record<string, string> = {
      'S': '#3FE0D0', // Elite - Teal
      'A': '#22C55E', // Excellent - Green
      'B': '#FACC15', // Good - Yellow
      'C': '#F59E0B', // Average - Orange
      'D': '#EF4444'  // Weak - Red
    };
    return colors[tier] || '#64748B';
  }

  destroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    // 🔧 FIX: Also remove canvas from DOM
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
  }

  /**
   * Retourne le canvas pour export
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }
}
