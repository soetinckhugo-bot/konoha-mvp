// LexiqueModule.ts - Lexique des métriques avec bouton "?"
// @ts-nocheck
import type { BMADModule } from '../core/types';
import { ALL_METRICS } from '../config/metrics.config';

export class LexiqueModule implements BMADModule {
  readonly id = 'lexique';
  private container: HTMLElement | null = null;
  private coordinator: any = null;
  private isOpen = false;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    container.innerHTML = `
      <button class="lexique-btn" id="lexique-toggle" title="Lexique des métriques">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </button>
      
      <div class="lexique-panel" id="lexique-panel" style="display: none;">
        <div class="lexique-header">
          <span class="lexique-title">Lexique des Métriques</span>
          <button class="lexique-close" id="lexique-close">${this.getCloseIcon()}</button>
        </div>
        <div class="lexique-content">
          ${this.renderMetricsList()}
        </div>
      </div>
      
      <style>
        .lexique-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--v4-accent);
          border: none;
          color: #000;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px var(--role-glow, rgba(5, 170, 206, 0.4));
          transition: all 0.3s ease;
          z-index: 1000;
        }
        .lexique-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 30px var(--role-glow, rgba(5, 170, 206, 0.6));
        }
        .lexique-btn svg {
          width: 24px;
          height: 24px;
        }
        
        .lexique-panel {
          position: fixed;
          bottom: 84px;
          right: 24px;
          width: 360px;
          max-height: 500px;
          background: var(--v4-bg-card);
          border: 1px solid var(--v4-border);
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.8);
          z-index: 999;
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .lexique-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--v4-border);
        }
        .lexique-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--v4-text);
        }
        .lexique-close {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: transparent;
          border: 1px solid var(--v4-border);
          color: var(--v4-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .lexique-close:hover {
          background: var(--v4-bg-hover);
          color: var(--v4-text);
          border-color: var(--v4-accent);
        }
        
        .lexique-content {
          max-height: 400px;
          overflow-y: auto;
          padding: 12px;
        }
        .lexique-content::-webkit-scrollbar {
          width: 6px;
        }
        .lexique-content::-webkit-scrollbar-track {
          background: var(--v4-bg);
          border-radius: 3px;
        }
        .lexique-content::-webkit-scrollbar-thumb {
          background: var(--v4-border);
          border-radius: 3px;
        }
        
        .metric-def {
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 8px;
          background: var(--v4-bg-input);
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }
        .metric-def:hover {
          border-color: var(--v4-border-visible);
        }
        .metric-def-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .metric-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .cat-combat { background: #FF6B6B; }
        .cat-farming { background: #FFD93D; }
        .cat-vision { background: #4ECDC4; }
        .cat-early { background: #A855F7; }
        .cat-economy { background: #22C55E; }
        
        .metric-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--v4-text);
        }
        .metric-fullname {
          font-size: 11px;
          color: var(--v4-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .metric-desc {
          font-size: 13px;
          color: var(--v4-text-secondary);
          line-height: 1.5;
          margin-top: 6px;
        }
        .metric-note {
          font-size: 11px;
          color: var(--v4-accent);
          margin-top: 6px;
          font-style: italic;
        }
        
        @media (max-width: 600px) {
          .lexique-panel {
            right: 12px;
            left: 12px;
            width: auto;
          }
        }
      </style>
    `;

    // Event listeners
    container.querySelector('#lexique-toggle')?.addEventListener('click', () => this.togglePanel());
    container.querySelector('#lexique-close')?.addEventListener('click', () => this.togglePanel());
  }

  private renderMetricsList(): string {
    return ALL_METRICS.map(m => `
      <div class="metric-def">
        <div class="metric-def-header">
          <span class="metric-dot cat-${m.category}"></span>
          <span class="metric-name">${m.label}</span>
        </div>
        <div class="metric-fullname">${m.id.toUpperCase()}</div>
        <div class="metric-desc">${m.description}</div>
        ${m.inverted ? '<div class="metric-note">Inversé: plus bas = meilleur</div>' : ''}
      </div>
    `).join('');
  }

  private getCloseIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  }

  private togglePanel(): void {
    this.isOpen = !this.isOpen;
    const panel = this.container?.querySelector('#lexique-panel') as HTMLElement;
    if (panel) {
      panel.style.display = this.isOpen ? 'block' : 'none';
    }
  }

  update(state: any): void {
    // Rien à mettre à jour dynamiquement
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
