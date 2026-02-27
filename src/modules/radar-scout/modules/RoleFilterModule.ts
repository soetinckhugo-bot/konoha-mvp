// RoleFilterModule.ts - Filtre de rôle avec icônes SVG
// @ts-nocheck
import type { BMADModule } from '../core/types';
import { Icons } from '../design/Icons';
import { getMetricsForRole } from '../config/metrics.config';

export class RoleFilterModule implements BMADModule {
  readonly id = 'role-filter';
  private container: HTMLElement | null = null;
  private coordinator: any = null;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    container.innerHTML = `
      <div class="roles-grid">
        <button class="role-btn active" data-role="ALL">
          <span class="role-icon">${Icons.globe}</span>
          <span class="role-label">ALL</span>
        </button>
        <button class="role-btn" data-role="TOP">
          <span class="role-icon">${Icons.shield}</span>
          <span class="role-label">TOP</span>
        </button>
        <button class="role-btn" data-role="JUNGLE">
          <span class="role-icon">${Icons.leaf}</span>
          <span class="role-label">JGL</span>
        </button>
        <button class="role-btn" data-role="MID">
          <span class="role-icon">${Icons.zap}</span>
          <span class="role-label">MID</span>
        </button>
        <button class="role-btn" data-role="ADC">
          <span class="role-icon">${Icons.bow}</span>
          <span class="role-label">ADC</span>
        </button>
        <button class="role-btn" data-role="SUPPORT">
          <span class="role-icon">${Icons.heart}</span>
          <span class="role-label">SUP</span>
        </button>
      </div>
      <style>
        .roles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
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
          border: 1px solid var(--v4-border);
          border-radius: 8px;
          color: var(--v4-text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .role-btn:hover {
          background: var(--v4-bg-hover);
          border-color: var(--v4-border-visible);
          color: var(--v4-text);
          transform: translateY(-2px);
        }
        .role-btn.active {
          background: var(--v4-accent);
          border-color: var(--v4-accent);
          color: #000;
          box-shadow: 0 0 20px var(--role-glow, transparent), 0 4px 14px rgba(0, 0, 0, 0.4);
        }
        .role-icon {
          width: 20px;
          height: 20px;
        }
        .role-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
      </style>
    `;

    container.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleRoleClick(e));
    });
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
    
    const roleMetrics = getMetricsForRole(role || 'TOP');
    const defaultMetrics = roleMetrics.map(m => m.id);
    
    this.coordinator.setState('currentRole', role);
    this.coordinator.setState('selectedMetrics', defaultMetrics);
    
    const state = this.coordinator.getState();
    const selectedPlayer = state.selectedPlayer;
    
    if (selectedPlayer && role !== 'ALL' && selectedPlayer.role !== role) {
      const players = state.players || [];
      const playerWithRole = players.find((p: any) => p.role === role);
      if (playerWithRole) {
        this.coordinator.setState('selectedPlayer', playerWithRole);
      }
    }
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
