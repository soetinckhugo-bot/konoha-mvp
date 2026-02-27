/**
 * CentilesPanelModule - Module BMAD d'affichage des percentiles
 * 
 * Responsabilité : Afficher les barres de percentiles par catégorie
 * - Fight (Combat)
 * - Vision
 * - Resources (Farming/Economie)
 */

import { IBaseModule, IModuleContext, Player } from '../../../core/types/bmad';
import { PercentileService } from '../services/PercentileService';
import { GradeService } from '../services/GradeService';

export interface CentilesPanelConfig {
  categories?: ('fight' | 'vision' | 'resources')[];
  showPercentBar?: boolean;
  showGrade?: boolean;
  showValue?: boolean;
}

interface MetricConfig {
  id: string;
  label: string;
  category: 'fight' | 'vision' | 'resources';
}

const DEFAULT_METRICS: MetricConfig[] = [
  // Fight
  { id: 'kda', label: 'KDA', category: 'fight' },
  { id: 'kp', label: 'KP%', category: 'fight' },
  { id: 'dpm', label: 'DPM', category: 'fight' },
  { id: 'dmg', label: 'DMG%', category: 'fight' },
  
  // Vision
  { id: 'visionScore', label: 'Vision', category: 'vision' },
  { id: 'wpm', label: 'WPM', category: 'vision' },
  { id: 'wcpm', label: 'WCPM', category: 'vision' },
  
  // Resources
  { id: 'cspm', label: 'CSPM', category: 'resources' },
  { id: 'gpm', label: 'GPM', category: 'resources' },
  { id: 'gd15', label: 'GD@15', category: 'resources' },
];

export class CentilesPanelModule implements IBaseModule {
  readonly id = 'centiles-panel';
  
  private context: IModuleContext | null = null;
  private container: HTMLElement | null = null;
  private config: CentilesPanelConfig;
  private metrics: MetricConfig[];
  
  private unsubscribers: (() => void)[] = [];

  constructor(
    private percentileService: PercentileService,
    private gradeService: GradeService,
    config: CentilesPanelConfig = {}
  ) {
    this.config = {
      categories: ['fight', 'vision', 'resources'],
      showPercentBar: true,
      showGrade: true,
      showValue: true,
      ...config
    };
    
    // Filtre les métriques selon les catégories configurées
    this.metrics = DEFAULT_METRICS.filter(
      m => this.config.categories?.includes(m.category)
    );
  }

  render(context: IModuleContext): void {
    this.context = context;
    this.container = this.createContainer(context.container);
    
    this.renderPanels();
    
    // Subscribe aux changements
    this.unsubscribers.push(
      context.store.subscribe('selectedPlayer', () => this.updatePanels()),
      context.store.subscribe('players', () => this.updatePanels())
    );
  }

  update(context: IModuleContext): void {
    this.context = context;
    this.updatePanels();
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
    container.className = 'bmad-centiles-panel-module';
    container.setAttribute('data-module-id', this.id);
    parent.appendChild(container);
    return container;
  }

  private renderPanels(): void {
    if (!this.container || !this.context) return;
    
    this.container.innerHTML = '';
    
    // Header
    const header = document.createElement('div');
    header.className = 'centiles-header';
    header.innerHTML = '<h3>Analyse Centiles</h3>';
    this.container.appendChild(header);
    
    // Grid pour les panels
    const grid = document.createElement('div');
    grid.className = 'centiles-grid';
    
    // Crée un panel par catégorie
    this.config.categories?.forEach(category => {
      const panel = this.createCategoryPanel(category);
      grid.appendChild(panel);
    });
    
    this.container.appendChild(grid);
    
    // Remplit les données
    this.updatePanels();
  }

  private createCategoryPanel(category: string): HTMLElement {
    const panel = document.createElement('div');
    panel.className = `centiles-category centiles-category-${category}`;
    panel.setAttribute('data-category', category);
    
    const title = this.getCategoryTitle(category);
    const icon = this.getCategoryIcon(category);
    
    panel.innerHTML = `
      <div class="category-header">
        <span class="category-icon">${icon}</span>
        <h4 class="category-title">${title}</h4>
      </div>
      <div class="category-metrics">
        ${this.renderMetricPlaceholders(category)}
      </div>
    `;
    
    return panel;
  }

  private renderMetricPlaceholders(category: string): string {
    const categoryMetrics = this.metrics.filter(m => m.category === category);
    
    return categoryMetrics.map(m => `
      <div class="metric-row" data-metric="${m.id}">
        <div class="metric-label">${m.label}</div>
        <div class="metric-bar-container">
          <div class="metric-bar"></div>
        </div>
        <div class="metric-value"></div>
        <div class="metric-grade"></div>
      </div>
    `).join('');
  }

  private updatePanels(): void {
    if (!this.container || !this.context) return;
    
    const player = this.context.store.getState<Player>('selectedPlayer');
    const allPlayers = this.context.store.getState<Player[]>('players') || [];
    
    if (!player) {
      this.showEmptyState();
      return;
    }
    
    // Calcule les percentiles pour chaque métrique
    this.metrics.forEach(metric => {
      this.updateMetricRow(player, allPlayers, metric);
    });
  }

  private updateMetricRow(
    player: Player,
    allPlayers: Player[],
    metric: MetricConfig
  ): void {
    const row = this.container?.querySelector(`[data-metric="${metric.id}"]`);
    if (!row) return;
    
    const value = player.stats[metric.id] || 0;
    
    // Récupère toutes les valeurs pour cette métrique
    const allValues = allPlayers
      .map(p => p.stats[metric.id])
      .filter((v): v is number => v !== undefined);
    
    // Calcule le percentile
    const percentile = this.percentileService.calculatePercentile(
      value,
      allValues,
      this.percentileService.isInvertedMetric(metric.id)
    );
    
    const grade = this.gradeService.getGrade(percentile);
    const gradeColor = this.gradeService.getColor(grade);
    
    // Update bar
    const bar = row.querySelector('.metric-bar') as HTMLElement;
    if (bar) {
      bar.style.width = `${percentile}%`;
      bar.style.backgroundColor = gradeColor;
    }
    
    // Update value
    const valueEl = row.querySelector('.metric-value');
    if (valueEl && this.config.showValue) {
      valueEl.textContent = this.formatValue(value, metric.id);
    }
    
    // Update grade
    const gradeEl = row.querySelector('.metric-grade');
    if (gradeEl && this.config.showGrade) {
      gradeEl.textContent = grade;
      (gradeEl as HTMLElement).style.color = gradeColor;
    }
  }

  private showEmptyState(): void {
    const rows = this.container?.querySelectorAll('.metric-row');
    rows?.forEach(row => {
      const bar = row.querySelector('.metric-bar') as HTMLElement;
      if (bar) {
        bar.style.width = '0%';
      }
      
      const valueEl = row.querySelector('.metric-value');
      if (valueEl) {
        valueEl.textContent = '-';
      }
      
      const gradeEl = row.querySelector('.metric-grade');
      if (gradeEl) {
        gradeEl.textContent = '-';
      }
    });
  }

  private getCategoryTitle(category: string): string {
    const titles: Record<string, string> = {
      fight: 'Combat',
      vision: 'Vision',
      resources: 'Ressources',
    };
    return titles[category] || category;
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      fight: '⚔️',
      vision: '👁️',
      resources: '💰',
    };
    return icons[category] || '📊';
  }

  private formatValue(value: number, metricId: string): string {
    // Format selon la métrique
    if (metricId.includes('pct') || metricId.includes('%') || metricId === 'kp' || metricId === 'dmg') {
      return `${Math.round(value)}%`;
    }
    if (value < 10) {
      return value.toFixed(1);
    }
    return Math.round(value).toString();
  }

  // ============================================================
  // API Publique
  // ============================================================

  /**
   * Change les catégories affichées
   */
  setCategories(categories: ('fight' | 'vision' | 'resources')[]): void {
    this.config.categories = categories;
    this.metrics = DEFAULT_METRICS.filter(
      m => categories.includes(m.category)
    );
    this.renderPanels();
  }

  /**
   * Récupère les métriques d'une catégorie
   */
  getMetricsByCategory(category: string): MetricConfig[] {
    return this.metrics.filter(m => m.category === category);
  }
}
