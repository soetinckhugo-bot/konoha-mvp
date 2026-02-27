/**
 * RadarChartModule - Module BMAD de graphique radar
 */

import type { BMADModule, RenderContext } from '../../../core/types/bmad';
import { PercentileService } from '../services/PercentileService';
import { GradeService } from '../services/GradeService';

export class RadarChartModule implements BMADModule {
  readonly id = 'radar-chart';
  private container: HTMLElement | null = null;
  
  constructor(
    private _percentileService: PercentileService,
    private _gradeService: GradeService
  ) {}
  
  init(): void {
    console.log('[RadarChartModule] Initialized');
  }
  
  render(container: HTMLElement): void {
    this.container = container;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'radar-chart-wrapper';
    
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    canvas.className = 'radar-canvas';
    
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);
    
    // Draw simple radar
    this.drawRadar(canvas);
  }
  
  private drawRadar(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 150;
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 5) * i, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Radar Chart BMAD', centerX, 30);
  }
  
  update(_context: RenderContext): void {
    // Update logic
  }
  
  destroy(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
