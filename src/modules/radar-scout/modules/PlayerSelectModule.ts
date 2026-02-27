// PlayerSelectModule.ts - BMAD Pattern
// @ts-nocheck
import type { BMADModule } from '../core/types';

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
        <select id="player-select-input" class="v4-select">
          <option value="">Choisir un joueur...</option>
        </select>
      </div>
      <div id="player-select-info" class="player-info" style="display:none;margin-top:12px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span id="player-select-role" class="v4-role-tag"></span>
          <span id="player-select-team" class="v4-team-tag"></span>
        </div>
      </div>
    `;

    this.select = container.querySelector('#player-select-input') as HTMLSelectElement;
    this.select?.addEventListener('change', (e) => this.handlePlayerChange(e));

    // Mettre à jour avec l'état initial
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
      roleTag.className = `v4-role-tag role-${player.role.toLowerCase()}`;
    }
    if (teamTag) {
      teamTag.textContent = player.team || 'No Team';
    }
  }

  destroy(): void {
    this.select?.removeEventListener('change', this.handlePlayerChange);
    this.container = null;
    this.coordinator = null;
  }
}
