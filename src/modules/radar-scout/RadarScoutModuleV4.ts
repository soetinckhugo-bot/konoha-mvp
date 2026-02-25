/**
 * RadarScoutModule - Version V4 Layout
 * Design basé sur les screens utilisateur
 */

import type { CoreAPI, Player, MetricConfig } from '../../core/types';
import { RadarChart } from './components/RadarChart';
import { RadarDataService } from './services/RadarDataService';
import { getMetricsForRole, toMetricConfig, ROLE_COLORS, METRIC_DISPLAY_NAMES, PERCENTILE_CATEGORIES, getRoleWeight } from './config/roleMetrics';

export class RadarScoutModule {
  private core: CoreAPI;
  private container: HTMLElement | null = null;
  private unsubscribers: (() => void)[] = [];
  private radarChart: RadarChart | null = null;
  private dataService: RadarDataService;
  private currentMode: 'solo' | 'compare' | 'benchmark' = 'solo';
  private currentExportMode: 'solo' | 'social' = 'solo';
  private currentRole: string = 'MID';
  private comparedPlayerId: string | null = null;
  private centileViewMode: 'percentiles' | 'values' = 'percentiles';

  constructor(core: CoreAPI) {
    this.core = core;
    this.dataService = new RadarDataService();
  }

  render(): void {
    this.container = document.createElement('div');
    this.container.className = 'radar-scout-module v4-layout';
    this.container.setAttribute('data-role', this.currentRole);
    
    // Layout V4: 3 colonnes avec radar centré
    this.container.innerHTML = `
      <div class="v4-container">
        <!-- LEFT SIDEBAR -->
        <div class="v4-sidebar-left">
          <!-- Player Selection -->
          <div class="v4-section">
            <div class="v4-section-title">
              <span class="v4-icon">👤</span>
              Player Selection
            </div>
            <div class="v4-player-card">
              <select id="player-select" class="v4-select">
                <option value="">Select Player</option>
              </select>
            </div>
          </div>

          <!-- Analysis Mode -->
          <div class="v4-section">
            <div class="v4-section-title">
              <span class="v4-icon">📊</span>
              Analysis Mode
            </div>
            <div class="v4-modes">
              <button class="v4-mode-btn active" data-mode="solo">
                <span class="mode-icon">🔷</span>
                <span class="mode-name">Individual</span>
                <span class="mode-desc">Solo Analysis</span>
              </button>
              <button class="v4-mode-btn" data-mode="compare">
                <span class="mode-icon">⚔️</span>
                <span class="mode-name">Comparison</span>
                <span class="mode-desc">1 vs 1</span>
              </button>
              <button class="v4-mode-btn" data-mode="benchmark">
                <span class="mode-icon">📈</span>
                <span class="mode-name">Benchmark</span>
                <span class="mode-desc">vs Average</span>
              </button>
            </div>
          </div>

          <!-- Timeframe -->
          <div class="v4-section">
            <div class="v4-section-title">
              <span class="v4-icon">⏱️</span>
              Timeframe
            </div>
            <div class="v4-timeframes">
              <button class="v4-time-btn active" data-time="all">
                <span class="time-icon">⊞</span>
                <span>All</span>
              </button>
              <button class="v4-time-btn" data-time="10">
                <span class="time-icon">10</span>
                <span>Minutes</span>
              </button>
              <button class="v4-time-btn" data-time="15">
                <span class="time-icon">15</span>
                <span>Minutes</span>
              </button>
            </div>
          </div>
        </div>

        <!-- CENTER - RADAR -->
        <div class="v4-center">
          <div class="v4-radar-header">
            <div class="v4-player-info">
              <span id="selected-player-name" class="v4-player-name">Select a player</span>
              <span id="selected-player-role" class="v4-player-role-badge">MID</span>
            </div>
            <div class="v4-view-toggle">
              <button class="v4-toggle-btn active" data-view="percentile">📊 PERCENTILES</button>
              <button class="v4-toggle-btn" data-view="values">📈 VALUES</button>
            </div>
          </div>
          
          <div class="v4-radar-container">
            <div id="radar-chart-container" class="v4-radar-chart"></div>
            <div id="radar-empty" class="v4-radar-empty">
              <div class="empty-icon">📊</div>
              <p>Select a player to analyze</p>
            </div>
          </div>

          <!-- Roles Selection - BOTTOM -->
          <div class="v4-roles-section">
            <div class="v4-roles-title">
              <span class="v4-icon">🎭</span>
              Roles
            </div>
            <div class="v4-roles-grid">
              <button class="v4-role-btn" data-role="ALL">
                <span class="role-icon">✱</span>
                <span class="role-name">ALL</span>
              </button>
              <button class="v4-role-btn" data-role="TOP">
                <span class="role-icon">🛡️</span>
                <span class="role-name">TOP</span>
              </button>
              <button class="v4-role-btn" data-role="JUNGLE">
                <span class="role-icon">🌲</span>
                <span class="role-name">JGL</span>
              </button>
              <button class="v4-role-btn active" data-role="MID">
                <span class="role-icon">⚡</span>
                <span class="role-name">MID</span>
              </button>
              <button class="v4-role-btn" data-role="ADC">
                <span class="role-icon">🎯</span>
                <span class="role-name">ADC</span>
              </button>
              <button class="v4-role-btn" data-role="SUPPORT">
                <span class="role-icon">💚</span>
                <span class="role-name">SUP</span>
              </button>
            </div>
          </div>

          <!-- Metrics for Selected Role -->
          <div class="v4-section v4-metrics-section">
            <div class="v4-section-title">
              <span class="v4-metrics-icon" id="role-metrics-icon">⚡</span>
              <span id="role-metrics-title">METRICS MID</span>
            </div>
            <div id="role-metrics-list" class="v4-role-metrics">
              <!-- Metrics pills will be rendered here -->
            </div>
          </div>

          <!-- Active Metrics -->
          <div class="v4-section">
            <div class="v4-section-title v4-active-title">
              <span>Active Metrics</span>
              <span id="active-metrics-count" class="v4-count">0</span>
            </div>
            <div id="active-metrics-list" class="v4-active-metrics">
              <!-- Active metric pills -->
            </div>
          </div>
        </div>

        <!-- RIGHT SIDEBAR -->
        <div class="v4-sidebar-right">
          <!-- Leaderboard -->
          <div class="v4-panel">
            <div class="v4-panel-header">
              <span class="v4-icon">👑</span>
              <span>Leaderboard</span>
              <button class="v4-filter-btn">🔽</button>
            </div>
            <div id="leaderboard-container" class="v4-leaderboard"></div>
          </div>

          <!-- Player Tiers (4 tiers pour score global) -->
          <div class="v4-panel v4-tiers-panel">
            <div class="v4-panel-header">
              <span class="v4-icon">📊</span>
              <span>PLAYER TIERS</span>
            </div>
            <div class="v4-tiers-legend">
              <div class="v4-tier-item tier-s">
                <span class="v4-tier-badge">S</span>
                <span class="v4-tier-name">ELITE</span>
                <span class="v4-tier-range">100-75</span>
              </div>
              <div class="v4-tier-item tier-a">
                <span class="v4-tier-badge">A</span>
                <span class="v4-tier-name">EXCELLENT</span>
                <span class="v4-tier-range">75-60</span>
              </div>
              <div class="v4-tier-item tier-b">
                <span class="v4-tier-badge">B</span>
                <span class="v4-tier-name">GOOD</span>
                <span class="v4-tier-range">60-50</span>
              </div>
              <div class="v4-tier-item tier-d">
                <span class="v4-tier-badge">C</span>
                <span class="v4-tier-name">WEAK</span>
                <span class="v4-tier-range">&lt;50</span>
              </div>
            </div>
          </div>

          <!-- Stats Tiers (5 tiers pour métriques individuelles) -->
          <div class="v4-panel v4-tiers-panel">
            <div class="v4-panel-header">
              <span class="v4-icon">📈</span>
              <span>STATS TIERS</span>
            </div>
            <div class="v4-tiers-legend compact">
              <div class="v4-tier-item tier-s">
                <span class="v4-tier-badge">S</span>
                <span class="v4-tier-name">ELITE</span>
                <span class="v4-tier-range">100-90</span>
              </div>
              <div class="v4-tier-item tier-a">
                <span class="v4-tier-badge">A</span>
                <span class="v4-tier-name">EXCELLENT</span>
                <span class="v4-tier-range">90-80</span>
              </div>
              <div class="v4-tier-item tier-b">
                <span class="v4-tier-badge">B</span>
                <span class="v4-tier-name">GOOD</span>
                <span class="v4-tier-range">80-65</span>
              </div>
              <div class="v4-tier-item tier-c">
                <span class="v4-tier-badge">C</span>
                <span class="v4-tier-name">AVERAGE</span>
                <span class="v4-tier-range">65-50</span>
              </div>
              <div class="v4-tier-item tier-d">
                <span class="v4-tier-badge">D</span>
                <span class="v4-tier-name">WEAK</span>
                <span class="v4-tier-range">&lt;50</span>
              </div>
            </div>
          </div>

          <!-- Export -->
          <div class="v4-panel v4-export-panel">
            <button id="export-btn" class="v4-export-btn" disabled>
              <span>📷</span> EXPORT PNG
            </button>
            <button id="export-analysis-btn" class="v4-export-btn v4-export-analysis" disabled style="margin-top: 8px; background: linear-gradient(135deg, #4ECDC4 0%, #2dd4bf 100%);">
              <span>📊</span> EXPORT ANALYSIS
            </button>
            <div class="v4-export-modes">
              <button class="v4-export-mode active" data-mode="solo">Solo</button>
              <button class="v4-export-mode" data-mode="social">Social</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Centiles Panel -->
      <div id="centiles-panel" class="v4-centiles-panel">
        <div class="v4-centiles-header">
          <div class="v4-centiles-title">
            <span class="v4-icon">📊</span>
            Percentile Analysis
            <span class="v4-centiles-subtitle">Player position vs league</span>
          </div>
          <div class="v4-centiles-actions">
            <div class="centile-toggle">
              <button class="centile-toggle-btn ${this.centileViewMode === 'percentiles' ? 'active' : ''}" data-mode="percentiles" title="View percentiles">％</button>
              <button class="centile-toggle-btn ${this.centileViewMode === 'values' ? 'active' : ''}" data-mode="values" title="View raw values">123</button>
            </div>
          </div>
        </div>
        <div class="v4-centiles-categories">
          <div class="v4-centiles-category">
            <h4>Fight</h4>
            <div id="centiles-fight" class="v4-centiles-list">
              <p class="v4-no-data">Import data to see percentile analysis</p>
            </div>
          </div>
          <div class="v4-centiles-category">
            <h4>Vision</h4>
            <div id="centiles-vision" class="v4-centiles-list">
              <p class="v4-no-data">Import data to see percentile analysis</p>
            </div>
          </div>
          <div class="v4-centiles-category">
            <h4>Resources</h4>
            <div id="centiles-resources" class="v4-centiles-list">
              <p class="v4-no-data">Import data to see percentile analysis</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const mountPoint = document.getElementById('module-container');
    if (mountPoint) {
      mountPoint.appendChild(this.container);
    }

    this.radarChart = new RadarChart('radar-chart-container');
    this.setupEventHandlers();
    this.setupSubscriptions();
    this.updatePlayerSelects();
    this.renderRoleMetrics('MID');
    this.updateView();
  }

  private setupEventHandlers(): void {
    if (!this.container) return;

    // Role buttons
    const roleBtns = this.container.querySelectorAll('.v4-role-btn');
    roleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.getAttribute('data-role') as string;
        this.currentRole = role;
        
        // Update data-role attribute for theme effects
        this.container?.setAttribute('data-role', role);
        
        roleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.core.setState('currentRole', role as any);
        this.renderRoleMetrics(role);
        this.updatePlayerSelects();
        this.updateLeaderboard();
        this.updateView();
      });
    });

    // Player select
    const playerSelect = this.container.querySelector('#player-select') as HTMLSelectElement;
    playerSelect?.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      this.core.setState('selectedPlayerId', value || null);
      
      // Update player name display
      const playerNameEl = this.container?.querySelector('#selected-player-name');
      const playerRoleEl = this.container?.querySelector('#selected-player-role');
      
      if (value && playerNameEl && playerRoleEl) {
        const players = this.core.getState('players');
        const player = players.find(p => p.id === value);
        if (player) {
          playerNameEl.textContent = player.name;
          playerRoleEl.textContent = player.role;
          playerRoleEl.setAttribute('data-role', player.role);
        }
      }
    });

    // Export buttons
    const exportBtn = this.container.querySelector('#export-btn') as HTMLButtonElement;
    exportBtn?.addEventListener('click', () => this.handleExport());
    
    const exportAnalysisBtn = this.container.querySelector('#export-analysis-btn') as HTMLButtonElement;
    exportAnalysisBtn?.addEventListener('click', () => this.handleExportAnalysis());

    // Mode buttons (solo/compare/benchmark)
    const modeBtns = this.container.querySelectorAll('.v4-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode') as 'solo' | 'compare' | 'benchmark';
        this.currentMode = mode;
        
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Si mode compare, montrer sélection du 2ème joueur
        if (mode === 'compare') {
          this.showComparePlayerSelect();
        } else {
          this.hideComparePlayerSelect();
        }
        
        this.updateView();
      });
    });

    // Export mode buttons (solo/social)
    const exportModeBtns = this.container.querySelectorAll('.v4-export-mode');
    exportModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode') as 'solo' | 'social';
        this.currentExportMode = mode;
        
        exportModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Centile view toggle
    const centileToggleBtns = this.container.querySelectorAll('.centile-toggle-btn');
    centileToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode') as 'percentiles' | 'values';
        this.centileViewMode = mode;
        
        centileToggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Re-render centiles
        this.updateCentilesPanel();
      });
    });
  }

  private showComparePlayerSelect(): void {
    // Créer un dropdown pour sélectionner le 2ème joueur si pas déjà présent
    let compareSelect = this.container?.querySelector('#compare-player-select') as HTMLSelectElement;
    if (!compareSelect) {
      const container = this.container?.querySelector('.v4-player-card');
      if (container) {
        compareSelect = document.createElement('select');
        compareSelect.id = 'compare-player-select';
        compareSelect.className = 'v4-select';
        compareSelect.style.marginTop = '8px';
        compareSelect.innerHTML = '<option value="">Select opponent...</option>';
        container.appendChild(compareSelect);
        
        compareSelect.addEventListener('change', (e) => {
          this.comparedPlayerId = (e.target as HTMLSelectElement).value || null;
          this.updateView();
        });
      }
    }
    this.updateComparePlayerOptions();
    if (compareSelect) compareSelect.style.display = 'block';
  }

  private hideComparePlayerSelect(): void {
    const compareSelect = this.container?.querySelector('#compare-player-select') as HTMLSelectElement;
    if (compareSelect) compareSelect.style.display = 'none';
  }

  private updateComparePlayerOptions(): void {
    const compareSelect = this.container?.querySelector('#compare-player-select') as HTMLSelectElement;
    if (!compareSelect) return;
    
    const players = this.core.getState('players');
    const selectedPlayerId = this.core.getState('selectedPlayerId');
    
    const filteredPlayers = this.currentRole === 'ALL' 
      ? players.filter((p: Player) => p.id !== selectedPlayerId)
      : players.filter((p: Player) => p.role === this.currentRole && p.id !== selectedPlayerId);
    
    const options = filteredPlayers.map((p: Player) => 
      `<option value="${p.id}">${p.name} (${p.team})</option>`
    ).join('');
    
    compareSelect.innerHTML = `<option value="">Select opponent...</option>${options}`;
  }

  private setupSubscriptions(): void {
    const unsubPlayer = this.core.subscribe('selectedPlayerId', () => {
      this.updateView();
      this.updateCentilesPanel();
    });
    this.unsubscribers.push(unsubPlayer);

    const unsubPlayers = this.core.subscribe('players', () => {
      this.updatePlayerSelects();
      this.updateLeaderboard();
    });
    this.unsubscribers.push(unsubPlayers);
  }

  private renderRoleMetrics(role: string): void {
    const container = this.container?.querySelector('#role-metrics-list');
    const titleEl = this.container?.querySelector('#role-metrics-title');
    const iconEl = this.container?.querySelector('#role-metrics-icon');
    
    if (!container) return;

    // Update title
    if (titleEl) titleEl.textContent = `METRICS ${role}`;
    if (iconEl) {
      const icons: Record<string, string> = {
        'TOP': '🛡️', 'JUNGLE': '🌲', 'MID': '⚡', 'ADC': '🎯', 'SUPPORT': '💚', 'ALL': '✱'
      };
      iconEl.textContent = icons[role] || '⚡';
    }

    const metrics = getMetricsForRole(role);
    
    // Update available metrics in state
    const metricIds = metrics.map(m => m.id);
    this.core.setState('availableMetrics', metricIds);
    
    container.innerHTML = metrics.map(m => `
      <button class="v4-metric-pill ${m.inverted ? 'inverted' : ''} ${m.category}" data-metric="${m.id}">
        <span class="pill-name">${m.name}</span>
        <span class="pill-arrow">${m.inverted ? '↓' : '↑'}</span>
      </button>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.v4-metric-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        pill.classList.toggle('active');
        this.updateActiveMetrics();
      });
    });

    // Auto-select ALL metrics (toutes les métriques du rôle)
    const pills = container.querySelectorAll('.v4-metric-pill');
    pills.forEach(pill => pill.classList.add('active'));
    
    this.updateActiveMetrics();
  }

  private updateActiveMetrics(): void {
    const container = this.container?.querySelector('#active-metrics-list');
    const countEl = this.container?.querySelector('#active-metrics-count');
    
    if (!container) return;

    const activePills = this.container?.querySelectorAll('.v4-metric-pill.active');
    const activeIds = Array.from(activePills || []).map(p => p.getAttribute('data-metric') || '');
    
    if (countEl) countEl.textContent = String(activeIds.length);
    
    // Update core state
    this.core.setState('selectedMetrics', activeIds);

    // Render active pills
    container.innerHTML = activeIds.map(id => {
      const metrics = getMetricsForRole(this.currentRole);
      const metric = metrics.find(m => m.id === id);
      if (!metric) return '';
      
      return `
        <div class="v4-active-pill ${metric.inverted ? 'inverted' : ''} ${metric.category}">
          <span>${metric.name}</span>
          <button class="v4-remove-metric" data-metric="${id}">×</button>
        </div>
      `;
    }).join('');

    // Add remove handlers
    container.querySelectorAll('.v4-remove-metric').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const metricId = btn.getAttribute('data-metric');
        const pill = this.container?.querySelector(`.v4-metric-pill[data-metric="${metricId}"]`);
        pill?.classList.remove('active');
        this.updateActiveMetrics();
      });
    });
  }

  private updatePlayerSelects(): void {
    const players = this.core.getState('players');
    const playerSelect = this.container?.querySelector('#player-select') as HTMLSelectElement;

    if (!playerSelect) return;

    // Filter by current role
    const filteredPlayers = this.currentRole === 'ALL' 
      ? players 
      : players.filter(p => p.role === this.currentRole);

    const options = filteredPlayers.map(p => 
      `<option value="${p.id}">${p.name} (${p.team})</option>`
    ).join('');

    playerSelect.innerHTML = `<option value="">Select Player</option>${options}`;
  }

  private updateView(): void {
    const playerId = this.core.getState('selectedPlayerId');
    const players = this.core.getState('players');
    const selectedMetrics = this.core.getState('selectedMetrics');

    const emptyState = this.container?.querySelector('#radar-empty') as HTMLElement;
    const chartContainer = this.container?.querySelector('#radar-chart-container') as HTMLElement;

    if (!playerId || players.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (chartContainer) chartContainer.style.display = 'none';
      return;
    }

    const metrics: MetricConfig[] = selectedMetrics
      .map(id => {
        const roleMetrics = getMetricsForRole(this.currentRole);
        const roleMetric = roleMetrics.find(m => m.id === id);
        return roleMetric ? toMetricConfig(roleMetric) : undefined;
      })
      .filter((m): m is MetricConfig => m !== undefined);

    if (metrics.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (chartContainer) chartContainer.style.display = 'none';
      return;
    }

    // IMPORTANT: Filtrer par rôle pour le calcul des percentiles
    const rolePlayers = this.currentRole === 'ALL' 
      ? players 
      : players.filter(p => p.role === this.currentRole);

    const config = this.dataService.getConfig(
      this.currentMode,
      playerId,
      metrics,
      players,
      this.comparedPlayerId || undefined,
      // Le radar affiche les PERCENTILES (0-100), pas les valeurs brutes
      (player, metric) => {
        const value = player.stats[metric.id];
        if (value === undefined) return 50;
        return this.calculatePercentileForRole(value, metric.id, rolePlayers);
      }
    );

    // Ajouter les tiers pour colorer les points du radar (5 tiers S/A/B/C/D)
    config.datasets.forEach(ds => {
      ds.pointTiers = ds.data.map((percentile: number) => {
        if (percentile >= 90) return 'S';
        if (percentile >= 80) return 'A';
        if (percentile >= 65) return 'B';
        if (percentile >= 50) return 'C';
        return 'D';
      });
    });

    if (emptyState) emptyState.style.display = 'none';
    if (chartContainer) chartContainer.style.display = 'block';
    
    this.radarChart?.render(config);

    const exportBtn = this.container?.querySelector('#export-btn') as HTMLButtonElement;
    if (exportBtn) exportBtn.disabled = false;
    
    const exportAnalysisBtn = this.container?.querySelector('#export-analysis-btn') as HTMLButtonElement;
    if (exportAnalysisBtn) exportAnalysisBtn.disabled = false;
  }

  /**
   * Met à jour le panneau des centiles avec calcul par rôle
   * Les percentiles sont calculés par rapport aux joueurs du même rôle
   */
  private updateCentilesPanel(): void {
    const playerId = this.core.getState('selectedPlayerId');
    const players = this.core.getState('players');
    const selectedMetrics = this.core.getState('selectedMetrics');
    
    if (!playerId) return;
    
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // Filter players by current role for percentile calculation
    // Les centiles doivent être calculés par rapport aux joueurs du même rôle
    const filteredPlayers = this.currentRole === 'ALL' 
      ? players 
      : players.filter(p => p.role === this.currentRole);

    // Group metrics by the 3 categories: fight, vision, resources
    const metricsByCategory: Record<string, string[]> = {
      'fight': [],
      'vision': [],
      'resources': []
    };

    selectedMetrics.forEach((metricId: string) => {
      let category: string | null = null;
      if (PERCENTILE_CATEGORIES.fight.includes(metricId)) category = 'fight';
      else if (PERCENTILE_CATEGORIES.vision.includes(metricId)) category = 'vision';
      else if (PERCENTILE_CATEGORIES.resources.includes(metricId)) category = 'resources';
      
      if (category) {
        metricsByCategory[category].push(metricId);
      }
    });

    // Color scale for percentiles - 5 tiers S/A/B/C/D (Stats Tiers)
    const getPercentileColor = (p: number): string => {
      if (p >= 90) return '#00D9C0'; // S - Elite - Cyan
      if (p >= 80) return '#4ADE80'; // A - Excellent - Green
      if (p >= 65) return '#FACC15'; // B - Good - Yellow
      if (p >= 50) return '#FB923C'; // C - Average - Orange
      return '#EF4444'; // D - Weak - Red
    };
    
    const getGrade = (p: number): string => {
      if (p >= 90) return 'S';
      if (p >= 80) return 'A';
      if (p >= 65) return 'B';
      if (p >= 50) return 'C';
      return 'D';
    };

    // Render centiles for each category
    Object.entries(metricsByCategory).forEach(([cat, metricIds]) => {
      const container = this.container?.querySelector(`#centiles-${cat}`) as HTMLElement;
      if (!container) return;

      if (metricIds.length === 0) {
        container.innerHTML = '<p class="v4-no-data">No metrics for this category</p>';
        return;
      }

      // Calculate percentiles based on filtered players (same role)
      const sortedMetrics = metricIds
        .map(metricId => {
          const value = player.stats[metricId];
          const percentile = value !== undefined 
            ? this.calculatePercentileForRole(value, metricId, filteredPlayers)
            : 0;
          return { metricId, percentile, value };
        })
        .sort((a, b) => b.percentile - a.percentile);

      container.innerHTML = sortedMetrics.map(({ metricId, percentile, value }) => {
        const displayName = METRIC_DISPLAY_NAMES[metricId] || metricId;
        const barColor = getPercentileColor(percentile);
        const grade = getGrade(percentile);
        
        // Display value based on mode: percentiles or raw values
        const displayValue = this.centileViewMode === 'values' 
          ? (value !== undefined ? value.toFixed(1) : '-')
          : Math.round(percentile).toString();

        return `
          <div class="v4-centile-row">
            <span class="v4-centile-name" title="${displayName}">${displayName}</span>
            <div class="v4-centile-bar-container">
              <div class="v4-centile-bar-bg">
                <div class="v4-centile-bar-fill" style="width: ${percentile}%; background: ${barColor}"></div>
              </div>
            </div>
            <span class="v4-centile-grade" style="color: ${barColor}; font-weight: bold; margin-right: 8px;">${grade}</span>
            <span class="v4-centile-value" style="color: ${barColor}; min-width: 32px; text-align: right;">${displayValue}</span>
          </div>
        `;
      }).join('');
    });

    // Show centiles panel
    const centilesPanel = this.container?.querySelector('#centiles-panel') as HTMLElement;
    if (centilesPanel) centilesPanel.style.display = 'block';
  }

  /**
   * Calcule le percentile d'une valeur par rapport aux joueurs du même rôle
   * @param value - Valeur du joueur
   * @param metricId - ID de la métrique
   * @param rolePlayers - Liste des joueurs du même rôle
   * @returns Percentile (0-100)
   */
  private calculatePercentileForRole(
    value: number, 
    metricId: string, 
    rolePlayers: Player[]
  ): number {
    if (rolePlayers.length === 0) return 50;

    // Get all values for this metric from players of the same role
    const allValues = rolePlayers
      .map(p => p.stats[metricId])
      .filter((v): v is number => v !== undefined && !isNaN(v));

    if (allValues.length === 0) return 50;
    if (allValues.length === 1) return 50;

    // Min-max normalization: best player = 100, worst = 0
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    
    // If all values are the same, return 50
    if (max === min) return 50;
    
    // Return percentile: 0-100 scale based on min-max
    // Best player (max) gets 100, worst (min) gets 0
    return ((value - min) / (max - min)) * 100;
  }

  /**
   * Met à jour le leaderboard avec calcul pondéré V4
   * Utilise ROLE_WEIGHTS_V4 pour pondérer les métriques selon leur importance par rôle
   */
  private updateLeaderboard(): void {
    const players = this.core.getState('players');
    const selectedMetrics = this.core.getState('selectedMetrics');
    const container = this.container?.querySelector('#leaderboard-container') as HTMLElement;
    
    if (!container || players.length === 0) return;

    // Filter players by current role
    const filteredPlayers = this.currentRole === 'ALL' 
      ? players 
      : players.filter(p => p.role === this.currentRole);

    if (filteredPlayers.length === 0) {
      container.innerHTML = '<p class="v4-no-data">No players for this role</p>';
      return;
    }

    // Calculate role-specific metric ranges for accurate normalization
    const metricRanges = this.calculateRoleMetricRanges(filteredPlayers, selectedMetrics);

    // Calculate weighted scores for each player
    const playerScores = filteredPlayers.map(player => {
      let weightedSum = 0;
      let totalWeight = 0;

      selectedMetrics.forEach((metricId: string) => {
        const value = player.stats[metricId];
        if (value === undefined) return;

        const roleMetrics = getMetricsForRole(this.currentRole);
        const metricDef = roleMetrics.find(m => m.id === metricId);
        if (!metricDef) return;

        // Get role-specific weight (V4 coefficients)
        const weight = getRoleWeight(player.role, metricId);
        
        // Skip metrics with weight 0 (ex: win_rate)
        if (weight === 0) return;

        // Normalize value using role-specific ranges
        const range = metricRanges[metricId] || { min: 0, max: 100 };
        const rangeDiff = range.max - range.min;
        let normalized = rangeDiff === 0 
          ? 50 
          : ((value - range.min) / rangeDiff) * 100;
        
        // Clamp to 0-100
        normalized = Math.max(0, Math.min(100, normalized));

        // Invert for "lower is better" metrics
        const score = metricDef.inverted ? 100 - normalized : normalized;
        
        // Apply weight
        weightedSum += score * weight;
        totalWeight += weight;
      });

      // Calculate weighted average
      const weightedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
      
      // Get grade based on weighted score
      const grade = this.getPlayerGrade(weightedScore);

      return { player, score: weightedScore, grade };
    });

    // Sort by score descending
    playerScores.sort((a, b) => b.score - a.score);

    // Render top 10 avec grades style V4
    container.innerHTML = playerScores.slice(0, 10).map((item, index) => {
      // Grade colors avec fond
      const gradeStyles: Record<string, { bg: string; text: string }> = {
        'S': { bg: 'rgba(0, 217, 192, 0.2)', text: '#00D9C0' },
        'A': { bg: 'rgba(74, 222, 128, 0.2)', text: '#4ADE80' },
        'B': { bg: 'rgba(250, 204, 21, 0.2)', text: '#FACC15' },
        'C': { bg: 'rgba(251, 146, 60, 0.2)', text: '#FB923C' },
      };
      const style = gradeStyles[item.grade] || gradeStyles['C'];

      const rankClass = index < 3 ? `rank-${index + 1}` : '';
      const rankDisplay = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}`;

      return `
        <div class="v4-leaderboard-row ${rankClass}" data-player-id="${item.player.id}">
          <span class="v4-leaderboard-rank">${rankDisplay}</span>
          <div class="v4-leaderboard-info">
            <span class="v4-leaderboard-name">${item.player.name}</span>
            <span class="v4-leaderboard-team">${item.player.team}</span>
          </div>
          <div class="v4-leaderboard-grade-badge" style="background: ${style.bg}; color: ${style.text}; border: 1px solid ${style.text}">
            ${item.grade}
          </div>
          <span class="v4-leaderboard-score">${Math.round(item.score)}</span>
        </div>
      `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.v4-leaderboard-row').forEach(row => {
      row.addEventListener('click', () => {
        const playerId = row.getAttribute('data-player-id');
        if (playerId) {
          this.core.setState('selectedPlayerId', playerId as string);
          // Update player select dropdown
          const select = this.container?.querySelector('#player-select') as HTMLSelectElement;
          if (select) select.value = playerId;
        }
      });
    });
  }

  /**
   * Calcule les plages de valeurs par métrique pour le rôle actuel
   * Permet une normalisation précise basée sur les données réelles
   */
  private calculateRoleMetricRanges(
    players: Player[], 
    metricIds: string[]
  ): Record<string, { min: number; max: number }> {
    const ranges: Record<string, { min: number; max: number }> = {};

    metricIds.forEach(metricId => {
      const values = players
        .map(p => p.stats[metricId])
        .filter((v): v is number => v !== undefined && !isNaN(v));

      if (values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        // Add small padding to avoid division by zero
        const padding = max === min ? 1 : (max - min) * 0.05;
        ranges[metricId] = { 
          min: min - padding, 
          max: max + padding 
        };
      } else {
        ranges[metricId] = { min: 0, max: 100 };
      }
    });

    return ranges;
  }

  /**
   * Détermine le grade d'un joueur basé sur son score pondéré
   * Seuils basés sur la V4:
   * - S: 75-100 (Elite)
   * - A: 60-74 (Excellent)
   * - B: 50-59 (Good)
   * - C: <50 (Weak)
   */
  private getPlayerGrade(score: number): 'S' | 'A' | 'B' | 'C' {
    if (score >= 75) return 'S';
    if (score >= 60) return 'A';
    if (score >= 50) return 'B';
    return 'C';
  }

  private getNormalizedValue(player: Player, metric: MetricConfig): number {
    const value = player.stats[metric.id];
    if (value === undefined) return 50;
    return this.core.normalize.normalize(value, metric, player.role);
  }

  private async handleExport(): Promise<void> {
    const playerId = this.core.getState('selectedPlayerId');
    const players = this.core.getState('players');
    const selectedMetrics = this.core.getState('selectedMetrics');
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
      alert('Please select a player first');
      return;
    }

    // Determine export dimensions based on mode
    const isSocial = this.currentExportMode === 'social';
    const exportWidth = isSocial ? 1080 : 1200;
    const exportHeight = isSocial ? 1080 : 800;
    
    // Create export container
    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = `
      position: fixed;
      left: -9999px;
      width: ${exportWidth}px;
      height: ${exportHeight}px;
      background: linear-gradient(135deg, #0B0E14 0%, #151A25 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: ${isSocial ? '40px' : '60px'};
      font-family: 'Space Grotesk', sans-serif;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = isSocial 
      ? `${player.name}` 
      : `${player.name} - ${player.role} Analysis`;
    title.style.cssText = `
      font-size: ${isSocial ? '56px' : '48px'};
      font-weight: 700;
      color: ${ROLE_COLORS[player.role as keyof typeof ROLE_COLORS] || '#60A5FA'};
      margin-bottom: ${isSocial ? '20px' : '10px'};
      text-align: center;
    `;
    exportContainer.appendChild(title);

    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.textContent = isSocial 
      ? `${player.team} | ${player.role}` 
      : player.team;
    subtitle.style.cssText = `
      font-size: ${isSocial ? '32px' : '24px'};
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: ${isSocial ? '60px' : '40px'};
    `;
    exportContainer.appendChild(subtitle);

    // Radar container
    const radarContainer = document.createElement('div');
    radarContainer.id = 'export-radar-temp';
    radarContainer.style.cssText = isSocial 
      ? 'width: 800px; height: 550px;' 
      : 'width: 700px; height: 450px;';
    exportContainer.appendChild(radarContainer);

    // Footer
    const footer = document.createElement('p');
    footer.textContent = 'KONOHA - League Scout Analysis';
    footer.style.cssText = `
      font-size: 16px;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 40px;
    `;
    exportContainer.appendChild(footer);

    document.body.appendChild(exportContainer);

    try {
      // Render radar
      const metrics: MetricConfig[] = selectedMetrics
        .map((id: string) => {
          const roleMetrics = getMetricsForRole(this.currentRole);
          const roleMetric = roleMetrics.find(m => m.id === id);
          return roleMetric ? toMetricConfig(roleMetric) : undefined;
        })
        .filter((m): m is MetricConfig => m !== undefined);

      if (metrics.length > 0 && playerId) {
        const tempRadar = new RadarChart('export-radar-temp');
        const config = this.dataService.getConfig(
          'solo',
          playerId,
          metrics,
          players,
          undefined,
          (p, m) => this.getNormalizedValue(p, m)
        );
        tempRadar.render(config);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        tempRadar.destroy();
      }

      // Export
      const blob = await this.core.export.toPNG(exportContainer, {
        mode: this.currentExportMode,
        width: exportWidth,
        height: exportHeight,
        scale: 2,
        transparent: false
      });
      
      const filename = isSocial 
        ? `konoha_${player.name}_${player.role}_social.png`
        : `konoha_${player.name}_${player.role}_analysis.png`;
      this.core.export.download(blob, filename);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      document.body.removeChild(exportContainer);
    }
  }

  /**
   * Exporte le percentile analysis en PNG
   * Format 1200x800 avec grille des métriques par catégorie
   */
  private async handleExportAnalysis(): Promise<void> {
    const playerId = this.core.getState('selectedPlayerId');
    const players = this.core.getState('players');
    const selectedMetrics = this.core.getState('selectedMetrics');
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
      alert('Please select a player first');
      return;
    }

    // Filter by role for percentile calculation
    const rolePlayers = this.currentRole === 'ALL' 
      ? players 
      : players.filter(p => p.role === this.currentRole);

    // Create export container
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
    header.style.cssText = 'text-align: center; margin-bottom: 40px;';
    header.innerHTML = `
      <h1 style="font-size: 42px; font-weight: 700; color: #fff; margin: 0 0 8px 0;">${player.name}</h1>
      <p style="font-size: 18px; color: rgba(255,255,255,0.6); margin: 0;">${player.team} • ${player.role} • Percentile Analysis</p>
      <p style="font-size: 14px; color: rgba(255,255,255,0.4); margin: 8px 0 0 0;">vs ${rolePlayers.length} ${player.role}s</p>
    `;
    exportContainer.appendChild(header);

    // Categories
    const categories: Record<string, string> = { fight: 'FIGHT', vision: 'VISION', resources: 'RESOURCES' };
    const categoryColors: Record<string, string> = { fight: '#FF6B6B', vision: '#4ECDC4', resources: '#FFD93D' };

    // Group metrics
    const metricsByCategory: Record<string, string[]> = { fight: [], vision: [], resources: [] };
    selectedMetrics.forEach((metricId: string) => {
      if (PERCENTILE_CATEGORIES.fight.includes(metricId)) metricsByCategory.fight.push(metricId);
      else if (PERCENTILE_CATEGORIES.vision.includes(metricId)) metricsByCategory.vision.push(metricId);
      else if (PERCENTILE_CATEGORIES.resources.includes(metricId)) metricsByCategory.resources.push(metricId);
    });

    // Grid
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;';

    for (const [cat, metricIds] of Object.entries(metricsByCategory)) {
      if (metricIds.length === 0) continue;
      
      const card = document.createElement('div');
      card.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px;';

      const catHeader = document.createElement('h3');
      catHeader.style.cssText = `font-size: 14px; font-weight: 700; color: ${categoryColors[cat]}; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1px;`;
      catHeader.textContent = categories[cat];
      card.appendChild(catHeader);

      // Sort by percentile
      const sortedMetrics = metricIds
        .map(metricId => {
          const value = player.stats[metricId];
          const percentile = value !== undefined 
            ? this.calculatePercentileForRole(value, metricId, rolePlayers)
            : 0;
          return { metricId, percentile, value };
        })
        .sort((a, b) => b.percentile - a.percentile);

      for (const { metricId, percentile } of sortedMetrics.slice(0, 5)) {
        const displayName = METRIC_DISPLAY_NAMES[metricId] || metricId;
        let barColor = '#FB923C';
        if (percentile >= 90) barColor = '#00D9C0';
        else if (percentile >= 80) barColor = '#4ADE80';
        else if (percentile >= 60) barColor = '#FACC15';

        const metricRow = document.createElement('div');
        metricRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;';
        metricRow.innerHTML = `
          <span style="font-size: 14px; color: rgba(255,255,255,0.8);">${displayName}</span>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 80px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
              <div style="width: ${percentile}%; height: 100%; background: ${barColor}; border-radius: 3px;"></div>
            </div>
            <span style="font-size: 14px; font-weight: 700; color: ${barColor}; min-width: 32px; text-align: right;">${Math.round(percentile)}</span>
          </div>
        `;
        card.appendChild(metricRow);
      }

      grid.appendChild(card);
    }

    exportContainer.appendChild(grid);

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = 'position: absolute; bottom: 40px; left: 60px; right: 60px; text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);';
    footer.innerHTML = `
      <span style="font-size: 14px; color: rgba(255,255,255,0.5);">${player.league || 'KONOHA'} Stats</span>
      <span style="margin: 0 12px; color: rgba(255,255,255,0.3);">|</span>
      <span style="font-size: 14px; color: #4ECDC4;">@LeagueScoutHugo | KONOHA</span>
    `;
    exportContainer.appendChild(footer);

    document.body.appendChild(exportContainer);

    try {
      const blob = await this.core.export.toPNG(exportContainer, {
        mode: 'solo',
        width: 1200,
        height: 800,
        scale: 2,
        transparent: false
      });

      const filename = `konoha_${player.name}_${player.role}_percentile_analysis_${Date.now()}.png`;
      this.core.export.download(blob, filename);
    } catch (err) {
      console.error('Export analysis failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      document.body.removeChild(exportContainer);
    }
  }

  destroy(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    this.radarChart?.destroy();
    // Cleanup complete
    this.container?.remove();
    this.container = null;
  }
}
