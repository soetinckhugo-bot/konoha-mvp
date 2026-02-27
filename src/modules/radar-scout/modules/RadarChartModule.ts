/**
 * RadarChartModule - Module BMAD de graphique radar
 * 
 * Responsabilité : Afficher le radar Chart.js des statistiques
 */

import { IBaseModule, IModuleContext, Player } from '../../../core/types/bmad';
import { PercentileService } from '../services/PercentileService';
import { GradeService } from '../services/GradeService';
import { ExportService } from '../services/ExportService';

export interface RadarChartConfig {
  showExport?: boolean;
  showGrades?: boolean;
  animation?: boolean;
  metrics?: string[];
}

export class RadarChartModule implements IBaseModule {
  readonly id = 'radar-chart';
  
  private context: IModuleContext | null = null;
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: RadarChartConfig;
  private animationId: number | null = null;
  
  private unsubscribers: (() => void)[] = [];

  constructor(
    private percentileService: PercentileService,
    private gradeService: GradeService,
    config: RadarChartConfig = {}
  ) {
    this.config = {
      showExport: true,
      showGrades: true,
      animation: true,
      metrics: ['kda', 'kp', 'cspm', 'dpm', 'visionScore'],
      ...config
    };
  }

  render(context: IModuleContext): void {
    this.context = context;
    this.container = this.createContainer(context.container);
    
    this.renderChart();
    this.renderControls();
    
    // Subscribe
    this.unsubscribers.push(
      context.store.subscribe('selectedPlayer', () => this.updateChart()),
      context.store.subscribe('selectedMetricIds', () => this.updateChart())
    );
    
    // Initial draw
    this.drawRadar();
  }

  update(context: IModuleContext): void {
    this.context = context;
    this.updateChart();
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.context = null;
  }

  private createContainer(parent: HTMLElement): HTMLElement {
    const container = document.createElement('div');
    container.className = 'bmad-radar-chart-module';
    container.setAttribute('data-module-id', this.id);
    parent.appendChild(container);
    return container;
  }

  private renderChart(): void {
    if (!this.container) return;
    
    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'radar-chart-wrapper';
    
    // Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'radar-canvas';
    this.canvas.width = 400;
    this.canvas.height = 400;
    
    this.ctx = this.canvas.getContext('2d');
    wrapper.appendChild(this.canvas);
    
    this.container.appendChild(wrapper);
  }

  private renderControls(): void {
    if (!this.container || !this.config.showExport) return;
    
    const controls = document.createElement('div');
    controls.className = 'radar-controls';
    
    const exportBtn = document.createElement('button');
    exportBtn.className = 'radar-export-btn';
    exportBtn.innerHTML = '📥 Export PNG';
    exportBtn.addEventListener('click', () => this.handleExport());
    
    controls.appendChild(exportBtn);
    this.container.appendChild(controls);
  }

  private updateChart(): void {
    if (this.config.animation) {
      this.animateChart();
    } else {
      this.drawRadar();
    }
  }

  private animateChart(): void {
    let progress = 0;
    const duration = 500; // ms
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      progress = Math.min(elapsed / duration, 1);
      
      // Easing
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      this.drawRadar(easeProgress);
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
  }

  private drawRadar(progress: number = 1): void {
    if (!this.ctx || !this.canvas || !this.context) return;
    
    const player = this.context.store.getState<Player>('selectedPlayer');
    if (!player) {
      this.drawEmptyState();
      return;
    }
    
    const metrics = this.config.metrics || [];
    const allPlayers = this.context.store.getState<Player[]>('players') || [];
    
    const ctx = this.ctx;
    const canvas = this.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = 'rgba(18, 18, 26, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    this.drawGrid(ctx, centerX, centerY, radius, metrics.length);
    
    // Draw data
    this.drawData(ctx, centerX, centerY, radius, player, metrics, allPlayers, progress);
    
    // Draw labels
    this.drawLabels(ctx, centerX, centerY, radius, metrics);
    
    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, centerX, 30);
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    numAxes: number
  ): void {
    // Cercles concentriques
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 5) * i, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Axes
    for (let i = 0; i < numAxes; i++) {
      const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      ctx.stroke();
    }
  }

  private drawData(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    player: Player,
    metrics: string[],
    allPlayers: Player[],
    progress: number
  ): void {
    const points: { x: number; y: number }[] = [];
    
    metrics.forEach((metric, i) => {
      const value = player.stats[metric] || 0;
      const allValues = allPlayers.map(p => p.stats[metric]).filter((v): v is number => v !== undefined);
      
      const percentile = this.percentileService.calculatePercentile(
        value,
        metric,
        allPlayers,
        this.percentileService.isInvertedMetric(metric)
      );
      
      const angle = (Math.PI * 2 / metrics.length) * i - Math.PI / 2;
      const normalizedValue = (percentile / 100) * progress;
      const distance = normalizedValue * radius;
      
      points.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance
      });
    });
    
    // Draw fill
    ctx.beginPath();
    points.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.closePath();
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(96, 165, 250, 0.4)');
    gradient.addColorStop(1, 'rgba(96, 165, 250, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw stroke
    ctx.strokeStyle = '#60A5FA';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw points
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  private drawLabels(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    metrics: string[]
  ): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    metrics.forEach((metric, i) => {
      const angle = (Math.PI * 2 / metrics.length) * i - Math.PI / 2;
      const labelRadius = radius + 25;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;
      
      ctx.fillText(metric.toUpperCase(), x, y);
    });
  }

  private drawEmptyState(): void {
    if (!this.ctx || !this.canvas) return;
    
    const ctx = this.ctx;
    const canvas = this.canvas;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(18, 18, 26, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('Sélectionnez un joueur', canvas.width / 2, canvas.height / 2);
  }

  private async handleExport(): Promise<void> {
    if (!this.container) return;
    
    try {
      const blob = await ExportService.exportToPNG(this.container, {
        filename: `radar-${Date.now()}.png`
      });
      ExportService.downloadBlob(blob, `radar-${Date.now()}.png`);
    } catch (error) {
      console.error('[RadarChartModule] Export failed:', error);
    }
  }
}
