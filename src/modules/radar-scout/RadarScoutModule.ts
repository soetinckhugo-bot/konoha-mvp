/**
 * RadarScoutModule - Classe principale du module
 * Story 3.1
 */

import type { CoreAPI, Player, MetricConfig, RadarViewMode } from '../../core/types';
import { RadarChart } from './components/RadarChart';
import { RadarDataService } from './services/RadarDataService';
import { defaultMetrics } from './config/metrics';

export class RadarScoutModule {
  private core: CoreAPI;
  private container: HTMLElement | null = null;
  private unsubscribers: (() => void)[] = [];
  private radarChart: RadarChart | null = null;
  private dataService: RadarDataService;

  constructor(core: CoreAPI) {
    this.core = core;
    this.dataService = new RadarDataService();
  }

  render(): void {
    // Créer le container
    this.container = document.createElement('div');
    this.container.className = 'radar-scout-module';
    this.container.innerHTML = `
      <div class="radar-scout-header">
        <h2 class="module-title">🎯 Radar Scout</h2>
        <div class="view-toggles">
          <button class="view-btn active" data-view="solo">Solo</button>
          <button class="view-btn" data-view="compare">Comparer</button>
          <button class="view-btn" data-view="benchmark">Benchmark</button>
        </div>
      </div>
      
      <div class="radar-scout-content">
        <div class="radar-sidebar">
          <div class="control-section">
            <label class="control-label">Joueur</label>
            <select id="player-select" class="kono-select">
              <option value="">Sélectionner un joueur</option>
            </select>
          </div>
          
          <div class="control-section" id="compare-section" style="display: none;">
            <label class="control-label">Comparer avec</label>
            <select id="compare-select" class="kono-select">
              <option value="">Sélectionner un joueur</option>
            </select>
          </div>
          
          <div class="control-section">
            <label class="control-label">Métriques</label>
            <div id="metrics-list" class="metrics-list"></div>
          </div>
        </div>
        
        <div class="radar-main">
          <div id="radar-chart-container" class="radar-chart-container"></div>
          <div id="radar-empty" class="radar-empty">
            <div class="empty-icon">📊</div>
            <p>Sélectionnez un joueur pour visualiser</p>
          </div>
        </div>
        
        <div class="radar-panel">
          <div class="panel-section">
            <h3>Statistiques</h3>
            <div id="stats-details" class="stats-details">
              <p class="stats-placeholder">Sélectionnez un joueur</p>
            </div>
          </div>
          
          <div class="panel-section">
            <h3>Export</h3>
            <button id="export-btn" class="kono-btn kono-btn-secondary" disabled>
              📷 Exporter PNG
            </button>
          </div>
        </div>
      </div>
    `;

    // Monter dans le DOM
    const mountPoint = document.getElementById('module-container');
    if (mountPoint) {
      mountPoint.appendChild(this.container);
    }

    // Initialiser le radar chart
    this.radarChart = new RadarChart('radar-chart-container');

    // Setup event handlers
    this.setupEventHandlers();

    // S'abonner aux changements state
    this.setupSubscriptions();

    // Initial render
    this.updatePlayerSelects();
    this.updateView();
  }

  private setupEventHandlers(): void {
    if (!this.container) return;

    // View toggles
    const viewBtns = this.container.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view') as RadarViewMode;
        this.core.setState('currentView', view);
        
        // Update active state
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show/hide compare section
        const compareSection = this.container!.querySelector('#compare-section') as HTMLElement;
        if (compareSection) {
          compareSection.style.display = view === 'compare' ? 'block' : 'none';
        }
      });
    });

    // Player select
    const playerSelect = this.container.querySelector('#player-select') as HTMLSelectElement;
    playerSelect?.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      this.core.setState('selectedPlayerId', value || null);
    });

    // Compare select
    const compareSelect = this.container.querySelector('#compare-select') as HTMLSelectElement;
    compareSelect?.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      this.core.setState('comparedPlayerId', value || null);
    });

    // Export button
    const exportBtn = this.container.querySelector('#export-btn') as HTMLButtonElement;
    exportBtn?.addEventListener('click', () => this.handleExport());
  }

  private setupSubscriptions(): void {
    // Subscribe to player selection
    const unsubPlayer = this.core.subscribe('selectedPlayerId', () => {
      this.updateView();
      this.updateStatsPanel();
    });
    this.unsubscribers.push(unsubPlayer);

    // Subscribe to compare selection
    const unsubCompare = this.core.subscribe('comparedPlayerId', () => {
      this.updateView();
    });
    this.unsubscribers.push(unsubCompare);

    // Subscribe to view mode
    const unsubView = this.core.subscribe('currentView', () => {
      this.updateView();
    });
    this.unsubscribers.push(unsubView);

    // Subscribe to players data
    const unsubPlayers = this.core.subscribe('players', () => {
      this.updatePlayerSelects();
    });
    this.unsubscribers.push(unsubPlayers);

    // Subscribe to selected metrics
    const unsubMetrics = this.core.subscribe('selectedMetrics', () => {
      this.updateMetricsList();
      this.updateView();
    });
    this.unsubscribers.push(unsubMetrics);
  }

  private updatePlayerSelects(): void {
    const players = this.core.getState('players');
    const playerSelect = this.container?.querySelector('#player-select') as HTMLSelectElement;
    const compareSelect = this.container?.querySelector('#compare-select') as HTMLSelectElement;

    const options = players.map(p => 
      `<option value="${p.id}">${p.name} (${p.team}) - ${p.role}</option>`
    ).join('');

    if (playerSelect) {
      playerSelect.innerHTML = `<option value="">Sélectionner un joueur</option>${options}`;
    }
    if (compareSelect) {
      compareSelect.innerHTML = `<option value="">Sélectionner un joueur</option>${options}`;
    }
  }

  private updateMetricsList(): void {
    const availableMetrics = this.core.getState('availableMetrics');
    const selectedMetrics = this.core.getState('selectedMetrics');
    const metricsList = this.container?.querySelector('#metrics-list');

    if (!metricsList) return;

    // Récupérer les configs de métriques
    const allMetrics = this.core.listMetrics();
    const metricsMap = new Map(allMetrics.map(m => [m.id, m]));

    // Utiliser les métriques par défaut si pas encore enregistrées
    const metricsHtml = availableMetrics.map(metricId => {
      const metric = metricsMap.get(metricId) || defaultMetrics.find(m => m.id === metricId);
      const isSelected = selectedMetrics.includes(metricId);
      const category = metric?.category || 'combat';
      
      return `
        <label class="metric-checkbox ${category}">
          <input type="checkbox" value="${metricId}" ${isSelected ? 'checked' : ''}>
          <span class="metric-name">${metric?.name || metricId}</span>
          ${metric?.icon ? `<span class="metric-icon">${metric.icon}</span>` : ''}
        </label>
      `;
    }).join('');

    metricsList.innerHTML = metricsHtml;

    // Add event listeners
    const checkboxes = metricsList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = Array.from(metricsList.querySelectorAll('input:checked'))
          .map(input => (input as HTMLInputElement).value);
        this.core.setState('selectedMetrics', checked);
      });
    });
  }

  private updateView(): void {
    const view = this.core.getState('currentView');
    const playerId = this.core.getState('selectedPlayerId');
    const comparedId = this.core.getState('comparedPlayerId');
    const players = this.core.getState('players');
    const selectedMetrics = this.core.getState('selectedMetrics');

    const emptyState = this.container?.querySelector('#radar-empty') as HTMLElement;
    const chartContainer = this.container?.querySelector('#radar-chart-container') as HTMLElement;

    if (!playerId || players.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (chartContainer) chartContainer.style.display = 'none';
      return;
    }

    // Récupérer les configs de métriques
    const allMetrics = this.core.listMetrics();
    const metricsMap = new Map(allMetrics.map(m => [m.id, m]));
    const metrics: MetricConfig[] = selectedMetrics
      .map(id => metricsMap.get(id) || defaultMetrics.find(m => m.id === id))
      .filter((m): m is MetricConfig => m !== undefined);

    if (metrics.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (chartContainer) chartContainer.style.display = 'none';
      return;
    }

    // Créer config radar
    const config = this.dataService.getConfig(
      view,
      playerId,
      metrics,
      players,
      comparedId || undefined,
      (player, metric) => this.getNormalizedValue(player, metric)
    );

    // Render
    if (emptyState) emptyState.style.display = 'none';
    if (chartContainer) chartContainer.style.display = 'block';
    
    this.radarChart?.render(config);

    // Enable export button
    const exportBtn = this.container?.querySelector('#export-btn') as HTMLButtonElement;
    if (exportBtn) exportBtn.disabled = false;
  }

  private getNormalizedValue(player: Player, metric: MetricConfig): number {
    const value = player.stats[metric.id];
    if (value === undefined) return 50; // Valeur par défaut
    
    return this.core.normalize.normalize(value, metric, player.role);
  }

  private updateStatsPanel(): void {
    const playerId = this.core.getState('selectedPlayerId');
    const players = this.core.getState('players');
    const selectedMetrics = this.core.getState('selectedMetrics');
    const statsDetails = this.container?.querySelector('#stats-details');

    if (!playerId || !statsDetails) {
      if (statsDetails) {
        statsDetails.innerHTML = '<p class="stats-placeholder">Sélectionnez un joueur</p>';
      }
      return;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // Récupérer les configs de métriques
    const allMetrics = this.core.listMetrics();
    const metricsMap = new Map(allMetrics.map(m => [m.id, m]));

    const statsHtml = selectedMetrics.map(metricId => {
      const metric = metricsMap.get(metricId) || defaultMetrics.find(m => m.id === metricId);
      if (!metric) return '';

      const value = player.stats[metricId];
      if (value === undefined) return '';

      const normalized = this.getNormalizedValue(player, metric);
      const grade = this.core.normalize.getGrade(normalized);

      return `
        <div class="stat-row">
          <span class="stat-name">${metric.name}</span>
          <span class="stat-value">${value.toFixed(metric.decimals || 1)}</span>
          <span class="stat-grade grade-${grade.toLowerCase()}">${grade}</span>
        </div>
      `;
    }).join('');

    statsDetails.innerHTML = statsHtml || '<p class="stats-placeholder">Aucune métrique sélectionnée</p>';
  }

  private async handleExport(): Promise<void> {
    const chartContainer = this.container?.querySelector('.radar-main') as HTMLElement;
    if (!chartContainer) return;

    try {
      const blob = await this.core.export.toPNG(chartContainer, {
        mode: 'solo',
        width: 1200,
        height: 800,
        scale: 2
      });
      
      const playerId = this.core.getState('selectedPlayerId');
      const players = this.core.getState('players');
      const player = players.find(p => p.id === playerId);
      
      const filename = player 
        ? `konoha_${player.name}_${player.role}.png`
        : 'konoha_export.png';
      
      this.core.export.download(blob, filename);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Erreur lors de l\'export. Veuillez réessayer.');
    }
  }

  destroy(): void {
    // Cleanup subscriptions
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];

    // Destroy chart
    this.radarChart?.destroy();
    this.radarChart = null;

    // Remove from DOM
    this.container?.remove();
    this.container = null;
  }
}
