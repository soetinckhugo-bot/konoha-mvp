// LeaderboardModule.ts - BMAD Pattern
// @ts-nocheck
import type { BMADModule } from '../core/types';

export class LeaderboardModule implements BMADModule {
  readonly id = 'leaderboard';
  private container: HTMLElement | null = null;
  private coordinator: any = null;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    container.innerHTML = `
      <div class="v4-card-header compact">
        <span class="v4-header-icon">🏆</span>
        <span class="v4-header-title">Classement</span>
        <span class="v4-player-count-badge" id="leaderboard-count">0</span>
      </div>
      <div class="v4-card-body v4-card-body-scroll" id="leaderboard-list">
        <div class="v4-leaderboard-empty">Aucun joueur</div>
      </div>
    `;

    this.update(coordinator.getState());
  }

  update(state: any): void {
    const players = this.filterPlayersByRole(state.players, state.currentRole);
    this.renderLeaderboard(players, state.selectedPlayer);
  }

  private filterPlayersByRole(players: any[], role: string): any[] {
    if (!players) return [];
    if (role === 'ALL' || !role) return players;
    return players.filter(p => p.role === role);
  }

  private renderLeaderboard(players: any[], selectedPlayer: any): void {
    const list = this.container?.querySelector('#leaderboard-list');
    const count = this.container?.querySelector('#leaderboard-count');

    if (!list) return;
    if (count) count.textContent = String(players.length);

    if (players.length === 0) {
      list.innerHTML = '<div class="v4-leaderboard-empty">Aucun joueur</div>';
      return;
    }

    // Sort by KDA
    const sorted = [...players].sort((a, b) => (b.stats?.kda || 0) - (a.stats?.kda || 0));

    list.innerHTML = sorted.slice(0, 12).map((p, i) => `
      <div class="v4-leaderboard-item ${p.id === selectedPlayer?.id ? 'active' : ''}" data-player-id="${p.id}">
        <span class="v4-rank ${i < 3 ? 'top3' : 'other'}">${i + 1}</span>
        <div class="v4-leaderboard-info">
          <div class="v4-leaderboard-name">${p.name}</div>
          <div class="v4-leaderboard-team">${p.team || 'N/A'}</div>
        </div>
        <span class="v4-leaderboard-score">${(p.stats?.kda || 0).toFixed(1)}</span>
      </div>
    `).join('');

    // Click handlers
    list.querySelectorAll('.v4-leaderboard-item').forEach(item => {
      item.addEventListener('click', () => {
        const playerId = (item as HTMLElement).dataset.playerId;
        const players = this.coordinator.getState().players;
        const player = players.find((p: any) => p.id === playerId);
        if (player) {
          this.coordinator.setState('selectedPlayer', player);
        }
      });
    });
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
