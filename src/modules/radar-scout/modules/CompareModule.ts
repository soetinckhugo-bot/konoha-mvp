/**
 * CompareModule - Module BMAD comparaison
 */

import type { BMADModule, RenderContext } from '../../../core/types/bmad';
import { PercentileService } from '../services/PercentileService';
import { GradeService } from '../services/GradeService';
import { PlayerFilterService } from '../services/PlayerFilterService';

export class CompareModule implements BMADModule {
  readonly id = 'compare';
  private container: HTMLElement | null = null;
  
  constructor(
    private _percentileService: PercentileService,
    private _gradeService: GradeService,
    private _playerFilterService: PlayerFilterService
  ) {}
  
  init(): void {
    console.log('[CompareModule] Initialized');
  }
  
  render(container: HTMLElement): void {
    this.container = container;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'compare-module';
    wrapper.innerHTML = `
      <h2>Mode Comparaison</h2>
      <p>Comparez 2 joueurs</p>
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
