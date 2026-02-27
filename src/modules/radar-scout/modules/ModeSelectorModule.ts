// ModeSelectorModule.ts - BMAD Pattern
// @ts-nocheck
import type { BMADModule } from '../core/types';

export class ModeSelectorModule implements BMADModule {
  readonly id = 'mode-selector';
  private container: HTMLElement | null = null;
  private coordinator: any = null;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    container.innerHTML = `
      <div class="v4-mode-list">
        <button class="v4-mode-item active" data-mode="solo">
          <span class="v4-mode-icon">👤</span>
          <span class="v4-mode-text">
            <span class="v4-mode-name">Individuel</span>
            <span class="v4-mode-desc">Analyse détaillée</span>
          </span>
        </button>
        <button class="v4-mode-item" data-mode="compare">
          <span class="v4-mode-icon">⚔️</span>
          <span class="v4-mode-text">
            <span class="v4-mode-name">Comparaison</span>
            <span class="v4-mode-desc">2 joueurs</span>
          </span>
        </button>
        <button class="v4-mode-item" data-mode="benchmark">
          <span class="v4-mode-icon">📊</span>
          <span class="v4-mode-text">
            <span class="v4-mode-name">Benchmark</span>
            <span class="v4-mode-desc">vs moyenne</span>
          </span>
        </button>
      </div>
    `;

    container.querySelectorAll('.v4-mode-item').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleModeClick(e));
    });
  }

  update(state: any): void {
    // Mettre à jour l'UI active
    this.container?.querySelectorAll('.v4-mode-item').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.mode === state.mode);
    });
  }

  private handleModeClick(e: Event): void {
    const btn = e.currentTarget as HTMLElement;
    const mode = btn.dataset.mode;
    
    this.container?.querySelectorAll('.v4-mode-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    this.coordinator.setState('mode', mode);
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
