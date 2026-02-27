// LeaderboardModule.ts - Design exact comme le screenshot
// @ts-nocheck
import type { BMADModule } from '../core/types';
import { percentileService } from '../services/PercentileService';

export class LeaderboardModule implements BMADModule {
  readonly id = 'leaderboard';
  private container: HTMLElement | null = null;
  private coordinator: any = null;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    // Structure vide initiale - sera remplie par update
    this.renderStructure();
    this.update(coordinator.getState());
  }

  private renderStructure(): void {
    this.container!.innerHTML = `
      <div class="v4-card-header compact">
        <span class="header-icon">${this.getTrophyIcon()}</span>
        <span class="v4-header-title">Leaderboard</span>
        <span class="player-count-badge" id="leaderboard-count">0</span>
      </div>
      <div class="v4-card-body" id="leaderboard-list">
        <div class="leaderboard-empty">Sélectionnez un rôle</div>
      </div>
      <style>
        .header-icon {
          width: 18px;
          height: 18px;
          color: var(--v4-accent);
        }
        .player-count-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          background: #3B82F6;
          border-radius: 12px;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
        }
        .leaderboard-empty {
          text-align: center;
          padding: 40px 20px;
          color: var(--v4-text-muted);
          font-size: 13px;
        }
        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .leaderboard-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .leaderboard-item:hover {
          background: rgba(255,255,255,0.05);
          border-color: var(--v4-border);
        }
        .leaderboard-item.active {
          background: var(--role-glow, rgba(5, 170, 206, 0.15));
          border-color: var(--v4-accent);
        }
        
        /* Rank styling */
        .rank-number {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 14px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .rank-1 {
          background: #FFD700;
          color: #000;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
        }
        .rank-2 {
          background: #C0C0C0;
          color: #000;
        }
        .rank-3 {
          background: #CD7F32;
          color: #fff;
        }
        .rank-other {
          background: rgba(255,255,255,0.1);
          color: var(--v4-text-muted);
          font-weight: 600;
        }
        
        /* Player info */
        .player-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .player-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--v4-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .player-team {
          font-size: 11px;
          color: var(--v4-text-muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        /* Tier badge */
        .tier-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .tier-S { background: #00D9C0; color: #000; }
        .tier-A { background: #00E676; color: #000; }
        .tier-B { background: #FFD93D; color: #000; }
        .tier-C { background: #FF9F43; color: #000; }
        .tier-D { background: #FF6B6B; color: #fff; }
        
        /* Score */
        .score-display {
          text-align: right;
          min-width: 50px;
        }
        .score-value {
          font-size: 16px;
          font-weight: 700;
          color: var(--v4-text);
        }
        .score-label {
          font-size: 9px;
          color: var(--v4-text-muted);
          text-transform: uppercase;
        }
      </style>
    `;
  }

  private getTrophyIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`;
  }

  update(state: any): void {
    const list = this.container?.querySelector('#leaderboard-list');
    const count = this.container?.querySelector('#leaderboard-count');
    
    if (!list) return;

    const currentRole = state.currentRole || 'ALL';
    
    // 🔥 Si ALL, afficher vide
    if (currentRole === 'ALL') {
      if (count) count.textContent = '0';
      list.innerHTML = '<div class="leaderboard-empty">Sélectionnez un rôle spécifique</div>';
      return;
    }

    const players = this.filterPlayersByRole(state.players, currentRole);
    
    if (count) count.textContent = String(players.length);

    if (players.length === 0) {
      list.innerHTML = '<div class="leaderboard-empty">Aucun joueur pour ce rôle</div>';
      return;
    }

    // Calculer les scores pour tous les joueurs
    const playersWithScores = players.map(p => {
      const analysis = percentileService.calculateOverallScore(p, players);
      return { ...p, ...analysis.overall };
    }).sort((a, b) => b.score - a.score);

    list.innerHTML = `<div class="leaderboard-list">
      ${playersWithScores.map((p, index) => this.renderPlayerRow(p, index + 1, state.selectedPlayer?.id === p.id)).join('')}
    </div>`;

    // Click handlers
    list.querySelectorAll('.leaderboard-item').forEach(item => {
      item.addEventListener('click', () => {
        const playerId = (item as HTMLElement).dataset.playerId;
        const player = players.find((p: any) => p.id === playerId);
        if (player) {
          this.coordinator.setState('selectedPlayer', player);
        }
      });
    });
  }

  private renderPlayerRow(player: any, rank: number, isSelected: boolean): string {
    const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
    
    return `
      <div class="leaderboard-item ${isSelected ? 'active' : ''}" data-player-id="${player.id}">
        <span class="rank-number ${rankClass}">${rank}</span>
        <div class="player-info">
          <div class="player-name">${player.name}</div>
          <div class="player-team">${player.team || 'N/A'}</div>
        </div>
        <span class="tier-badge tier-${player.grade}">${player.grade}</span>
        <div class="score-display">
          <div class="score-value">${player.score.toFixed(0)}</div>
          <div class="score-label">score</div>
        </div>
      </div>
    `;
  }

  private filterPlayersByRole(players: any[], role: string): any[] {
    if (!players) return [];
    return players.filter(p => p.role === role);
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
