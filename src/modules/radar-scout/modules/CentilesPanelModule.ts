/**
 * CentilesPanelModule - Module BMAD panneaux centiles
 */

import type { BMADModule, RenderContext } from '../../../core/types/bmad';
import { PercentileService } from '../services/PercentileService';
import { GradeService } from '../services/GradeService';

export class CentilesPanelModule implements BMADModule {
  readonly id = 'centiles-panel';
  private container: HTMLElement | null = null;
  
  constructor(
    private _percentileService: PercentileService,
    private _gradeService: GradeService
  ) {}
  
  init(): void {
    console.log('[CentilesPanelModule] Initialized');
  }
  
  render(container: HTMLElement): void {
    this.container = container;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'centiles-panel';
    wrapper.innerHTML = `
      <h3>Analyse Centiles</h3>
      <div class="categories">Fight / Vision / Resources</div>
    `;
    
    container.appendChild(wrapper);
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
