/**
 * CompareModule - Module BMAD de comparaison joueurs
 * 
 * Responsabilité : Afficher la comparaison côte à côte de 2 joueurs
 * avec radar chart et stats détaillées
 */

import { IBaseModule, IModuleContext, Player } from '../../../core/types/bmad';
import { PercentileService } from '../services/PercentileService';
import { GradeService } from '../services/GradeService';
import { PlayerFilterService } from '../services/PlayerFilterService';

export interface CompareConfig {
  showRadar?: boolean;
  showStatsTable?: boolean;
  showAdvantage?: boolean;
  metrics?: string[];
}

interface PlayerComparison {
  player: Player;
  percentiles: Map<string, number>;
  averagePercentile: number;
  grade: string;
  wins: number; // Nombre de métriques où ce joueur gagne
}

export class CompareModule implements IBaseModule {
  readonly id = 'compare';
  
  private context: IModuleContext | null = null;
  private container: HTMLElement | null = null;
  private player1: Player | null = null;
  private player2: Player | null = null;
  private config: CompareConfig;
  
  private unsubscribers: (() => void)[] = [];

  constructor(
    private percentileService: PercentileService,
    private gradeService: GradeService,
    private playerFilterService: PlayerFilterService,
    config: CompareConfig = {}
  ) {
    this.config = {
      showRadar: true,
      showStatsTable: true,
      showAdvantage: true,
      metrics: ['kda', 'kp', 'cspm', 'dpm', 'visionScore'],
      ...config
    };
  }

  render(context: IModuleContext): void {
    this.context = context;
    this.container = this.createContainer(context.container);
    
    // Récupère les joueurs à comparer
    this.loadPlayers();
    
    this.renderComparison();
    
    // Subscribe aux changements
    this.unsubscribers.push(
      context.store.subscribe('selectedPlayer', () => this.handlePlayerChange()),
      context.store.subscribe('players', () => this.handlePlayersChange())
    );
  }

  update(context: IModuleContext): void {
    this.context = context;
    this.loadPlayers();
    this.renderComparison();
  }

  destroy(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    this.container = null;
    this.context = null;
  }

  private createContainer(parent: HTMLElement): HTMLElement {
    const container = document.createElement('div');
    container.className = 'bmad-compare-module';
    container.setAttribute('data-module-id', this.id);
    parent.appendChild(container);
    return container;
  }

  private loadPlayers(): void {
    if (!this.context) return;
    
    const players = this.context.store.getState<Player[]>('players') || [];
    
    // Joueur 1 = selectedPlayer
    this.player1 = this.context.store.getState<Player>('selectedPlayer');
    
    // Joueur 2 = stocké dans comparePlayerId ou prend le 2ème joueur du même rôle
    const comparePlayerId = this.context.store.getState<string>('comparePlayerId');
    
    if (comparePlayerId) {
      this.player2 = players.find(p => p.id === comparePlayerId) || null;
    } else {
      // Auto-sélectionne un joueur du même rôle
      if (this.player1) {
        const sameRole = players.filter(p => 
          p.id !== this.player1!.id && p.role === this.player1!.role
        );
        this.player2 = sameRole[0] || players.find(p => p.id !== this.player1!.id) || null;
      }
    }
  }

  private renderComparison(): void {
    if (!this.container || !this.context) return;
    
    this.container.innerHTML = '';
    
    if (!this.player1 || !this.player2) {
      this.renderEmptyState();
      return;
    }
    
    // Header
    const header = document.createElement('div');
    header.className = 'compare-header';
    header.innerHTML = `
      <h3>Comparaison</h3>
      <div class="compare-players-names">
        <span class="player1-name">${this.player1.name}</span>
        <span class="vs">VS</span>
        <span class="player2-name">${this.player2.name}</span>
      </div>
    `;
    this.container.appendChild(header);
    
    // Layout côte à côte
    const layout = document.createElement('div');
    layout.className = 'compare-layout';
    
    // Stats player 1
    const col1 = this.createPlayerColumn(this.player1, 'left');
    layout.appendChild(col1);
    
    // Centre - VS et métriques comparées
    const center = this.createComparisonCenter();
    layout.appendChild(center);
    
    // Stats player 2
    const col2 = this.createPlayerColumn(this.player2, 'right');
    layout.appendChild(col2);
    
    this.container.appendChild(layout);
    
    // Tableau détaillé
    if (this.config.showStatsTable) {
      const table = this.createComparisonTable();
      this.container.appendChild(table);
    }
  }

  private createPlayerColumn(player: Player, side: 'left' | 'right'): HTMLElement {
    const col = document.createElement('div');
    col.className = `compare-column compare-column-${side}`;
    
    const metrics = this.config.metrics || [];
    const allPlayers = this.context?.store.getState<Player[]>('players') || [];
    
    // Calcule percentiles
    const percentiles = this.percentileService.calculatePercentiles(
      player,
      metrics,
      allPlayers
    );
    
    const avgPercentile = this.percentileService.calculateAveragePercentile(percentiles);
    const grade = this.gradeService.getPlayerGradeFromAverage(avgPercentile);
    const gradeColor = this.gradeService.getColor(grade);
    
    col.innerHTML = `
      <div class="player-card">
        <div class="player-avatar ${side}"></div>
        <h4 class="player-name">${player.name}</h4>
        <div class="player-team">${player.team || '-'}</div>
        <div class="player-role">${player.role || '-'}</div>
        <div class="player-grade" style="color: ${gradeColor}">${grade}</div>
        <div class="player-score">${Math.round(avgPercentile)}%</div>
      </div>
    `;
    
    return col;
  }

  private createComparisonCenter(): HTMLElement {
    const center = document.createElement('div');
    center.className = 'compare-center';
    
    if (!this.player1 || !this.player2) return center;
    
    const metrics = this.config.metrics || [];
    const allPlayers = this.context?.store.getState<Player[]>('players') || [];
    
    // Calcule les comparaisons
    let p1Wins = 0;
    let p2Wins = 0;
    
    metrics.forEach(metric => {
      const p1Value = this.player1!.stats[metric] || 0;
      const p2Value = this.player2!.stats[metric] || 0;
      
      const isInverted = this.percentileService.isInvertedMetric(metric);
      
      if (isInverted) {
        if (p1Value < p2Value) p1Wins++;
        else if (p2Value < p1Value) p2Wins++;
      } else {
        if (p1Value > p2Value) p1Wins++;
        else if (p2Value > p1Value) p2Wins++;
      }
    });
    
    // Affiche le résultat
    const winner = p1Wins > p2Wins ? 1 : p2Wins > p1Wins ? 2 : 0;
    
    center.innerHTML = `
      <div class="vs-badge">VS</div>
      <div class="score-display">
        <div class="score-p1 ${winner === 1 ? 'winner' : ''}">${p1Wins}</div>
        <div class="score-separator">-</div>
        <div class="score-p2 ${winner === 2 ? 'winner' : ''}">${p2Wins}</div>
      </div>
      <div class="advantage-bar">
        <div class="advantage-p1" style="width: ${(p1Wins / metrics.length) * 100}%"></div>
        <div class="advantage-p2" style="width: ${(p2Wins / metrics.length) * 100}%"></div>
      </div>
    `;
    
    return center;
  }

  private createComparisonTable(): HTMLElement {
    const table = document.createElement('div');
    table.className = 'compare-table';
    
    if (!this.player1 || !this.player2) return table;
    
    const metrics = this.config.metrics || [];
    const allPlayers = this.context?.store.getState<Player[]>('players') || [];
    
    const rows = metrics.map(metric => {
      const p1Value = this.player1!.stats[metric] || 0;
      const p2Value = this.player2!.stats[metric] || 0;
      
      const p1Percentile = this.percentileService.calculatePercentile(
        p1Value, metric, allPlayers, this.percentileService.isInvertedMetric(metric)
      );
      const p2Percentile = this.percentileService.calculatePercentile(
        p2Value, metric, allPlayers, this.percentileService.isInvertedMetric(metric)
      );
      
      const isInverted = this.percentileService.isInvertedMetric(metric);
      let winner: 1 | 2 | 0 = 0;
      
      if (isInverted) {
        winner = p1Value < p2Value ? 1 : p2Value < p1Value ? 2 : 0;
      } else {
        winner = p1Value > p2Value ? 1 : p2Value > p1Value ? 2 : 0;
      }
      
      return `
        <div class="compare-row ${winner === 1 ? 'p1-wins' : winner === 2 ? 'p2-wins' : ''}">
          <div class="metric-p1">
            <span class="value">${this.formatValue(p1Value, metric)}</span>
            <span class="percentile">${Math.round(p1Percentile)}%</span>
          </div>
          <div class="metric-name">${metric.toUpperCase()}</div>
          <div class="metric-p2">
            <span class="value">${this.formatValue(p2Value, metric)}</span>
            <span class="percentile">${Math.round(p2Percentile)}%</span>
          </div>
        </div>
      `;
    }).join('');
    
    table.innerHTML = `
      <h4>Détail des statistiques</h4>
      <div class="compare-rows">
        ${rows}
      </div>
    `;
    
    return table;
  }

  private renderEmptyState(): void {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="compare-empty">
        <h3>Comparaison</h3>
        <p>Sélectionnez deux joueurs à comparer</p>
        <div class="empty-players">
          <div class="empty-player">?</div>
          <div class="vs">VS</div>
          <div class="empty-player">?</div>
        </div>
      </div>
    `;
  }

  private handlePlayerChange(): void {
    this.loadPlayers();
    this.renderComparison();
  }

  private handlePlayersChange(): void {
    this.loadPlayers();
    this.renderComparison();
  }

  private formatValue(value: number, metric: string): string {
    if (metric.includes('pct') || metric.includes('%') || ['kp', 'dmg'].includes(metric)) {
      return `${Math.round(value)}%`;
    }
    if (value < 10) return value.toFixed(1);
    return Math.round(value).toString();
  }

  // ============================================================
  // API Publique
  // ============================================================

  /**
   * Définit le 2ème joueur à comparer
   */
  setComparePlayer(playerId: string): void {
    if (!this.context) return;
    
    this.context.store.setState('comparePlayerId', playerId);
    this.loadPlayers();
    this.renderComparison();
  }

  /**
   * Retourne le gagnant de la comparaison (ou null si égalité)
   */
  getWinner(): Player | null {
    if (!this.player1 || !this.player2) return null;
    
    const metrics = this.config.metrics || [];
    let p1Wins = 0;
    let p2Wins = 0;
    
    metrics.forEach(metric => {
      const p1Value = this.player1!.stats[metric] || 0;
      const p2Value = this.player2!.stats[metric] || 0;
      const isInverted = this.percentileService.isInvertedMetric(metric);
      
      if (isInverted) {
        if (p1Value < p2Value) p1Wins++;
        else if (p2Value < p1Value) p2Wins++;
      } else {
        if (p1Value > p2Value) p1Wins++;
        else if (p2Value > p1Value) p2Wins++;
      }
    });
    
    if (p1Wins > p2Wins) return this.player1;
    if (p2Wins > p1Wins) return this.player2;
    return null;
  }

  /**
   * Récupère les deux joueurs comparés
   */
  getComparedPlayers(): { player1: Player | null; player2: Player | null } {
    return { player1: this.player1, player2: this.player2 };
  }
}
