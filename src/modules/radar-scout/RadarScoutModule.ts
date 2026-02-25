/**
 * RadarScoutModule - Classe principale du module
 * Story 3.1 + Feature Pack V2
 */

import type { CoreAPI, Player, MetricConfig, RadarViewMode } from '../../core/types';
import { RadarChart } from './components/RadarChart';
import { CentileBar } from './components/CentileBar';
import { DuelView } from './components/DuelView';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { RadarDataService } from './services/RadarDataService';
import { ExportRenderService } from './services/ExportRenderService';
import { GradeCalculator } from './services/GradeCalculator';
// Services imports
import { defaultMetrics } from './config/metrics';

export class RadarScoutModule {
  private core: CoreAPI;
  private container: HTMLElement | null = null;
  private unsubscribers: (() => void)[] = [];
  private radarChart: RadarChart | null = null;
  private dataService: RadarDataService;
  private centileBar: CentileBar | null = null;
  private duelView: DuelView | null = null;
  private leaderboardPanel: LeaderboardPanel | null = null;
  private currentExportMode: 'solo' | 'social' = 'solo';
  private centileViewMode: 'percentiles' | 'values' = 'percentiles';

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
          <button class="view-btn" data-view="duel">Duel</button>
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
          
          <div class="control-section" id="role-filter-section">
            <label class="control-label">Filtrer par rôle</label>
            <select id="role-filter" class="kono-select">
              <option value="all">Tous les rôles</option>
              <option value="TOP">Top</option>
              <option value="JUNGLE">Jungle</option>
              <option value="MID">Mid</option>
              <option value="ADC">ADC</option>
              <option value="SUPPORT">Support</option>
            </select>
          </div>
          
          <div class="control-section">
            <label class="control-label">Métriques</label>
            <div id="metrics-list" class="metrics-list"></div>
          </div>
        </div>
        
        <div class="radar-main">
          <div id="radar-chart-container" class="radar-chart-container"></div>
          <div id="duel-view-container" class="duel-view-container" style="display: none;"></div>
          <div id="radar-empty" class="radar-empty">
            <div class="empty-icon">📊</div>
            <p>Sélectionnez un joueur pour visualiser</p>
          </div>
        </div>
        
        <div class="radar-panel">
          <div class="panel-section" id="stats-section">
            <h3>Statistiques</h3>
            <div id="stats-details" class="stats-details">
              <p class="stats-placeholder">Sélectionnez un joueur</p>
            </div>
          </div>
          
          <div class="panel-section" id="centiles-section">
            <div class="centiles-header">
              <h3>📊 Percentile Analysis</h3>
              <div class="centile-toggle">
                <button class="centile-toggle-btn ${this.centileViewMode === 'percentiles' ? 'active' : ''}" data-mode="percentiles" title="Voir les percentiles">
                  <span>％</span>
                </button>
                <button class="centile-toggle-btn ${this.centileViewMode === 'values' ? 'active' : ''}" data-mode="values" title="Voir les valeurs brutes">
                  <span>123</span>
                </button>
              </div>
            </div>
            <p class="centile-subtitle">Player position vs ${this.core.getState('currentRole') === 'all' ? 'league' : this.core.getState('currentRole') + 's'}</p>
            <div id="centiles-container" class="centiles-container">
              <p class="stats-placeholder">Sélectionnez un joueur</p>
            </div>
          </div>
          
          <div class="panel-section" id="leaderboard-section">
            <h3>🏆 Leaderboard</h3>
            <div id="leaderboard-container"></div>
          </div>
          
          <div class="panel-section" id="export-section">
            <h3>Export</h3>
            <div class="export-mode-toggle">
              <button class="export-mode-btn ${this.currentExportMode === 'solo' ? 'active' : ''}" data-mode="solo">
                <span class="mode-icon">📄</span>
                <span class="mode-label">Solo</span>
                <span class="mode-dimensions">1200×800</span>
              </button>
              <button class="export-mode-btn ${this.currentExportMode === 'social' ? 'active' : ''}" data-mode="social">
                <span class="mode-icon">📱</span>
                <span class="mode-label">Social</span>
                <span class="mode-dimensions">1080×1080</span>
              </button>
            </div>
            <button id="export-btn" class="kono-btn kono-btn-secondary" disabled>
              📷 Exporter Radar
            </button>
            <button id="export-analysis-btn" class="kono-btn kono-btn-secondary" disabled style="margin-top: var(--kono-space-2);">
              📊 Exporter Percentile Analysis
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
        
        // Show/hide sections based on view
        this.updateViewVisibility(view);
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

    // Role filter
    const roleFilter = this.container.querySelector('#role-filter') as HTMLSelectElement;
    roleFilter?.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      this.core.setState('currentRole', value as any);
    });

    // Export mode toggle
    const exportModeBtns = this.container.querySelectorAll('.export-mode-btn');
    exportModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode') as 'solo' | 'social';
        this.currentExportMode = mode;
        
        exportModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Export buttons
    const exportBtn = this.container.querySelector('#export-btn') as HTMLButtonElement;
    exportBtn?.addEventListener('click', () => this.handleExport());
    
    const exportAnalysisBtn = this.container.querySelector('#export-analysis-btn') as HTMLButtonElement;
    exportAnalysisBtn?.addEventListener('click', () => this.handleExportAnalysis());

    // Centile view toggle
    const centileToggleBtns = this.container.querySelectorAll('.centile-toggle-btn');
    centileToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode') as 'percentiles' | 'values';
        this.centileViewMode = mode;
        
        centileToggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Re-render centiles panel
        this.updateCentilesPanel();
      });
    });
  }

  private updateViewVisibility(view: RadarViewMode): void {
    if (!this.container) return;

    const compareSection = this.container.querySelector('#compare-section') as HTMLElement;
    const radarContainer = this.container.querySelector('#radar-chart-container') as HTMLElement;
    const duelContainer = this.container.querySelector('#duel-view-container') as HTMLElement;
    const statsSection = this.container.querySelector('#stats-section') as HTMLElement;
    const centilesSection = this.container.querySelector('#centiles-section') as HTMLElement;
    const leaderboardSection = this.container.querySelector('#leaderboard-section') as HTMLElement;

    // Reset visibility
    if (compareSection) compareSection.style.display = 'none';
    if (radarContainer) radarContainer.style.display = 'none';
    if (duelContainer) duelContainer.style.display = 'none';
    if (statsSection) statsSection.style.display = 'block';
    // Centiles and Leaderboard always visible when player selected
    if (centilesSection) centilesSection.style.display = 'block';
    if (leaderboardSection) leaderboardSection.style.display = 'block';

    switch (view) {
      case 'compare':
        if (compareSection) compareSection.style.display = 'block';
        if (radarContainer) radarContainer.style.display = 'block';
        break;
      case 'benchmark':
        if (radarContainer) radarContainer.style.display = 'block';
        break;
      case 'duel':
        if (compareSection) compareSection.style.display = 'block';
        if (duelContainer) duelContainer.style.display = 'block';
        if (statsSection) statsSection.style.display = 'none';
        if (centilesSection) centilesSection.style.display = 'none';
        break;
      case 'solo':
      default:
        if (radarContainer) radarContainer.style.display = 'block';
        break;
    }
  }

  private setupSubscriptions(): void {
    // Subscribe to player selection
    const unsubPlayer = this.core.subscribe('selectedPlayerId', () => {
      this.updateView();
      this.updateStatsPanel();
      this.updateCentilesPanel();
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

    // Subscribe to role filter
    const unsubRole = this.core.subscribe('currentRole', () => {
      this.updateView();
      this.updateLeaderboard();
    });
    this.unsubscribers.push(unsubRole);

    // Subscribe to players data
    const unsubPlayers = this.core.subscribe('players', () => {
      this.updatePlayerSelects();
      this.updateLeaderboard();
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
    const duelContainer = this.container?.querySelector('#duel-view-container') as HTMLElement;

    // Update visibility
    this.updateViewVisibility(view);

    if (!playerId || players.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (chartContainer) chartContainer.style.display = 'none';
      if (duelContainer) duelContainer.style.display = 'none';
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

    // Handle different views
    if (view === 'duel') {
      this.renderDuelView(playerId, comparedId, players, metrics);
      if (emptyState) emptyState.style.display = 'none';
      if (chartContainer) chartContainer.style.display = 'none';
      if (duelContainer) duelContainer.style.display = 'block';
    } else {
      // Render radar chart
      const config = this.dataService.getConfig(
        view,
        playerId,
        metrics,
        players,
        comparedId || undefined,
        (player, metric) => this.getNormalizedValue(player, metric)
      );

      if (emptyState) emptyState.style.display = 'none';
      if (chartContainer) chartContainer.style.display = 'block';
      if (duelContainer) duelContainer.style.display = 'none';
      
      this.radarChart?.render(config);
    }

    // Enable export buttons
    const exportBtn = this.container?.querySelector('#export-btn') as HTMLButtonElement;
    if (exportBtn) exportBtn.disabled = false;
    
    const exportAnalysisBtn = this.container?.querySelector('#export-analysis-btn') as HTMLButtonElement;
    if (exportAnalysisBtn) exportAnalysisBtn.disabled = false;
  }

  private renderDuelView(
    playerId: string,
    comparedId: string | null,
    players: Player[],
    metrics: MetricConfig[]
  ): void {
    const container = this.container?.querySelector('#duel-view-container');
    if (!container || !comparedId) {
      container && (container.innerHTML = '<p class="stats-placeholder">Sélectionnez deux joueurs pour le duel</p>');
      return;
    }

    const player1 = players.find(p => p.id === playerId);
    const player2 = players.find(p => p.id === comparedId);

    if (!player1 || !player2) return;

    // Clean up previous duel view
    this.duelView?.destroy();
    
    // Create new duel view
    this.duelView = new DuelView(this.core);
    const duelElement = this.duelView.render({ player1, player2, metrics, core: this.core });
    
    container.innerHTML = '';
    container.appendChild(duelElement);
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

  private updateCentilesPanel(): void {
    const playerId = this.core.getState('selectedPlayerId');
    const players = this.core.getState('players');
    const selectedMetrics = this.core.getState('selectedMetrics');
    const container = this.container?.querySelector('#centiles-container');

    if (!playerId || !container) return;

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // Clean up previous centile bars
    container.innerHTML = '';

    // Récupérer les configs de métriques
    const allMetrics = this.core.listMetrics();
    const metricsMap = new Map(allMetrics.map(m => [m.id, m]));

    // IMPORTANT: Calculer les percentiles UNIQUEMENT par rapport aux joueurs du MÊME RÔLE
    const rolePlayers = players.filter(p => p.role === player.role);
    const comparisonPool = rolePlayers.length >= 3 ? rolePlayers : players;

    for (const metricId of selectedMetrics.slice(0, 5)) { // Limit to 5
      const metric = metricsMap.get(metricId) || defaultMetrics.find(m => m.id === metricId);
      if (!metric) continue;

      const value = player.stats[metricId];
      if (value === undefined) continue;

      // Calculate percentile UNIQUEMENT par rapport au pool du même rôle (méthode Strict Below)
      const percentile = this.calculateStrictPercentile(value, metric, comparisonPool);

      // Create centile bar avec le mode d'affichage actuel
      const centileBar = new CentileBar();
      const centileElement = centileBar.render({
        metric,
        player,
        percentile,
        value,
        showGrade: true,
        context: `${player.role}s`, // ex: "MIDs" ou "ADCs"
        displayMode: this.centileViewMode // 'percentiles' ou 'values'
      });

      container.appendChild(centileElement);
    }
  }

  private updateLeaderboard(): void {
    const players = this.core.getState('players');
    const selectedMetrics = this.core.getState('selectedMetrics');
    const currentRole = this.core.getState('currentRole');
    const container = this.container?.querySelector('#leaderboard-container');

    if (!container) return;

    // Clean up previous leaderboard
    this.leaderboardPanel?.destroy();

    // Récupérer les configs de métriques
    const allMetrics = this.core.listMetrics();
    const metricsMap = new Map(allMetrics.map(m => [m.id, m]));
    const metrics: MetricConfig[] = selectedMetrics
      .map(id => metricsMap.get(id) || defaultMetrics.find(m => m.id === id))
      .filter((m): m is MetricConfig => m !== undefined);

    // Create leaderboard
    this.leaderboardPanel = new LeaderboardPanel(this.core);
    const leaderboardElement = this.leaderboardPanel.render({
      players,
      metrics,
      selectedRole: currentRole,
      core: this.core,
      onPlayerSelect: (playerId) => {
        this.core.setState('selectedPlayerId', playerId);
      }
    });

    container.innerHTML = '';
    container.appendChild(leaderboardElement);
  }

  private getNormalizedValue(player: Player, metric: MetricConfig): number {
    const value = player.stats[metric.id];
    if (value === undefined) return 50; // Valeur par défaut
    
    return this.core.normalize.normalize(value, metric, player.role);
  }

  /**
   * Calcule le percentile selon la méthode "Strict Below"
   * - Compare uniquement aux joueurs du même rôle
   * - below = count(v in V where v < x) [strictement inférieur]
   * - percentile = (below / N) * 100
   * - Inversion pour les métriques "lower is better"
   * 
   * @param value - Valeur du joueur
   * @param metricId - ID de la métrique
   * @param metric - Config de la métrique (pour direction)
   * @param rolePlayers - Pool de joueurs du même rôle
   * @returns Percentile (0-100), clampé
   */
  private calculateStrictPercentile(
    value: number,
    metric: MetricConfig,
    rolePlayers: Player[]
  ): number {
    if (rolePlayers.length === 0) return 50;

    // Extraire toutes les valeurs non-NaN pour cette métrique
    const allValues = rolePlayers
      .map(p => p.stats[metric.id])
      .filter((v): v is number => v !== undefined && !isNaN(v));

    if (allValues.length === 0) return 50;
    if (allValues.length === 1) return 50;

    const N = allValues.length;

    // Méthode "Strict Below": count(v < x)
    const below = allValues.filter(v => v < value).length;
    let percentile = (below / N) * 100;

    // Inversion pour les métriques "lower is better"
    // Seulement: Deaths, Death Share, FB Victim
    if (metric.direction === 'lower-is-better') {
      percentile = 100 - percentile;
    }

    // Clamp entre 0 et 100
    return Math.max(0, Math.min(100, percentile));
  }

  private async handleExport(): Promise<void> {
    const playerId = this.core.getState('selectedPlayerId');
    const players = this.core.getState('players');
    const selectedMetrics = this.core.getState('selectedMetrics');
    const view = this.core.getState('currentView');
    const comparedId = this.core.getState('comparedPlayerId');
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
      alert('Veuillez d\'abord sélectionner un joueur');
      return;
    }

    // Récupérer les configs de métriques
    const allMetrics = this.core.listMetrics();
    const metricsMap = new Map(allMetrics.map(m => [m.id, m]));
    const metrics: MetricConfig[] = selectedMetrics
      .map(id => metricsMap.get(id) || defaultMetrics.find(m => m.id === id))
      .filter((m): m is MetricConfig => m !== undefined);

    if (metrics.length === 0) {
      alert('Aucune métrique sélectionnée');
      return;
    }

    // Injecter les styles d'export si pas déjà fait
    ExportRenderService.injectStyles();

    // Créer le service de rendu
    const exportService = new ExportRenderService();
    
    try {
      // Rendu du DOM propre
      const { container, cleanup } = await exportService.render({
        mode: this.currentExportMode,
        player,
        comparePlayer: comparedId ? players.find(p => p.id === comparedId) : undefined,
        metrics,
        view,
        getNormalizedValue: (p, m) => this.getNormalizedValue(p, m),
        getGrade: (p) => GradeCalculator.getGrade(p)
      });

      // Attendre que tout soit rendu
      await new Promise(resolve => setTimeout(resolve, 200));

      // Exporter en PNG
      const dimensions = this.currentExportMode === 'social'
        ? { width: 1080, height: 1080 }
        : { width: 1200, height: 800 };

      const blob = await this.core.export.toPNG(container, {
        mode: this.currentExportMode,
        width: dimensions.width,
        height: dimensions.height,
        scale: 2,
        transparent: false
      });

      // Télécharger
      const filename = `konoha_${player.name}_${player.role}_${this.currentExportMode}_${Date.now()}.png`;
      this.core.export.download(blob, filename);

      // Cleanup
      cleanup();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Erreur lors de l\'export. Veuillez réessayer.');
    }
  }

  private async handleExportAnalysis(): Promise<void> {
    const playerId = this.core.getState('selectedPlayerId');
    const players = this.core.getState('players');
    const selectedMetrics = this.core.getState('selectedMetrics');
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
      alert('Veuillez d\'abord sélectionner un joueur');
      return;
    }

    // Récupérer les configs de métriques
    const allMetrics = this.core.listMetrics();
    const metricsMap = new Map(allMetrics.map(m => [m.id, m]));
    const metrics: MetricConfig[] = selectedMetrics
      .map(id => metricsMap.get(id) || defaultMetrics.find(m => m.id === id))
      .filter((m): m is MetricConfig => m !== undefined);

    if (metrics.length === 0) {
      alert('Aucune métrique sélectionnée');
      return;
    }

    // IMPORTANT: Calculer les percentiles UNIQUEMENT par rapport aux joueurs du MÊME RÔLE
    const rolePlayers = players.filter(p => p.role === player.role);
    const comparisonPool = rolePlayers.length >= 3 ? rolePlayers : players;

    // Créer le conteneur d'export
    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = `
      position: fixed;
      left: -9999px;
      width: 1200px;
      height: 800px;
      background: linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #1a1a25 100%);
      font-family: 'Space Grotesk', sans-serif;
      padding: 60px;
      box-sizing: border-box;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      text-align: center;
      margin-bottom: 40px;
    `;
    header.innerHTML = `
      <h1 style="font-size: 42px; font-weight: 700; color: #fff; margin: 0 0 8px 0;">${player.name}</h1>
      <p style="font-size: 18px; color: rgba(255,255,255,0.6); margin: 0;">${player.team} • ${player.role} • Percentile Analysis</p>
      <p style="font-size: 14px; color: rgba(255,255,255,0.4); margin: 8px 0 0 0;">vs ${comparisonPool.length} ${player.role}s</p>
    `;
    exportContainer.appendChild(header);

    // Grid des métriques
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    `;

    // Catégories
    const categories: Record<string, string> = {
      combat: 'FIGHT',
      vision: 'VISION',
      farming: 'FARMING',
      early: 'EARLY GAME',
      economy: 'RESOURCES'
    };

    const categoryColors: Record<string, string> = {
      combat: '#FF6B6B',
      vision: '#4ECDC4',
      farming: '#FFD93D',
      early: '#A855F7',
      economy: '#00E676'
    };

    // Grouper les métriques par catégorie
    const metricsByCategory: Record<string, MetricConfig[]> = {};
    for (const metric of metrics) {
      if (!metricsByCategory[metric.category]) {
        metricsByCategory[metric.category] = [];
      }
      metricsByCategory[metric.category].push(metric);
    }

    // Créer les cards par catégorie
    for (const [category, catMetrics] of Object.entries(metricsByCategory).slice(0, 3)) {
      const card = document.createElement('div');
      card.style.cssText = `
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 24px;
      `;

      const catHeader = document.createElement('h3');
      catHeader.style.cssText = `
        font-size: 14px;
        font-weight: 700;
        color: ${categoryColors[category] || '#fff'};
        margin: 0 0 20px 0;
        text-transform: uppercase;
        letter-spacing: 1px;
      `;
      catHeader.textContent = categories[category] || category;
      card.appendChild(catHeader);

      // Métriques
      for (const metric of catMetrics.slice(0, 4)) {
        const value = player.stats[metric.id];
        if (value === undefined) continue;

        const percentile = this.calculateStrictPercentile(value, metric, comparisonPool);
        const grade = GradeCalculator.getGrade(percentile);
        const color = GradeCalculator.getGradeColor(grade);

        const metricRow = document.createElement('div');
        metricRow.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        `;
        metricRow.innerHTML = `
          <span style="font-size: 14px; color: rgba(255,255,255,0.8);">${metric.name}</span>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 80px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
              <div style="width: ${percentile}%; height: 100%; background: ${color}; border-radius: 3px;"></div>
            </div>
            <span style="font-size: 14px; font-weight: 700; color: ${color}; min-width: 32px; text-align: right;">${Math.round(percentile)}</span>
          </div>
        `;
        card.appendChild(metricRow);
      }

      grid.appendChild(card);
    }

    exportContainer.appendChild(grid);

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      position: absolute;
      bottom: 40px;
      left: 60px;
      right: 60px;
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
    `;
    footer.innerHTML = `
      <span style="font-size: 14px; color: rgba(255,255,255,0.5);">${player.league || 'KONOHA'} Stats</span>
      <span style="margin: 0 12px; color: rgba(255,255,255,0.3);">|</span>
      <span style="font-size: 14px; color: #4ECDC4;">@LeagueScoutHugo | KONOHA</span>
    `;
    exportContainer.appendChild(footer);

    // Ajouter au DOM temporairement
    document.body.appendChild(exportContainer);

    try {
      // Exporter en PNG
      const blob = await this.core.export.toPNG(exportContainer, {
        mode: 'solo',
        width: 1200,
        height: 800,
        scale: 2,
        transparent: false
      });

      // Télécharger
      const filename = `konoha_${player.name}_${player.role}_percentile_analysis_${Date.now()}.png`;
      this.core.export.download(blob, filename);
    } catch (err) {
      console.error('Export analysis failed:', err);
      alert('Erreur lors de l\'export. Veuillez réessayer.');
    } finally {
      document.body.removeChild(exportContainer);
    }
  }

  destroy(): void {
    // Cleanup subscriptions
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];

    // Destroy components
    this.radarChart?.destroy();
    this.centileBar?.destroy();
    this.duelView?.destroy();
    this.leaderboardPanel?.destroy();
    
    this.radarChart = null;
    this.centileBar = null;
    this.duelView = null;
    this.leaderboardPanel = null;

    // Remove from DOM
    this.container?.remove();
    this.container = null;
  }
}
