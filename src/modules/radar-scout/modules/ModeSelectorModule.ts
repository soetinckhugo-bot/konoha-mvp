// ModeSelectorModule.ts - BMAD Pattern avec icônes SVG
// @ts-nocheck
import type { BMADModule } from '../core/types';
import { Icons } from '../design/Icons';

export class ModeSelectorModule implements BMADModule {
  readonly id = 'mode-selector';
  private container: HTMLElement | null = null;
  private coordinator: any = null;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    container.innerHTML = `
      <div class="mode-list">
        <button class="mode-item active" data-mode="solo">
          <span class="mode-icon">${Icons.userCheck}</span>
          <span class="mode-text">
            <span class="mode-name">Individuel</span>
            <span class="mode-desc">Analyse détaillée</span>
          </span>
        </button>
        <button class="mode-item" data-mode="compare">
          <span class="mode-icon">${Icons.sword}</span>
          <span class="mode-text">
            <span class="mode-name">Comparaison</span>
            <span class="mode-desc">2 joueurs</span>
          </span>
        </button>
        <button class="mode-item" data-mode="benchmark">
          <span class="mode-icon">${Icons.barChart}</span>
          <span class="mode-text">
            <span class="mode-name">Benchmark</span>
            <span class="mode-desc">vs moyenne</span>
          </span>
        </button>
      </div>
      <style>
        .mode-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mode-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
          background: transparent;
          border: 1px solid var(--v4-border);
          border-radius: 10px;
          color: var(--v4-text);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }
        .mode-item:hover {
          background: var(--v4-bg-hover);
          border-color: var(--v4-border-visible);
          transform: translateX(4px);
        }
        .mode-item.active {
          background: var(--role-glow, rgba(5, 170, 206, 0.15));
          border-color: var(--v4-accent);
          box-shadow: 0 0 20px var(--role-glow, transparent), inset 0 0 20px var(--role-glow, transparent);
        }
        .mode-icon {
          width: 20px;
          height: 20px;
          color: var(--v4-accent);
          flex-shrink: 0;
        }
        .mode-text {
          display: flex;
          flex-direction: column;
        }
        .mode-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--v4-text);
        }
        .mode-desc {
          font-size: 11px;
          color: var(--v4-text-muted);
        }
      </style>
    `;

    container.querySelectorAll('.mode-item').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleModeClick(e));
    });
  }

  update(state: any): void {
    this.container?.querySelectorAll('.mode-item').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.mode === state.mode);
    });
  }

  private handleModeClick(e: Event): void {
    const btn = e.currentTarget as HTMLElement;
    const mode = btn.dataset.mode;
    
    this.container?.querySelectorAll('.mode-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    this.coordinator.setState('mode', mode);
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
