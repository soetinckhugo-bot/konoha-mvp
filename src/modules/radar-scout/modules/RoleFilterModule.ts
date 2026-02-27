// RoleFilterModule.ts - Design exact comme les screenshots
// @ts-nocheck
import type { BMADModule } from '../core/types';
import { getMetricsForRole } from '../config/metrics.config';

export class RoleFilterModule implements BMADModule {
  readonly id = 'role-filter';
  private container: HTMLElement | null = null;
  private coordinator: any = null;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    container.innerHTML = `
      <div class="roles-header">
        <span class="header-icon">${this.getGridIcon()}</span>
        <span class="roles-title">Roles</span>
      </div>
      <div class="roles-grid">
        <button class="role-btn active" data-role="ALL">
          <span class="role-icon-all">✦</span>
          <span class="role-label">ALL</span>
        </button>
        <button class="role-btn" data-role="TOP">
          <span class="role-icon">${this.getShieldIcon()}</span>
          <span class="role-label">TOP</span>
        </button>
        <button class="role-btn" data-role="JUNGLE">
          <span class="role-icon">${this.getTreeIcon()}</span>
          <span class="role-label">JGL</span>
        </button>
        <button class="role-btn" data-role="MID">
          <span class="role-icon">${this.getZapIcon()}</span>
          <span class="role-label">MID</span>
        </button>
        <button class="role-btn" data-role="ADC">
          <span class="role-icon">${this.getCrosshairIcon()}</span>
          <span class="role-label">ADC</span>
        </button>
        <button class="role-btn" data-role="SUPPORT">
          <span class="role-icon">${this.getHeartIcon()}</span>
          <span class="role-label">SUP</span>
        </button>
      </div>
      <style>
        .roles-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .header-icon {
          width: 20px;
          height: 20px;
          color: var(--v4-text-muted);
        }
        .roles-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--v4-text);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .roles-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
        }
        .role-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 4px;
          background: var(--v4-bg-input);
          border: 2px solid transparent;
          border-radius: 10px;
          color: var(--v4-text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .role-btn:hover {
          background: var(--v4-bg-hover);
          color: var(--v4-text);
          transform: translateY(-2px);
        }
        .role-btn.active {
          background: var(--v4-accent);
          border-color: var(--v4-accent);
          color: #000;
          box-shadow: 0 0 20px var(--role-glow, transparent);
        }
        .role-icon {
          width: 20px;
          height: 20px;
        }
        .role-icon-all {
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
        }
        .role-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
      </style>
    `;

    container.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleRoleClick(e));
    });
  }

  private getGridIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
  }
  private getShieldIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  }
  private getTreeIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 19h8M10 19v-4a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v4"/><path d="M12 12V8a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-3"/></svg>`;
  }
  private getZapIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
  }
  private getCrosshairIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
  }
  private getHeartIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  }

  update(state: any): void {
    this.container?.querySelectorAll('.role-btn').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.role === state.currentRole);
    });
  }

  private handleRoleClick(e: Event): void {
    const btn = e.currentTarget as HTMLElement;
    const role = btn.dataset.role;
    
    this.container?.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelector('.v4-layout')?.setAttribute('data-role', role || 'ALL');
    
    // 🔥 Toutes les métriques du rôle sélectionné
    const roleMetrics = getMetricsForRole(role || 'ALL');
    const allMetricIds = roleMetrics.map(m => m.id);
    
    this.coordinator.setState('currentRole', role);
    this.coordinator.setState('selectedMetrics', allMetricIds);
    
    // Chercher un joueur avec ce rôle si pas en ALL
    if (role !== 'ALL') {
      const state = this.coordinator.getState();
      const players = state.players || [];
      const playerWithRole = players.find((p: any) => p.role === role);
      if (playerWithRole && state.selectedPlayer?.role !== role) {
        this.coordinator.setState('selectedPlayer', playerWithRole);
      }
    }
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
