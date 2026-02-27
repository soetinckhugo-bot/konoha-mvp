/**
 * BenchmarkModule - Module BMAD de benchmark vs moyenne
 * 
 * Responsabilité : Comparer un joueur vs la moyenne de son rôle
 */

import { IBaseModule, IModuleContext, Player } from '../../../core/types/bmad';
import { PercentileService } from '../services/PercentileService';
import { GradeService } from '../services/GradeService';
import { PlayerFilterService } from '../services/PlayerFilterService';

export interface BenchmarkConfig {
  showDifferential?: boolean;
  showPercentiles?: boolean;
  showRadar?: boolean;
  metrics?: string[];
}

export class BenchmarkModule implements IBaseModule {
  readonly id = 'benchmark';
  
  private context: IModuleContext | null = null;
  private container: HTMLElement | null = null;
  private config: BenchmarkConfig;
  
  private unsubscribers: (() => void)[] = [];

  constructor(
    private percentileService: PercentileService,
    private gradeService: GradeService,
    private playerFilterService: PlayerFilterService,
    config: BenchmarkConfig = {}
  ) {
    this.config = {
      showDifferential: true,
      showPercentiles: true,
      showRadar: true,
      metrics: ['kda', 'kp', 'cspm', 'dpm', 'visionScore'],
      ...config
    };
  }

  render(context: IModuleContext): void {
    this.context = context;
    this.container = this.createContainer(context.container);
    
    this.renderBenchmark();
    
    this.unsubscribers.push(
      context.store.subscribe('selectedPlayer', () => this.updateBenchmark()),
      context.store.subscribe('currentRole', () => this.updateBenchmark()),
      context.store.subscribe('players', () => this.updateBenchmark())
    );
  }

  update(context: IModuleContext): void {
    this.context = context;
    this.updateBenchmark();
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
    container.className = 'bmad-benchmark-module';
    container.setAttribute('data-module-id', this.id);
    parent.appendChild(container);
    return container;
  }

  private renderBenchmark(): void {
    if (!this.container || !this.context) return;
    
    this.container.innerHTML = '';
    
    const player = this.context.store.getState<Player>('selectedPlayer');
    
    if (!player) {
      this.renderEmptyState();
      return;
    }
    
    // Header
    const header = document.createElement('div');
    header.className = 'benchmark-header';
    header.innerHTML = `
      <h3>Benchmark</h3>
      <div class="benchmark-subtitle">
        ${player.name} vs Moyenne ${player.role || 'Global'}
      </div>
    `;
    this.container.appendChild(header);
    
    // Stats diff
    const diffSection = this.createDifferentialSection(player);
    this.container.appendChild(diffSection);
    
    // Summary
    const summary = this.createSummary(player);
    this.container.appendChild(summary);
  }

  private createDifferentialSection(player: Player): HTMLElement {
    const section = document.createElement('div');
    section.className = 'benchmark-differentials';
    
    const allPlayers = this.context?.store.getState<Player[]>('players') || [];
    const currentRole = this.context?.store.getState<string>('currentRole') || 'ALL';
    
    // Filtre par rôle
    const rolePlayers = this.playerFilterService.filterByRole(allPlayers, currentRole);
    
    const metrics = this.config.metrics || [];
    
    const rows = metrics.map(metric => {
      const playerValue = player.stats[metric] || 0;
      
      // Calcule la moyenne
      const avgValue = this.calculateAverage(rolePlayers, metric);
      const diff = playerValue - avgValue;
      const diffPercent = avgValue !== 0 ? ((diff / avgValue) * 100) : 0;
      
      const isPositive = diff >= 0;
      const diffClass = isPositive ? 'positive' : 'negative';
      const sign = isPositive ? '+' : '';
      
      return `
        <div class="diff-row ${diffClass}">
          <div class="diff-metric">${metric.toUpperCase()}</div>
          <div class="diff-player">${this.formatValue(playerValue, metric)}</div>
          <div class="diff-arrow">→</div>
          <div class="diff-avg">${this.formatValue(avgValue, metric)}</div>
          <div class="diff-value ${diffClass}">${sign}${this.formatValue(diff, metric)}</div>
          <div class="diff-percent ${diffClass}">${sign}${Math.round(diffPercent)}%</div>
        </div>
      `;
    }).join('');
    
    section.innerHTML = `
      <div class="diff-header">
        <span>${player.name}</span>
        <span>Moyenne</span>
        <span>Différence</span>
      </div>
      <div class="diff-rows">${rows}</div>
    `;
    
    return section;
  }

  private createSummary(player: Player): HTMLElement {
    const summary = document.createElement('div');
    summary.className = 'benchmark-summary';
    
    const allPlayers = this.context?.store.getState<Player[]>('players') || [];
    const metrics = this.config.metrics || [];
    
    // Calcule le score global
    const percentiles = this.percentileService.calculatePercentiles(player, metrics, allPlayers);
    const avgPercentile = this.percentileService.calculateAveragePercentile(percentiles);
    const grade = this.gradeService.getPlayerGradeFromAverage(avgPercentile);
    const gradeColor = this.gradeService.getColor(grade);
    
    // Compte supérieur/inférieur
    let above = 0;
    let below = 0;
    
    metrics.forEach(metric => {
      const values = allPlayers.map(p => p.stats[metric]).filter((v): v is number => v !== undefined);
      const playerValue = player.stats[metric] || 0;
      const isInverted = this.percentileService.isInvertedMetric(metric);
      
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      
      if (isInverted) {
        if (playerValue < avg) above++;
        else below++;
      } else {
        if (playerValue > avg) above++;
        else below++;
      }
    });
    
    summary.innerHTML = `
      <div class="summary-card">
        <div class="summary-grade" style="color: ${gradeColor}">${grade}</div>
        <div class="summary-score">${Math.round(avgPercentile)}%</div>
        <div class="summary-label">Score Global</div>
      </div>
      <div class="summary-stats">
        <div class="stat above">
          <div class="stat-value">${above}</div>
          <div class="stat-label">Au-dessus</div>
        </div>
        <div class="stat below">
          <div class="stat-value">${below}</div>
          <div class="stat-label">En-dessous</div>
        </div>
      </div>
    `;
    
    return summary;
  }

  private calculateAverage(players: Player[], metric: string): number {
    const values = players.map(p => p.stats[metric]).filter((v): v is number => v !== undefined);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private renderEmptyState(): void {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="benchmark-empty">
        <h3>Benchmark</h3>
        <p>Sélectionnez un joueur pour voir le benchmark</p>
      </div>
    `;
  }

  private updateBenchmark(): void {
    this.renderBenchmark();
  }

  private formatValue(value: number, metric: string): string {
    if (Math.abs(value) < 10) return value.toFixed(1);
    return Math.round(value).toString();
  }

  // ============================================================
  // API Publique
  // ============================================================

  /**
   * Calcule le différentiel pour une métrique
   */
  getDifferential(player: Player, metric: string): { value: number; percent: number } {
    const allPlayers = this.context?.store.getState<Player[]>('players') || [];
    const currentRole = this.context?.store.getState<string>('currentRole') || 'ALL';
    const rolePlayers = this.playerFilterService.filterByRole(allPlayers, currentRole);
    
    const playerValue = player.stats[metric] || 0;
    const avgValue = this.calculateAverage(rolePlayers, metric);
    
    return {
      value: playerValue - avgValue,
      percent: avgValue !== 0 ? ((playerValue - avgValue) / avgValue) * 100 : 0
    };
  }

  /**
   * Récupère le score global du joueur
   */
  getPlayerScore(player: Player): { percentile: number; grade: string } {
    const allPlayers = this.context?.store.getState<Player[]>('players') || [];
    const metrics = this.config.metrics || [];
    
    const percentiles = this.percentileService.calculatePercentiles(player, metrics, allPlayers);
    const avgPercentile = this.percentileService.calculateAveragePercentile(percentiles);
    const grade = this.gradeService.getPlayerGradeFromAverage(avgPercentile);
    
    return { percentile: avgPercentile, grade };
  }
}
