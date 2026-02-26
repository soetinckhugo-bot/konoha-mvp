/**
 * RadarScoutModule - Version V4 Layout Exact
 * Design basé sur les screens utilisateur
 */

import type { CoreAPI, Player, MetricConfig } from '../../core/types';
import { RadarChart } from './components/RadarChart';
import { RadarDataService } from './services/RadarDataService';
import { getMetricsForRole, toMetricConfig, ALL_METRICS, PERCENTILE_CATEGORIES, METRIC_DISPLAY_NAMES } from './config/roleMetrics';
import { GradeCalculator } from './services/GradeCalculator';

export class RadarScoutModule {
  private core: CoreAPI;
  private container: HTMLElement | null = null;
  private unsubscribers: (() => void)[] = [];
  private radarChart: RadarChart | null = null;
  private dataService: RadarDataService;
  private currentMode: 'solo' | 'compare' | 'benchmark' = 'solo';
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
    
    // Layout V4 Exact - 3 colonnes
    this.container.innerHTML = `
      <div class="v4-container">
        <!-- LEFT SIDEBAR -->
        <div class="v4-sidebar-left">
          <!-- Player Selection -->
          <div class="v4-card">
            <div class="v4-card-header">
              <span class="v4-header-icon">👤</span>
              <span class="v4-header-title">Player Selection</span>
            </div>
            <div class="v4-card-body">
              <label class="v4-label">MAIN PLAYER</label>
              <div class="v4-select-wrapper">
                <select id="player-select" class="v4-select">
                  <option value="">Select a player</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Analysis Mode -->
          <div class="v4-card">
            <div class="v4-card-header">
              <span class="v4-header-icon">📊</span>
              <span class="v4-header-title">Analysis Mode</span>
            </div>
            <div class="v4-card-body">
              <div class="v4-mode-list">
                <button class="v4-mode-item active" data-mode="solo">
                  <span class="v4-mode-icon">🔷</span>
                  <div class="v4-mode-text">
                    <span class="v4-mode-name">Individual</span>
                    <span class="v4-mode-desc">Solo Analysis</span>
                  </div>
                </button>
                <button class="v4-mode-item" data-mode="compare">
                  <span class="v4-mode-icon">⚔️</span>
                  <div class="v4-mode-text">
                    <span class="v4-mode-name">Comparison</span>
                    <span class="v4-mode-desc">1 vs 1</span>
                  </div>
                </button>
                <button class="v4-mode-item" data-mode="benchmark">
                  <span class="v4-mode-icon">📈</span>
                  <div class="v4-mode-text">
                    <span class="v4-mode-name">Benchmark</span>
                    <span class="v4-mode-desc">vs Average</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Roles -->
          <div class="v4-card">
            <div class="v4-card-header">
              <span class="v4-header-icon">🎭</span>
              <span class="v4-header-title">Roles</span>
            </div>
            <div class="v4-card-body">
              <div class="v4-roles-grid">
                <button class="v4-role-btn" data-role="ALL">
                  <span class="v4-role-icon">✱</span>
                  <span class="v4-role-label">ALL</span>
                </button>
                <button class="v4-role-btn" data-role="TOP">
                  <span class="v4-role-icon">🛡️</span>
                  <span class="v4-role-label">TOP</span>
                </button>
                <button class="v4-role-btn" data-role="JUNGLE">
                  <span class="v4-role-icon">🌲</span>
                  <span class="v4-role-label">JGL</span>
                </button>
                <button class="v4-role-btn active" data-role="MID">
                  <span class="v4-role-icon">⚡</span>
                  <span class="v4-role-label">MID</span>
                </button>
                <button class="v4-role-btn" data-role="ADC">
                  <span class="v4-role-icon">🎯</span>
                  <span class="v4-role-label">ADC</span>
                </button>
                <button class="v4-role-btn" data-role="SUPPORT">
                  <span class="v4-role-icon">💚</span>
                  <span class="v4-role-label">SUP</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Metrics for Selected Role -->
          <div class="v4-card v4-metrics-card">
            <div class="v4-card-header">
              <span class="v4-header-icon" id="role-metrics-header-icon">⚡</span>
              <span class="v4-header-title" id="role-metrics-title">METRICS MID</span>
            </div>
            <div class="v4-card-body">
              <div id="role-metrics-list" class="v4-metrics-pills">
                <!-- Metrics pills will be rendered here -->
              </div>
            </div>
          </div>

          <!-- Active Metrics -->
          <div class="v4-card v4-active-card">
            <div class="v4-card-header">
              <span class="v4-header-title">Active Metrics</span>
              <span id="active-metrics-count" class="v4-count-badge">0</span>
            </div>
            <div class="v4-card-body">
              <div id="active-metrics-list" class="v4-active-pills">
                <!-- Active metric pills with X -->
              </div>
            </div>
          </div>
        </div>

        <!-- CENTER - RADAR + PERCENTILE ANALYSIS -->
        <div class="v4-center">
          <!-- Radar Header -->
          <div class="v4-radar-header">
            <div class="v4-player-badge">
              <span id="selected-player-name" class="v4-player-name">Select a player</span>
              <span id="selected-player-role" class="v4-role-tag">MID</span>
            </div>
            <div class="v4-view-toggle">
              <button class="v4-toggle-btn active" data-view="percentile">
                <span>📊</span> PERCENTILES
              </button>
              <button class="v4-toggle-btn" data-view="values">
                <span>📈</span> VALUES
              </button>
            </div>
          </div>
          
          <!-- Compare Player Selection (hidden by default) -->
          <div id="compare-player-panel" class="v4-compare-panel" style="display: none;">
            <label class="v4-label">COMPARE WITH</label>
            <select id="compare-player-select" class="v4-select">
              <option value="">Select opponent</option>
            </select>
          </div>

          <!-- Radar Chart -->
          <div class="v4-radar-container" id="radar-export-container">
            <div id="radar-chart-container" class="v4-radar-chart"></div>
            <div id="radar-empty" class="v4-radar-empty">
              <div class="empty-icon">📊</div>
              <p>Select a player to analyze</p>
            </div>
          </div>

          <!-- Percentile Analysis -->
          <div id="centiles-panel" class="v4-percentile-panel">
            <div class="v4-percentile-header">
              <div class="v4-percentile-title">
                <span class="v4-percentile-icon">📊</span>
                <span>Percentile Analysis</span>
                <span class="v4-percentile-subtitle">Player position vs league</span>
              </div>
              <div class="v4-percentile-actions">
                <button class="v4-action-btn" id="export-centiles-btn">📤 EXPORT PNG</button>
                <button class="v4-action-btn active">📊 By Categories</button>
              </div>
            </div>
            <div class="v4-percentile-categories">
              <div class="v4-category">
                <h4>Fight</h4>
                <div id="centiles-fight" class="v4-category-list">
                  <p class="v4-no-data">Import data to see percentile analysis</p>
                </div>
              </div>
              <div class="v4-category">
                <h4>Vision</h4>
                <div id="centiles-vision" class="v4-category-list">
                  <p class="v4-no-data">Import data to see percentile analysis</p>
                </div>
              </div>
              <div class="v4-category">
                <h4>Resources</h4>
                <div id="centiles-resources" class="v4-category-list">
                  <p class="v4-no-data">Import data to see percentile analysis</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT SIDEBAR -->
        <div class="v4-sidebar-right">
          <!-- Leaderboard -->
          <div class="v4-card v4-leaderboard-card">
            <div class="v4-card-header">
              <span class="v4-header-icon">👑</span>
              <span class="v4-header-title">Leaderboard</span>
              <span class="v4-info-icon">ⓘ</span>
            </div>
            <div class="v4-card-body v4-card-body-scroll">
              <div id="leaderboard-container" class="v4-leaderboard-list"></div>
            </div>
          </div>

          <!-- Player Tiers - V4 Horizontal Style -->
          <div class="v4-card v4-tiers-card">
            <div class="v4-card-header compact">
              <span class="v4-header-icon">🎖️</span>
              <span class="v4-header-title">PLAYER TIERS</span>
            </div>
            <div class="v4-card-body">
              <div class="v4-tiers-horizontal">
                <div class="v4-tier-item">
                  <div class="v4-tier-circle s">S</div>
                  <span class="v4-tier-name">ELITE</span>
                  <span class="v4-tier-val">100-75</span>
                </div>
                <div class="v4-tier-item">
                  <div class="v4-tier-circle a">A</div>
                  <span class="v4-tier-name">EXCELLENT</span>
                  <span class="v4-tier-val">75-60</span>
                </div>
                <div class="v4-tier-item">
                  <div class="v4-tier-circle b">B</div>
                  <span class="v4-tier-name">GOOD</span>
                  <span class="v4-tier-val">60-50</span>
                </div>
                <div class="v4-tier-item">
                  <div class="v4-tier-circle c">C</div>
                  <span class="v4-tier-name">WEAK</span>
                  <span class="v4-tier-val">&lt;50</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats Tiers - V4 Horizontal Style -->
          <div class="v4-card v4-tiers-card">
            <div class="v4-card-header compact">
              <span class="v4-header-icon">📊</span>
              <span class="v4-header-title">STATS TIERS</span>
            </div>
            <div class="v4-card-body">
              <div class="v4-tiers-horizontal">
                <div class="v4-tier-item">
                  <div class="v4-tier-circle s">S</div>
                  <span class="v4-tier-name">ELITE</span>
                  <span class="v4-tier-val">100-90</span>
                </div>
                <div class="v4-tier-item">
                  <div class="v4-tier-circle a">A</div>
                  <span class="v4-tier-name">EXCELLENT</span>
                  <span class="v4-tier-val">90-80</span>
                </div>
                <div class="v4-tier-item">
                  <div class="v4-tier-circle b">B</div>
                  <span class="v4-tier-name">GOOD</span>
                  <span class="v4-tier-val">80-65</span>
                </div>
                <div class="v4-tier-item">
                  <div class="v4-tier-circle c">C</div>
                  <span class="v4-tier-name">AVERAGE</span>
                  <span class="v4-tier-val">65-50</span>
                </div>
                <div class="v4-tier-item">
                  <div class="v4-tier-circle d">D</div>
                  <span class="v4-tier-name">WEAK</span>
                  <span class="v4-tier-val">&lt;50</span>
                </div>
              </div>
            </div>
          </div>

          <!-- About card removed to prevent overflow -->
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
    this.updateCacheTimestamp();
  }

  private setupEventHandlers(): void {
    if (!this.container) return;

    // Role buttons
    const roleBtns = this.container.querySelectorAll('.v4-role-btn');
    roleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.getAttribute('data-role') as string;
        this.currentRole = role;
        
        this.container?.setAttribute('data-role', role);
        
        roleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.core.setState('currentRole', role as any);
        this.renderRoleMetrics(role);
        this.updatePlayerSelects();
        this.updateLeaderboard();
        this.updateView();
        this.updateCentilesPanel();
      });
    });

    // Mode buttons
    const modeBtns = this.container.querySelectorAll('.v4-mode-item');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode') as 'solo' | 'compare' | 'benchmark';
        this.currentMode = mode;
        
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (mode === 'compare') {
          this.showComparePlayerSelect();
        } else {
          this.hideComparePlayerSelect();
        }
        
        this.updateView();
      });
    });

    // Player select
    const playerSelect = this.container.querySelector('#player-select') as HTMLSelectElement;
    playerSelect?.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      this.core.setState('selectedPlayerId', value || null);
      
      const playerNameEl = this.container?.querySelector('#selected-player-name');
      const playerRoleEl = this.container?.querySelector('#selected-player-role');
      
      if (value && playerNameEl && playerRoleEl) {
        const players = this.core.getState('players');
        const player = players.find((p: Player) => p.id === value);
        if (player) {
          playerNameEl.textContent = player.name;
          playerRoleEl.textContent = player.role;
          // Update role tag color
          playerRoleEl.setAttribute('data-role', player.role);
        }
      }
      
      this.updateView();
      this.updateCentilesPanel();
    });

    // Radar view toggle
    const toggleBtns = this.container.querySelectorAll('.v4-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view') as 'percentile' | 'values';
        this.centileViewMode = view === 'percentile' ? 'percentiles' : 'values';
        
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.radarChart?.setViewMode(this.centileViewMode);
        this.updateView();
        this.updateCentilesPanel();
      });
    });

    // Export centiles button
    const exportCentilesBtn = this.container.querySelector('#export-centiles-btn');
    exportCentilesBtn?.addEventListener('click', () => this.handleExportCentiles());

    // Global export button (header)
    const globalExportBtn = document.getElementById('global-export-btn');
    globalExportBtn?.addEventListener('click', () => this.handleExportRadar());
    
    // Clear cache button (header)
    const clearCacheBtn = document.getElementById('clear-cache-header-btn');
    clearCacheBtn?.addEventListener('click', () => this.handleClearCache());
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
      this.updateView();
      this.updateCentilesPanel();
    });
    this.unsubscribers.push(unsubPlayers);
  }

  private updatePlayerSelects(): void {
    const select = this.container?.querySelector('#player-select') as HTMLSelectElement;
    if (!select) return;

    const players: Player[] = this.core.getState('players');
    
    const filteredPlayers = this.currentRole === 'ALL' 
      ? players
      : players.filter((p: Player) => p.role === this.currentRole);

    const options = filteredPlayers.map((p: Player) => 
      `<option value="${p.id}">${p.name} (${p.team || 'No Team'})</option>`
    ).join('');

    const currentValue = select.value;
    select.innerHTML = '<option value="">Select a player</option>' + options;
    select.value = currentValue;
  }

  private renderRoleMetrics(role: string): void {
    const container = this.container?.querySelector('#role-metrics-list');
    const titleEl = this.container?.querySelector('#role-metrics-title');
    const iconEl = this.container?.querySelector('#role-metrics-header-icon');
    
    if (!container || !titleEl || !iconEl) return;

    const metrics = getMetricsForRole(role);
    const roleIcons: Record<string, string> = {
      'ALL': '✱', 'TOP': '🛡️', 'JUNGLE': '🌲', 'JGL': '🌲',
      'MID': '⚡', 'ADC': '🎯', 'SUPPORT': '💚', 'SUP': '💚'
    };

    titleEl.textContent = `METRICS ${role === 'JUNGLE' ? 'JGL' : role}`;
    iconEl.textContent = roleIcons[role] || '⚡';

    container.innerHTML = metrics.map(m => {
      const isInverted = m.direction === 'lower-is-better';
      return `
        <button class="v4-metric-pill" data-metric="${m.id}" title="${m.name}">
          <span class="pill-name">${m.name}</span>
          <span class="pill-arrow ${isInverted ? 'down' : 'up'}">${isInverted ? '↓' : '↑'}</span>
        </button>
      `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.v4-metric-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const metricId = pill.getAttribute('data-metric');
        this.toggleMetric(metricId!);
      });
    });

    // ALWAYS update selected metrics when role changes
    this.core.setState('selectedMetrics', metrics.map(m => m.id));
    this.updateActiveMetricsDisplay();
  }

  private toggleMetric(metricId: string): void {
    const selectedMetrics: string[] = this.core.getState('selectedMetrics') || [];
    
    if (selectedMetrics.includes(metricId)) {
      this.core.setState('selectedMetrics', selectedMetrics.filter(m => m !== metricId));
    } else {
      this.core.setState('selectedMetrics', [...selectedMetrics, metricId]);
    }
    
    this.updateActiveMetricsDisplay();
    this.updateView();
    this.updateCentilesPanel();
  }

  private updateActiveMetricsDisplay(): void {
    const container = this.container?.querySelector('#active-metrics-list');
    const countEl = this.container?.querySelector('#active-metrics-count');
    
    if (!container || !countEl) return;

    const selectedMetrics: string[] = this.core.getState('selectedMetrics') || [];
    countEl.textContent = String(selectedMetrics.length);

    container.innerHTML = selectedMetrics.map(id => {
      const metric = ALL_METRICS.find(m => m.id === id);
      if (!metric) return '';
      return `
        <button class="v4-active-pill" data-metric="${id}">
          <span>${metric.name}</span>
          <span class="pill-remove">×</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.v4-active-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const metricId = pill.getAttribute('data-metric');
        this.toggleMetric(metricId!);
      });
    });
  }

  private updateView(): void {
    const playerId = this.core.getState('selectedPlayerId');
    const players: Player[] = this.core.getState('players');
    const selectedMetrics: string[] = this.core.getState('selectedMetrics') || [];

    const emptyState = this.container?.querySelector('#radar-empty') as HTMLElement;
    const chartContainer = this.container?.querySelector('#radar-chart-container') as HTMLElement;

    if (!playerId || players.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (chartContainer) chartContainer.style.display = 'none';
      return;
    }

    const player = players.find((p: Player) => p.id === playerId);
    if (!player) {
      if (emptyState) emptyState.style.display = 'flex';
      if (chartContainer) chartContainer.style.display = 'none';
      return;
    }

    // Update player info display
    const playerNameEl = this.container?.querySelector('#selected-player-name');
    const playerRoleEl = this.container?.querySelector('#selected-player-role');
    if (playerNameEl) playerNameEl.textContent = player.name;
    if (playerRoleEl) {
      playerRoleEl.textContent = player.role;
      playerRoleEl.setAttribute('data-role', player.role);
    }

    const metrics: MetricConfig[] = selectedMetrics
      .map(id => {
        // For ALL role, search in ALL_METRICS, otherwise in role-specific metrics
        const sourceMetrics = this.currentRole === 'ALL' 
          ? ALL_METRICS 
          : getMetricsForRole(this.currentRole);
        const metricDef = sourceMetrics.find(m => m.id === id);
        return metricDef ? toMetricConfig(metricDef) : undefined;
      })
      .filter((m): m is MetricConfig => m !== undefined);

    if (metrics.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (chartContainer) chartContainer.style.display = 'none';
      return;
    }

    const rolePlayers = this.currentRole === 'ALL' 
      ? players 
      : players.filter(p => p.role === this.currentRole);

    const config = this.dataService.getConfig(
      this.currentMode,
      playerId,
      metrics,
      players,
      this.comparedPlayerId || undefined,
      (player, metric) => {
        const value = player.stats[metric.id];
        if (value === undefined) return 50;
        const isInverted = metric.direction === 'lower-is-better';
        return this.calculatePercentileForRole(value, metric.id, rolePlayers, isInverted);
      }
    );

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
    
    this.radarChart?.setViewMode(this.centileViewMode);
    this.radarChart?.render(config);
  }

  private updateCentilesPanel(): void {
    const playerId = this.core.getState('selectedPlayerId');
    const players: Player[] = this.core.getState('players');
    const selectedMetrics: string[] = this.core.getState('selectedMetrics') || [];

    const fightContainer = this.container?.querySelector('#centiles-fight');
    const visionContainer = this.container?.querySelector('#centiles-vision');
    const resourcesContainer = this.container?.querySelector('#centiles-resources');

    if (!fightContainer || !visionContainer || !resourcesContainer) return;

    if (!playerId || players.length === 0) {
      const msg = '<p class="v4-no-data">Import data to see percentile analysis</p>';
      fightContainer.innerHTML = msg;
      visionContainer.innerHTML = msg;
      resourcesContainer.innerHTML = msg;
      return;
    }

    const player = players.find((p: Player) => p.id === playerId);
    if (!player) return;

    const rolePlayers = this.currentRole === 'ALL' 
      ? players 
      : players.filter(p => p.role === this.currentRole);

    const renderCategory = (categoryMetrics: string[]) => {
      const relevantMetrics = selectedMetrics.filter(id => categoryMetrics.includes(id));
      
      if (relevantMetrics.length === 0) {
        return '<p class="v4-no-data">No metrics in this category</p>';
      }

      const header = `
        <div class="v4-category-header">
          <span>STAT</span>
          <span>PERCENTILE</span>
        </div>
      `;

      const rows = relevantMetrics.map(id => {
        const metric = ALL_METRICS.find(m => m.id === id);
        if (!metric) return '';

        const value = player.stats[id];
        if (value === undefined) return '';

        const isInverted = metric.direction === 'lower-is-better';
        const percentile = this.calculatePercentileForRole(value, id, rolePlayers, isInverted);
        const grade = GradeCalculator.getGrade(percentile);
        const color = GradeCalculator.getGradeColor(grade);

        const displayValue = this.centileViewMode === 'percentiles' 
          ? `${Math.round(percentile)}`
          : value.toFixed(metric.format === 'percentage' ? 1 : 2);

        return `
          <div class="v4-centile-row">
            <span class="v4-centile-name">${METRIC_DISPLAY_NAMES[id] || metric.name}</span>
            <div class="v4-centile-right">
              <div class="v4-centile-bar-wrap">
                <div class="v4-centile-bar" style="width: ${percentile}%; background: ${color}"></div>
              </div>
              <span class="v4-centile-value" style="color: ${color}">${displayValue}</span>
            </div>
          </div>
        `;
      }).join('');

      return header + rows;
    };

    fightContainer.innerHTML = renderCategory(PERCENTILE_CATEGORIES.fight);
    visionContainer.innerHTML = renderCategory(PERCENTILE_CATEGORIES.vision);
    resourcesContainer.innerHTML = renderCategory(PERCENTILE_CATEGORIES.resources);
  }

  private updateLeaderboard(): void {
    const container = this.container?.querySelector('#leaderboard-container');
    if (!container) return;

    const players: Player[] = this.core.getState('players');
    if (players.length === 0) {
      container.innerHTML = '<p class="v4-no-data">No players</p>';
      return;
    }

    const rolePlayers = this.currentRole === 'ALL' 
      ? players 
      : players.filter(p => p.role === this.currentRole);

    const selectedMetrics: string[] = this.core.getState('selectedMetrics') || [];

    // Calculate scores for each player
    const playerScores = rolePlayers.map(player => {
      let totalScore = 0;
      let count = 0;

      selectedMetrics.forEach(metricId => {
        const value = player.stats[metricId];
        if (value !== undefined) {
          const metric = ALL_METRICS.find(m => m.id === metricId);
          const isInverted = metric?.direction === 'lower-is-better';
          const percentile = this.calculatePercentileForRole(value, metricId, rolePlayers, isInverted);
          totalScore += percentile;
          count++;
        }
      });

      const avgScore = count > 0 ? totalScore / count : 0;
      return { player, score: avgScore };
    });

    // Sort by score descending
    playerScores.sort((a, b) => b.score - a.score);

    // Render top 12 - V4 Exact Style
    container.innerHTML = playerScores.slice(0, 12).map((item, index) => {
      const rank = index + 1;
      const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default';
      const grade = GradeCalculator.getGrade(item.score);
      const gradeClass = grade.toLowerCase();

      return `
        <div class="v4-lb-row" data-player-id="${item.player.id}">
          <div class="v4-lb-rank ${rankClass}">${rank}</div>
          <div class="v4-lb-info">
            <div class="v4-lb-name">${item.player.name}</div>
            <div class="v4-lb-team">${item.player.team || 'No Team'}</div>
          </div>
          <div class="v4-lb-score-wrap">
            <span class="v4-lb-score">${Math.round(item.score)}</span>
            <span class="v4-lb-label">score</span>
          </div>
          <div class="v4-lb-grade ${gradeClass}">${grade}</div>
        </div>
      `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.v4-leaderboard-item').forEach(item => {
      item.addEventListener('click', () => {
        const playerId = item.getAttribute('data-player-id');
        if (playerId) {
          this.core.setState('selectedPlayerId', playerId);
          const select = this.container?.querySelector('#player-select') as HTMLSelectElement;
          if (select) select.value = playerId;
        }
      });
    });
  }

  private calculatePercentileForRole(
    value: number, 
    metricId: string, 
    rolePlayers: Player[],
    isInverted: boolean = false
  ): number {
    if (rolePlayers.length === 0) return 50;

    const allValues = rolePlayers
      .map(p => p.stats[metricId])
      .filter((v): v is number => v !== undefined && !isNaN(v));

    if (allValues.length === 0) return 50;
    if (allValues.length === 1) return 50;

    const N = allValues.length;
    const below = allValues.filter(v => v < value).length;
    let percentile = (below / N) * 100;

    if (isInverted) {
      percentile = 100 - percentile;
    }

    return Math.max(0, Math.min(100, percentile));
  }

  private async handleExportRadar(): Promise<void> {
    const container = this.container?.querySelector('#radar-export-container') as HTMLElement;
    if (!container) return;

    try {
      const blob = await this.core.export.toPNG(container, { mode: 'solo' });
      this.core.export.download(blob, `radar-${this.currentRole}-${Date.now()}.png`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  }

  private async handleExportCentiles(): Promise<void> {
    const container = this.container?.querySelector('#centiles-panel') as HTMLElement;
    if (!container) return;

    try {
      const blob = await this.core.export.toPNG(container, { mode: 'solo' });
      this.core.export.download(blob, `percentile-analysis-${Date.now()}.png`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  }

  private handleClearCache(): void {
    if (confirm('Clear all cached data? You will need to re-import your CSV.')) {
      // Clear all konoha keys from localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('konoha_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Update UI
      this.updateCacheTimestamp();
      
      // Reload page to reset state
      window.location.reload();
    }
  }

  private updateCacheTimestamp(): void {
    const timestampEl = this.container?.querySelector('#cache-timestamp') as HTMLElement;
    if (!timestampEl) return;
    
    const lastImport = localStorage.getItem('konoha_last_import');
    if (lastImport) {
      const date = new Date(parseInt(lastImport, 10));
      const formatted = date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      timestampEl.textContent = `Cached: ${formatted}`;
    } else {
      timestampEl.textContent = 'No cached data';
    }
  }

  private showComparePlayerSelect(): void {
    const panel = this.container?.querySelector('#compare-player-panel') as HTMLElement;
    const select = this.container?.querySelector('#compare-player-select') as HTMLSelectElement;
    
    if (panel) panel.style.display = 'block';
    
    if (select) {
      // Populate with players (excluding currently selected)
      const players: Player[] = this.core.getState('players');
      const currentPlayerId = this.core.getState('selectedPlayerId');
      
      const filteredPlayers = players.filter((p: Player) => p.id !== currentPlayerId);
      
      select.innerHTML = '<option value="">Select opponent</option>' + 
        filteredPlayers.map((p: Player) => 
          `<option value="${p.id}">${p.name} (${p.team || 'No Team'})</option>`
        ).join('');
      
      // Add change handler
      select.onchange = (e) => {
        const value = (e.target as HTMLSelectElement).value;
        this.comparedPlayerId = value || null;
        this.updateView();
      };
    }
  }

  private hideComparePlayerSelect(): void {
    const panel = this.container?.querySelector('#compare-player-panel') as HTMLElement;
    if (panel) panel.style.display = 'none';
    this.comparedPlayerId = null;
    this.updateView();
  }

  destroy(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    this.radarChart?.destroy();
    this.container?.remove();
    this.container = null;
  }
}
