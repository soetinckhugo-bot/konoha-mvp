/**
 * ExportRenderService - Génère un DOM propre pour l'export PNG
 * Résout le problème de glassmorphism avec html2canvas
 * 
 * @module ExportRenderService
 * @version 1.0.0
 */

import type { Player, MetricConfig, RadarViewMode, Grade } from '../../../core/types';
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';

// Register Chart.js components for export
Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

export type ExportMode = 'solo' | 'social';

export interface ExportRenderOptions {
  mode: ExportMode;
  player: Player;
  comparePlayer?: Player;
  metrics: MetricConfig[];
  view: RadarViewMode;
  getNormalizedValue: (player: Player, metric: MetricConfig) => number;
  getGrade: (percentile: number) => Grade;
}

export interface RenderedExport {
  container: HTMLElement;
  cleanup: () => void;
}

export class ExportRenderService {
  private chart: Chart | null = null;

  /**
   * Crée un conteneur DOM propre pour l'export
   * Sans glassmorphism - utilise des gradients solides
   */
  async render(options: ExportRenderOptions): Promise<RenderedExport> {
    const { mode, player, comparePlayer, metrics, view } = options;

    // Dimensions selon le mode
    const dimensions = mode === 'social' 
      ? { width: 1080, height: 1080 }
      : { width: 1200, height: 800 };

    // Créer le conteneur principal
    const container = document.createElement('div');
    container.className = `export-render-container mode-${mode}`;
    container.style.cssText = this.getContainerStyles(dimensions);
    // @ts-ignore - used by renderRadarChart
    container.dataset.mode = mode;

    // Structure selon le mode
    if (mode === 'social') {
      container.innerHTML = this.getSocialLayout(player, metrics);
    } else {
      container.innerHTML = this.getSoloLayout(player, comparePlayer, view, metrics);
    }

    // Ajouter au DOM temporairement pour rendre le canvas
    document.body.appendChild(container);

    // Créer le radar chart
    await this.renderRadarChart(container, options);

    return {
      container,
      cleanup: () => {
        this.destroyChart();
        container.remove();
      }
    };
  }

  /**
   * Layout pour export Social (carré 1080x1080)
   */
  private getSocialLayout(player: Player, metrics: MetricConfig[]): string {
    return `
      <div class="export-social-wrapper">
        <div class="export-social-header">
          <div class="export-league-badge">${player.league || 'PRO LEAGUE'}</div>
          <h1 class="export-player-name">${player.name}</h1>
          <p class="export-player-info">${player.team} • ${player.role}</p>
        </div>
        
        <div class="export-radar-wrapper" style="width: 700px; height: 600px; display: flex; align-items: center; justify-content: center;">
          <canvas id="export-radar-canvas"></canvas>
        </div>
        
        <div class="export-metrics-grid">
          ${this.renderMetricPills(metrics.slice(0, 6))}
        </div>
        
        <div class="export-social-footer">
          <div class="export-watermark">
            <span class="export-brand">@LeagueScoutHugo</span>
            <span class="export-separator">|</span>
            <span class="export-powered">KONOHA</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Layout pour export Solo (1200x800)
   */
  private getSoloLayout(
    player: Player, 
    comparePlayer: Player | undefined,
    view: RadarViewMode,
    _metrics: MetricConfig[]
  ): string {
    const isCompare = view === 'compare' && comparePlayer;
    
    return `
      <div class="export-solo-wrapper">
        <div class="export-solo-header">
          <div class="export-title-group">
            <h1 class="export-main-title">${player.name}</h1>
            <p class="export-subtitle">${player.team} • ${player.role}</p>
          </div>
          ${isCompare ? `
            <div class="export-vs-badge">VS</div>
            <div class="export-title-group compare">
              <h1 class="export-main-title">${comparePlayer.name}</h1>
              <p class="export-subtitle">${comparePlayer.team} • ${comparePlayer.role}</p>
            </div>
          ` : ''}
        </div>
        
        <div class="export-radar-wrapper" style="width: 600px; height: 500px; display: flex; align-items: center; justify-content: center;">
          <canvas id="export-radar-canvas"></canvas>
        </div>
        
        <div class="export-solo-footer">
          <div class="export-watermark">
            <span class="export-context">${player.league || 'KONOHA'} Stats</span>
            <span class="export-separator">|</span>
            <span class="export-brand">@LeagueScoutHugo | KONOHA</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Rendu des pills de métriques pour le mode social
   */
  private renderMetricPills(metrics: MetricConfig[]): string {
    const categoryColors: Record<string, string> = {
      combat: '#FF6B6B',
      vision: '#4ECDC4',
      farming: '#FFD93D',
      early: '#A855F7',
      economy: '#00E676'
    };

    return metrics.map(m => `
      <div class="export-metric-pill" style="border-color: ${categoryColors[m.category] || '#4ECDC4'}">
        <span class="pill-icon">${m.icon || '📊'}</span>
        <span class="pill-name">${m.name}</span>
      </div>
    `).join('');
  }

  /**
   * Rendu du radar chart dans le canvas d'export
   * Utilise une approche hybride: Chart.js rend dans un canvas séparé,
   * puis on convertit en image data URL pour l'intégrer dans le DOM d'export
   */
  private async renderRadarChart(container: HTMLElement, options: ExportRenderOptions): Promise<void> {
    const { player, comparePlayer, metrics, view, getNormalizedValue, getGrade } = options;
    
    const isSocial = options.mode === 'social';
    const width = isSocial ? 700 : 600;
    const height = isSocial ? 600 : 500;
    
    // Créer un canvas temporaire hors DOM pour Chart.js
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width * 2; // Haute résolution
    tempCanvas.height = height * 2;
    
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Préparer les données
    const playerData = metrics.map(m => getNormalizedValue(player, m));
    const playerGrades = metrics.map(m => {
      const normalized = getNormalizedValue(player, m);
      return getGrade(normalized);
    });

    const datasets: any[] = [{
      label: player.name,
      data: playerData,
      backgroundColor: 'rgba(78, 205, 196, 0.25)',
      borderColor: '#4ECDC4',
      borderWidth: 4,
      pointBackgroundColor: playerGrades.map(g => this.getGradeColor(g)),
      pointBorderColor: '#fff',
      pointRadius: 10,
      pointHoverRadius: 12,
      pointBorderWidth: 2,
      fill: true
    }];

    // Ajouter le joueur comparé si mode compare
    if (view === 'compare' && comparePlayer) {
      const compareData = metrics.map(m => getNormalizedValue(comparePlayer, m));
      const compareGrades = metrics.map(m => {
        const normalized = getNormalizedValue(comparePlayer, m);
        return getGrade(normalized);
      });

      datasets.push({
        label: comparePlayer.name,
        data: compareData,
        backgroundColor: 'rgba(255, 107, 107, 0.25)',
        borderColor: '#FF6B6B',
        borderWidth: 4,
        pointBackgroundColor: compareGrades.map(g => this.getGradeColor(g)),
        pointBorderColor: '#fff',
        pointRadius: 10,
        pointHoverRadius: 12,
        pointBorderWidth: 2,
        fill: true
      });
    }

    // Créer le chart
    this.chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: metrics.map(m => m.name),
        datasets
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            display: view === 'compare',
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.95)',
              font: { family: 'Space Grotesk', size: 16, weight: 'bold' },
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: { enabled: false }
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            grid: {
              color: 'rgba(255, 255, 255, 0.2)',
              circular: true,
              lineWidth: 2
            },
            angleLines: {
              color: 'rgba(255, 255, 255, 0.25)',
              lineWidth: 2
            },
            pointLabels: {
              color: 'rgba(255, 255, 255, 0.95)',
              font: { 
                family: 'Space Grotesk', 
                size: isSocial ? 18 : 16,
                weight: 'bold'
              },
              backdropColor: 'transparent',
              padding: 20
            },
            ticks: { display: false }
          }
        },
        layout: {
          padding: 20
        }
      }
    });

    // Attendre le rendu complet
    await new Promise(resolve => setTimeout(resolve, 300));

    // Convertir le canvas en image
    const dataUrl = tempCanvas.toDataURL('image/png', 1.0);
    
    // Insérer l'image dans le container d'export
    const radarWrapper = container.querySelector('.export-radar-wrapper');
    if (radarWrapper) {
      radarWrapper.innerHTML = `<img src="${dataUrl}" style="width: ${width}px; height: ${height}px; object-fit: contain;" />`;
    }
    
    // Nettoyer le chart temporaire
    this.chart.destroy();
    this.chart = null;
  }

  /**
   * Styles CSS pour le conteneur d'export
   */
  private getContainerStyles(dimensions: { width: number; height: number }): string {
    return `
      position: fixed;
      left: -9999px;
      top: 0;
      width: ${dimensions.width}px;
      height: ${dimensions.height}px;
      background: linear-gradient(135deg, #0a0a0f 0%, #12121a 40%, #1a1a25 100%);
      font-family: 'Space Grotesk', sans-serif;
      overflow: hidden;
      box-sizing: border-box;
    `;
  }

  private getGradeColor(grade: string): string {
    const colors: Record<string, string> = {
      'S': '#00D9C0',
      'A': '#4ADE80',
      'B': '#FACC15',
      'C': '#FB923C'
    };
    return colors[grade] || '#FB923C';
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  /**
   * Injecte les styles CSS nécessaires pour l'export
   */
  static injectStyles(): void {
    if (document.getElementById('export-render-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'export-render-styles';
    styles.textContent = `
      /* ==================== EXPORT RENDER STYLES ==================== */
      /* Ces styles sont utilisés UNIQUEMENT pour l'export PNG */
      /* Pas de backdrop-filter ici - html2canvas ne le supporte pas */

      /* --- Layout Social (1080x1080) --- */
      .export-social-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 60px;
        box-sizing: border-box;
        background: linear-gradient(180deg, #0a0a0f 0%, #12121a 50%, #1a1a25 100%);
      }

      .export-social-header {
        text-align: center;
      }

      .export-league-badge {
        display: inline-block;
        padding: 8px 20px;
        background: linear-gradient(135deg, #4ECDC4 0%, #2dd4bf 100%);
        color: #0a0a0f;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 2px;
        border-radius: 20px;
        margin-bottom: 20px;
      }

      .export-player-name {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 56px;
        font-weight: 800;
        color: #ffffff;
        margin: 0 0 12px 0;
        text-shadow: 0 2px 20px rgba(78, 205, 196, 0.3);
      }

      .export-player-info {
        font-family: 'Inter', sans-serif;
        font-size: 22px;
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
      }

      .export-radar-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
      }
      
      .export-radar-wrapper img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      #export-radar-canvas {
        max-width: 100%;
        max-height: 100%;
      }

      .export-metrics-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 12px;
        max-width: 800px;
      }

      .export-metric-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        background: rgba(255, 255, 255, 0.08);
        border: 2px solid;
        border-radius: 25px;
      }

      .pill-icon {
        font-size: 16px;
      }

      .pill-name {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: #ffffff;
      }

      .export-social-footer {
        text-align: center;
      }

      /* --- Layout Solo (1200x800) --- */
      .export-solo-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 50px 60px;
        box-sizing: border-box;
        background: linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #1a1a25 100%);
      }

      .export-solo-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 40px;
        width: 100%;
      }

      .export-title-group {
        text-align: center;
      }

      .export-title-group.compare {
        opacity: 0.9;
      }

      .export-main-title {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 42px;
        font-weight: 700;
        color: #ffffff;
        margin: 0 0 8px 0;
      }

      .export-title-group.compare .export-main-title {
        color: #FF6B6B;
      }

      .export-subtitle {
        font-family: 'Inter', sans-serif;
        font-size: 18px;
        color: rgba(255, 255, 255, 0.6);
        margin: 0;
      }

      .export-vs-badge {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 20px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.8);
      }

      .export-solo-footer {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        width: 100%;
      }

      /* --- Watermark commun --- */
      .export-watermark {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 14px;
      }

      .export-context {
        color: rgba(255, 255, 255, 0.5);
      }

      .export-separator {
        color: rgba(255, 255, 255, 0.3);
      }

      .export-brand {
        color: #4ECDC4;
        font-weight: 600;
      }

      .export-powered {
        color: rgba(255, 255, 255, 0.6);
        font-weight: 600;
        letter-spacing: 1px;
      }
    `;

    document.head.appendChild(styles);
  }
}
