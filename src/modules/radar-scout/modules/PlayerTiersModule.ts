// PlayerTiersModule.ts - Légende des Tiers sous le leaderboard
// @ts-nocheck
import type { BMADModule } from '../core/types';

export class PlayerTiersModule implements BMADModule {
  readonly id = 'player-tiers';
  private container: HTMLElement | null = null;
  private coordinator: any = null;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    container.innerHTML = `
      <div class="tiers-container">
        <div class="tiers-header">
          <span class="tiers-icon">${this.getTiersIcon()}</span>
          <span class="tiers-title">PLAYER TIERS</span>
        </div>
        <div class="tiers-grid">
          <div class="tier-item">
            <span class="tier-badge tier-S">S</span>
            <span class="tier-label">Elite</span>
            <span class="tier-range">90-99</span>
          </div>
          <div class="tier-item">
            <span class="tier-badge tier-A">A</span>
            <span class="tier-label">Excellent</span>
            <span class="tier-range">75-89</span>
          </div>
          <div class="tier-item">
            <span class="tier-badge tier-B">B</span>
            <span class="tier-label">Good</span>
            <span class="tier-range">50-74</span>
          </div>
          <div class="tier-item">
            <span class="tier-badge tier-C">C</span>
            <span class="tier-label">Average</span>
            <span class="tier-range">25-49</span>
          </div>
          <div class="tier-item">
            <span class="tier-badge tier-D">D</span>
            <span class="tier-label">Weak</span>
            <span class="tier-range">&lt;25</span>
          </div>
        </div>
      </div>
      <style>
        .tiers-container {
          background: var(--v4-bg-card);
          border: 1px solid var(--v4-border);
          border-radius: 12px;
          padding: 16px;
          margin-top: 12px;
        }
        .tiers-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--v4-border);
        }
        .tiers-icon {
          width: 18px;
          height: 18px;
          color: var(--v4-accent);
        }
        .tiers-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--v4-text);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .tiers-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tier-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px;
          background: var(--v4-bg-input);
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .tier-item:hover {
          transform: translateX(4px);
        }
        .tier-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .tier-S { background: #00D9C0; color: #000; }
        .tier-A { background: #00E676; color: #000; }
        .tier-B { background: #FFD93D; color: #000; }
        .tier-C { background: #FF9F43; color: #000; }
        .tier-D { background: #FF6B6B; color: #fff; }
        .tier-label {
          flex: 1;
          font-size: 13px;
          font-weight: 600;
          color: var(--v4-text);
          text-transform: uppercase;
        }
        .tier-range {
          font-size: 12px;
          font-weight: 700;
          color: var(--v4-text-muted);
          font-family: 'Space Grotesk', monospace;
        }
      </style>
    `;
  }

  private getTiersIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }

  update(state: any): void {
    // Ce module est statique, pas besoin de mise à jour dynamique
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
