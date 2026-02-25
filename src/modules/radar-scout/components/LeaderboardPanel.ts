/**
 * LeaderboardPanel Component - Classement des joueurs
 * Feature Pack V2 - FR30
 */

import type { Player, MetricConfig, LoLRole, CoreAPI } from '../../../core/types';
import { GradeCalculator } from '../services/GradeCalculator';
import { ScoreCalculator } from '../services/ScoreCalculator';

export type SortField = 'score' | 'name' | 'team' | 'role' | string;
export type SortDirection = 'asc' | 'desc';

export interface LeaderboardPlayer {
  player: Player;
  score: number;
  rank: number;
  grades: Record<string, number>; // metricId -> normalized value
}

export interface LeaderboardPanelProps {
  players: Player[];
  metrics: MetricConfig[];
  selectedRole: LoLRole | 'all';
  core: CoreAPI;
  onPlayerSelect?: (playerId: string) => void;
}

export class LeaderboardPanel {
  private container: HTMLElement | null = null;
  private currentSort: { field: SortField; direction: SortDirection } = { field: 'score', direction: 'desc' };
  private core: CoreAPI;
  private scoreCalculator: ScoreCalculator;

  constructor(core: CoreAPI) {
    this.core = core;
    this.scoreCalculator = new ScoreCalculator();
  }

  render(props: LeaderboardPanelProps): HTMLElement {
    const { players, metrics, selectedRole, onPlayerSelect } = props;

    this.container = document.createElement('div');
    this.container.className = 'leaderboard-panel';

    // Calculer les scores et créer le classement
    const leaderboardData = this.calculateLeaderboard(players, metrics, selectedRole);
    const sortedData = this.sortData(leaderboardData, this.currentSort.field, this.currentSort.direction);

    this.container.innerHTML = `
      <div class="leaderboard-header">
        <h3 class="leaderboard-title">🏆 Classement</h3>
        <div class="leaderboard-filters">
          <select class="kono-select role-filter" id="leaderboard-role-filter">
            <option value="all" ${selectedRole === 'all' ? 'selected' : ''}>Tous les rôles</option>
            <option value="TOP" ${selectedRole === 'TOP' ? 'selected' : ''}>Top</option>
            <option value="JUNGLE" ${selectedRole === 'JUNGLE' ? 'selected' : ''}>Jungle</option>
            <option value="MID" ${selectedRole === 'MID' ? 'selected' : ''}>Mid</option>
            <option value="ADC" ${selectedRole === 'ADC' ? 'selected' : ''}>ADC</option>
            <option value="SUPPORT" ${selectedRole === 'SUPPORT' ? 'selected' : ''}>Support</option>
          </select>
        </div>
      </div>

      <div class="leaderboard-table-container">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th class="sortable" data-sort="rank">#</th>
              <th class="sortable" data-sort="name">Joueur</th>
              <th class="sortable" data-sort="role">Rôle</th>
              <th class="sortable" data-sort="score">Score</th>
              ${metrics.slice(0, 3).map(m => `<th class="sortable metric-col" data-sort="${m.id}">${m.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${sortedData.map((item, index) => this.renderPlayerRow(item, index, metrics.slice(0, 3))).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Setup event listeners
    this.setupEventListeners(onPlayerSelect);

    return this.container;
  }

  private renderPlayerRow(item: LeaderboardPlayer, index: number, displayMetrics: MetricConfig[]): string {
    const { player, score, grades } = item;
    const grade = GradeCalculator.getGrade(score);
    
    return `
      <tr class="leaderboard-row" data-player-id="${player.id}">
        <td class="rank-cell">
          <span class="rank-badge rank-${index + 1 <= 3 ? index + 1 : 'other'}">${index + 1}</span>
        </td>
        <td class="player-cell">
          <div class="player-info">
            <span class="player-name">${player.name}</span>
            <span class="player-team">${player.team}</span>
          </div>
        </td>
        <td class="role-cell">
          <span class="role-badge role-${player.role.toLowerCase()}">${player.role}</span>
        </td>
        <td class="score-cell">
          <div class="score-wrapper">
            <span class="score-value">${Math.round(score)}</span>
            <span class="grade-badge-small grade-${grade.toLowerCase()}">${grade}</span>
          </div>
        </td>
        ${displayMetrics.map(m => {
          const value = grades[m.id] || 0;
          const mGrade = GradeCalculator.getGrade(value);
          return `<td class="metric-cell"><span class="metric-grade grade-${mGrade.toLowerCase()}">${Math.round(value)}</span></td>`;
        }).join('')}
      </tr>
    `;
  }

  private setupEventListeners(onPlayerSelect?: (playerId: string) => void): void {
    if (!this.container) return;

    // Role filter
    const roleFilter = this.container.querySelector('#leaderboard-role-filter') as HTMLSelectElement;
    roleFilter?.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value as LoLRole | 'all';
      this.core.setState('currentRole', value);
      // Re-render will happen via state subscription
    });

    // Sort headers
    const sortHeaders = this.container.querySelectorAll('.sortable');
    sortHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const field = header.getAttribute('data-sort') as SortField;
        if (field === this.currentSort.field) {
          // Toggle direction
          this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
          this.currentSort = { field, direction: 'desc' };
        }
        // Re-render will happen via state subscription
      });
    });

    // Player selection
    const rows = this.container.querySelectorAll('.leaderboard-row');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const playerId = row.getAttribute('data-player-id');
        if (playerId && onPlayerSelect) {
          onPlayerSelect(playerId);
        }
      });
    });
  }

  private calculateLeaderboard(
    players: Player[],
    metrics: MetricConfig[],
    roleFilter: LoLRole | 'all'
  ): LeaderboardPlayer[] {
    // Filtrer par rôle si nécessaire
    const filteredPlayers = roleFilter === 'all' 
      ? players 
      : players.filter(p => p.role === roleFilter);

    return filteredPlayers.map(player => {
      // Utiliser ScoreCalculator pour scoring pondéré par rôle
      const scoreResult = this.scoreCalculator.calculatePlayerScore(
        player,
        metrics,
        (p, m) => this.core.normalize.normalize(p.stats[m.id] || 0, m, p.role)
      );
      
      // Construire grades pour l'affichage
      const grades: Record<string, number> = {};
      for (const metric of metrics) {
        const value = player.stats[metric.id];
        if (value !== undefined) {
          grades[metric.id] = this.core.normalize.normalize(value, metric, player.role);
        }
      }
      
      return {
        player,
        score: scoreResult.weighted, // Utiliser le score pondéré
        rank: 0, // Sera calculé après tri
        grades
      };
    });
  }

  private sortData(data: LeaderboardPlayer[], field: SortField, direction: SortDirection): LeaderboardPlayer[] {
    const sorted = [...data].sort((a, b) => {
      let comparison = 0;
      
      switch (field) {
        case 'rank':
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'name':
          comparison = a.player.name.localeCompare(b.player.name);
          break;
        case 'role':
          comparison = a.player.role.localeCompare(b.player.role);
          break;
        case 'team':
          comparison = a.player.team.localeCompare(b.player.team);
          break;
        default:
          // Metric field
          const aValue = a.grades[field] || 0;
          const bValue = b.grades[field] || 0;
          comparison = aValue - bValue;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });

    // Mettre à jour les rangs
    sorted.forEach((item, index) => {
      item.rank = index + 1;
    });

    return sorted;
  }

  destroy(): void {
    this.container?.remove();
    this.container = null;
  }
}
