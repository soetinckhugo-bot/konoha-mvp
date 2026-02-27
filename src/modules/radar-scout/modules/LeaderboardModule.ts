/**
 * LeaderboardModule - Module BMAD de classement
 * 
 * Responsabilité : Afficher le top 12 des joueurs avec ranking
 * Pattern : Module BMAD avec injection de dépendances
 */

import { IBaseModule, IModuleContext, Player } from '../../../core/types/bmad';
import { PlayerFilterService, RankedPlayer } from '../services/PlayerFilterService';
import { GradeService } from '../services/GradeService';

export interface LeaderboardConfig {
  limit?: number;
  showRank?: boolean;
  showGrade?: boolean;
  showScore?: boolean;
  showTeam?: boolean;
  sortable?: boolean;
}

export class LeaderboardModule implements IBaseModule {
  readonly id = 'leaderboard';
  
  private context: IModuleContext | null = null;
  private container: HTMLElement | null = null;
  private tableBody: HTMLElement | null = null;
  private config: LeaderboardConfig;
  
  private unsubscribers: (() => void)[] = [];

  constructor(
    private playerFilterService: PlayerFilterService,
    private gradeService: GradeService,
    config: LeaderboardConfig = {}
  ) {
    this.config = {
      limit: 12,
      showRank: true,
      showGrade: true,
      showScore: true,
      showTeam: true,
      sortable: true,
      ...config
    };
  }

  render(context: IModuleContext): void {
    this.context = context;
    this.container = this.createContainer(context.container);
    
    this.renderTable();
    
    // Subscribe aux changements
    this.unsubscribers.push(
      context.store.subscribe('currentRole', () => this.handleRoleChange()),
      context.store.subscribe('players', () => this.renderTable()),
      context.store.subscribe('selectedPlayer', () => this.highlightSelected())
    );
  }

  update(context: IModuleContext): void {
    this.context = context;
    
    if (this.tableBody) {
      this.updateRows();
    } else {
      this.renderTable();
    }
  }

  destroy(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    this.container = null;
    this.tableBody = null;
    this.context = null;
  }

  private createContainer(parent: HTMLElement): HTMLElement {
    const container = document.createElement('div');
    container.className = 'bmad-leaderboard-module';
    container.setAttribute('data-module-id', this.id);
    parent.appendChild(container);
    return container;
  }

  private renderTable(): void {
    if (!this.container || !this.context) return;
    
    this.container.innerHTML = '';
    
    // Header
    const header = document.createElement('div');
    header.className = 'leaderboard-header';
    header.innerHTML = `
      <h3>Classement</h3>
      <span class="leaderboard-count">Top ${this.config.limit}</span>
    `;
    this.container.appendChild(header);
    
    // Table
    const table = document.createElement('table');
    table.className = 'leaderboard-table';
    
    // Table header
    const thead = document.createElement('thead');
    thead.innerHTML = this.buildTableHeader();
    table.appendChild(thead);
    
    // Table body
    this.tableBody = document.createElement('tbody');
    this.populateRows();
    table.appendChild(this.tableBody);
    
    this.container.appendChild(table);
  }

  private buildTableHeader(): string {
    const cells = [];
    
    if (this.config.showRank) {
      cells.push('<th class="col-rank">#</th>');
    }
    
    cells.push('<th class="col-player">Joueur</th>');
    
    if (this.config.showTeam) {
      cells.push('<th class="col-team">Équipe</th>');
    }
    
    if (this.config.showScore) {
      cells.push('<th class="col-score">Score</th>');
    }
    
    if (this.config.showGrade) {
      cells.push('<th class="col-grade">Grade</th>');
    }
    
    return `<tr>${cells.join('')}</tr>`;
  }

  private populateRows(): void {
    if (!this.tableBody || !this.context) return;
    
    const players = this.context.store.getState<Player[]>('players') || [];
    const currentRole = this.context.store.getState<string>('currentRole') || 'ALL';
    const selectedPlayer = this.context.store.getState<Player>('selectedPlayer');
    
    // Filtre par rôle
    const filtered = this.playerFilterService.filterByRole(players, currentRole);
    
    // Ranking avec métriques par défaut
    const ranked = this.playerFilterService.rankPlayers(
      filtered,
      players, // all players pour contexte
      ['kda', 'kp', 'cspm', 'dpm', 'visionScore']
    );
    
    // Limite top N
    const topPlayers = ranked.slice(0, this.config.limit);
    
    // Crée les lignes
    topPlayers.forEach((player, index) => {
      const row = this.createRow(player, selectedPlayer?.id === player.id);
      this.tableBody!.appendChild(row);
    });
  }

  private createRow(player: RankedPlayer, isSelected: boolean): HTMLElement {
    const row = document.createElement('tr');
    row.className = 'leaderboard-row';
    if (isSelected) {
      row.classList.add('selected');
    }
    row.setAttribute('data-player-id', player.id);
    
    const cells = [];
    
    if (this.config.showRank) {
      cells.push(`<td class="cell-rank">${player.rank}</td>`);
    }
    
    const playerName = player.name;
    const playerRole = player.role ? `<span class="role-badge">${player.role}</span>` : '';
    cells.push(`<td class="cell-player">${playerName} ${playerRole}</td>`);
    
    if (this.config.showTeam) {
      cells.push(`<td class="cell-team">${player.team || '-'}</td>`);
    }
    
    if (this.config.showScore) {
      cells.push(`<td class="cell-score">${Math.round(player.score)}</td>`);
    }
    
    if (this.config.showGrade) {
      const grade = player.grade || 'C';
      const gradeColor = this.gradeService.getColor(grade);
      cells.push(`
        <td class="cell-grade">
          <span class="grade-badge" style="background-color: ${gradeColor}">
            ${grade}
          </span>
        </td>
      `);
    }
    
    row.innerHTML = cells.join('');
    
    // Click handler
    row.addEventListener('click', () => {
      this.selectPlayer(player);
    });
    
    return row;
  }

  private updateRows(): void {
    if (!this.tableBody) return;
    this.tableBody.innerHTML = '';
    this.populateRows();
  }

  private highlightSelected(): void {
    if (!this.tableBody || !this.context) return;
    
    const selectedPlayer = this.context.store.getState<Player>('selectedPlayer');
    
    const rows = this.tableBody.querySelectorAll('.leaderboard-row');
    rows.forEach(row => {
      const playerId = row.getAttribute('data-player-id');
      if (playerId === selectedPlayer?.id) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    });
  }

  private handleRoleChange(): void {
    this.renderTable();
  }

  private selectPlayer(player: Player): void {
    if (!this.context) return;
    
    this.context.store.setState('selectedPlayer', player);
    
    // Event
    this.container?.dispatchEvent(new CustomEvent('bmad:player:selected', {
      detail: { player, moduleId: this.id },
      bubbles: true
    }));
    
    console.log(`[${this.id}] Player selected from leaderboard:`, player.name);
  }

  // ============================================================
  // API Publique
  // ============================================================

  /**
   * Rafraîchit le classement
   */
  refresh(): void {
    this.renderTable();
  }

  /**
   * Change la limite (top N)
   */
  setLimit(limit: number): void {
    this.config.limit = limit;
    this.renderTable();
  }

  /**
   * Récupère le top joueur actuel
   */
  getTopPlayer(): Player | null {
    const firstRow = this.tableBody?.querySelector('.leaderboard-row');
    const playerId = firstRow?.getAttribute('data-player-id');
    
    if (!playerId || !this.context) return null;
    
    const players = this.context.store.getState<Player[]>('players') || [];
    return players.find(p => p.id === playerId) || null;
  }
}
