// PlayerSelectModule.ts - BMAD Pattern avec icônes SVG
// @ts-nocheck
import type { BMADModule } from '../core/types';
import { Icons } from '../design/Icons';

export class PlayerSelectModule implements BMADModule {
  readonly id = 'player-select';
  private container: HTMLElement | null = null;
  private coordinator: any = null;
  private select: HTMLSelectElement | null = null;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    container.innerHTML = `
      <div class="v4-select-wrapper">
        <span class="select-icon">${Icons.user}</span>
        <select id="player-select-input" class="v4-select">
          <option value="">Choisir un joueur...</option>
        </select>
        <span class="chevron">${Icons.chevronDown}</span>
      </div>
      <div id="player-select-info" class="player-info-card" style="display:none;">
        <div class="player-meta">
          <span id="player-select-role" class="role-badge"></span>
          <span id="player-select-team" class="team-badge"></span>
        </div>
      </div>
      <style>
        .v4-select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .select-icon {
          position: absolute;
          left: 12px;
          width: 16px;
          height: 16px;
          color: var(--v4-text-muted);
          z-index: 1;
        }
        .chevron {
          position: absolute;
          right: 12px;
          width: 16px;
          height: 16px;
          color: var(--v4-text-muted);
          pointer-events: none;
        }
        .v4-select {
          width: 100%;
          padding: 10px 36px 10px 36px;
          background: var(--v4-bg-input);
          border: 1px solid var(--v4-border);
          border-radius: 8px;
          color: var(--v4-text);
          font-size: 13px;
          cursor: pointer;
          appearance: none;
          transition: all 0.2s ease;
        }
        .v4-select:hover, .v4-select:focus {
          border-color: var(--v4-accent);
          outline: none;
        }
        .player-info-card {
          margin-top: 12px;
          padding: 12px;
          background: var(--v4-bg-input);
          border-radius: 8px;
          border: 1px solid var(--v4-border);
          animation: slideDown 0.3s ease;
        }
        .player-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .role-badge {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          background: var(--v4-accent);
          color: #000;
        }
        .team-badge {
          font-size: 12px;
          color: var(--v4-text-muted);
          font-weight: 500;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    `;

    this.select = container.querySelector('#player-select-input') as HTMLSelectElement;
    this.select?.addEventListener('change', (e) => this.handlePlayerChange(e));

    this.update(coordinator.getState());
  }

  update(state: any): void {
    if (state.players && this.select) {
      this.populateOptions(state.players);
    }
    if (state.selectedPlayer) {
      this.updatePlayerInfo(state.selectedPlayer);
    }
  }

  private populateOptions(players: any[]): void {
    if (!this.select) return;
    const currentValue = this.select.value;
    this.select.innerHTML = '<option value="">Choisir un joueur...</option>' +
      players.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    if (currentValue) {
      this.select.value = currentValue;
    }
  }

  private handlePlayerChange(e: Event): void {
    const playerId = (e.target as HTMLSelectElement).value;
    const players = this.coordinator.getState().players;
    const player = players.find((p: any) => p.id === playerId);
    
    this.coordinator.setState('selectedPlayer', player || null);
    if (player) {
      this.updatePlayerInfo(player);
    }
  }

  private updatePlayerInfo(player: any): void {
    const info = this.container?.querySelector('#player-select-info');
    const roleTag = this.container?.querySelector('#player-select-role');
    const teamTag = this.container?.querySelector('#player-select-team');

    if (!player) {
      info?.setAttribute('style', 'display:none;');
      return;
    }

    info?.setAttribute('style', 'display:block;');
    if (roleTag) {
      roleTag.textContent = player.role;
      roleTag.className = `role-badge role-${player.role.toLowerCase()}`;
    }
    if (teamTag) teamTag.textContent = player.team || 'No Team';
  }

  destroy(): void {
    this.select?.removeEventListener('change', this.handlePlayerChange);
    this.container = null;
    this.coordinator = null;
  }
}
