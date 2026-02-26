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
  private overlayRadarChart: RadarChart | null = null;
  private dataService: RadarDataService;
  private currentMode: 'solo' | 'compare' | 'benchmark' = 'solo';
  private currentRole: string = 'MID';
  private comparedPlayerId: string | null = null;
  private centileViewMode: 'percentiles' | 'values' = 'percentiles';
  private lastRadarConfig: any = null;

  constructor(core: CoreAPI) {
    this.core = core;
    this.dataService = new RadarDataService();
  }

  render(): void {
    this.container = document.createElement('div');
    this.container.className = 'radar-scout-module v4-layout';
    this.container.setAttribute('data-role', this.currentRole);
    
    // Layout V4 Exact - 3 colonnes + percentile full width
    this.container.innerHTML = `
      <div class="v4-layout-wrapper">
        <!-- LEFT SIDEBAR -->
        <div class="v4-sidebar-left">
          <!-- Player Selection -->
          <div class="v4-card">
            <div class="v4-card-header">
              <span class="v4-header-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
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
              <span class="v4-header-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
              <span class="v4-header-title">Analysis Mode</span>
            </div>
            <div class="v4-card-body">
              <div class="v4-mode-list">
                <button class="v4-mode-item active" data-mode="solo">
                  <span class="v4-mode-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></span>
                  <div class="v4-mode-text">
                    <span class="v4-mode-name">Individual</span>
                    <span class="v4-mode-desc">Solo Analysis</span>
                  </div>
                </button>
                <button class="v4-mode-item" data-mode="compare">
                  <span class="v4-mode-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg></span>
                  <div class="v4-mode-text">
                    <span class="v4-mode-name">Comparison</span>
                    <span class="v4-mode-desc">1 vs 1</span>
                  </div>
                </button>
                <button class="v4-mode-item" data-mode="benchmark">
                  <span class="v4-mode-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg></span>
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
              <span class="v4-header-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></span>
              <span class="v4-header-title">Roles</span>
            </div>
            <div class="v4-card-body">
              <div class="v4-roles-grid">
                <button class="v4-role-btn" data-role="ALL">
                  <span class="v4-role-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg></span>
                  <span class="v4-role-label">ALL</span>
                </button>
                <button class="v4-role-btn" data-role="TOP">
                  <span class="v4-role-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
                  <span class="v4-role-label">TOP</span>
                </button>
                <button class="v4-role-btn" data-role="JUNGLE">
                  <span class="v4-role-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22v-8m0-12v8m0 0l4-4m-4 4l-4-4"/></svg></span>
                  <span class="v4-role-label">JGL</span>
                </button>
                <button class="v4-role-btn active" data-role="MID">
                  <span class="v4-role-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
                  <span class="v4-role-label">MID</span>
                </button>
                <button class="v4-role-btn" data-role="ADC">
                  <span class="v4-role-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span>
                  <span class="v4-role-label">ADC</span>
                </button>
                <button class="v4-role-btn" data-role="SUPPORT">
                  <span class="v4-role-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></span>
                  <span class="v4-role-label">SUP</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Metrics for Selected Role -->
          <div class="v4-card v4-metrics-card">
            <div class="v4-card-header">
              <span class="v4-header-icon" id="role-metrics-header-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
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

        <!-- CENTER - RADAR ONLY -->
        <div class="v4-center">
          <!-- Radar Header -->
          <div class="v4-radar-header">
            <div class="v4-player-badge">
              <span id="selected-player-name" class="v4-player-name">Select a player</span>
              <span id="selected-player-role" class="v4-role-tag">MID</span>
              <span id="selected-player-team" class="v4-team-tag" style="display:none"></span>
            </div>
            <div class="v4-player-stats">
              <span id="player-rank-badge" class="v4-stat-badge" style="display:none">Tier <span id="player-rank">-</span></span>
              <span id="player-avg-badge" class="v4-stat-badge" style="display:none">Avg <span id="player-avg">-</span></span>
            </div>
            <div class="v4-view-toggle">
              <button class="v4-toggle-btn active" data-view="percentile">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;vertical-align:middle"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>PERCENTILES
              </button>
              <button class="v4-toggle-btn" data-view="values">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;vertical-align:middle"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>VALUES
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

          <!-- Comparison Legend - Custom player cards -->
          <div id="comparison-legend" class="v4-comparison-legend" style="display: none;">
            <div class="v4-legend-card" data-dataset="0">
              <div class="v4-legend-color" style="background: #3FE0D0;"></div>
              <div class="v4-legend-info">
                <span class="v4-legend-name" id="legend-player1-name">Player 1</span>
                <span class="v4-legend-team" id="legend-player1-team">Team</span>
              </div>
            </div>
            <div class="v4-legend-card" data-dataset="1">
              <div class="v4-legend-color" style="background: #FF6B6B;"></div>
              <div class="v4-legend-info">
                <span class="v4-legend-name" id="legend-player2-name">Player 2</span>
                <span class="v4-legend-team" id="legend-player2-team">Team</span>
              </div>
            </div>
          </div>

          <!-- Radar Chart -->
          <div class="v4-radar-container" id="radar-export-container">
            <button class="v4-radar-expand-btn" id="radar-expand-btn" title="Expand radar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M14 10l7-7M9 21H3v-6M10 14l-7 7"/></svg>
            </button>
            <div id="radar-chart-container" class="v4-radar-chart"></div>
            <div id="radar-empty" class="v4-radar-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;opacity:0.3"><polygon points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <p>Select a player to analyze</p>
            </div>
          </div>

          <!-- Radar Overlay (Fullscreen) -->
          <div class="v4-radar-overlay" id="radar-overlay" style="display: none;">
            <div class="v4-radar-overlay-backdrop"></div>
            <div class="v4-radar-overlay-content">
              <button class="v4-radar-overlay-close" id="radar-overlay-close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
              <div class="v4-radar-overlay-chart" id="radar-overlay-chart"></div>
            </div>
          </div>

          <!-- PERCENTILE ANALYSIS - INSIDE CENTER COLUMN -->
          <div id="centiles-panel" class="v4-percentile-panel">
            <div class="v4-percentile-header">
              <div class="v4-percentile-title">
                <svg class="v4-percentile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                <span>Percentile Analysis</span>
                <span class="v4-percentile-subtitle">Player position vs league</span>
              </div>
              <div class="v4-percentile-actions">
                <button class="v4-action-btn" id="export-centiles-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>EXPORT PNG</button>
                <button class="v4-action-btn active" data-view="categories"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>By Categories</button>
                <button class="v4-action-btn" data-view="table"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>Table</button>
              </div>
            </div>
            <div class="v4-percentile-content">
              <div class="v4-percentile-categories" id="view-categories">
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
              <div class="v4-percentile-table" id="view-table" style="display: none;">
                <div class="v4-table-header">
                  <div class="v4-table-player">
                    <span id="table-player-name">Select a player</span>
                    <span id="table-player-team"></span>
                  </div>
                </div>
                <div class="v4-table-body" id="table-metrics-list">
                  <p class="v4-no-data">Import data to see table view</p>
                </div>
              </div>
            </div>
          </div><!-- /v4-percentile-panel -->
        </div><!-- /v4-center -->

        <!-- RIGHT SIDEBAR -->
        <div class="v4-sidebar-right">
          <!-- Leaderboard -->
          <div class="v4-card v4-leaderboard-card">
            <div class="v4-card-header">
              <span class="v4-header-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg></span>
              <span class="v4-header-title">Leaderboard</span>
              <span id="leaderboard-count" class="v4-player-count-badge">0</span>
            </div>
            <div class="v4-card-body v4-card-body-scroll">
              <div id="leaderboard-container" class="v4-leaderboard-list"></div>
            </div>
          </div>

          <!-- Player Tiers - V4 Horizontal Style -->
          <div class="v4-card v4-tiers-card">
            <div class="v4-card-header compact">
              <span class="v4-header-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg></span>
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
              <span class="v4-header-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
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
                  <span class="v4-tier-val">90-75</span>
                </div>
                <div class="v4-tier-item">
                  <div class="v4-tier-circle b">B</div>
                  <span class="v4-tier-name">GOOD</span>
                  <span class="v4-tier-val">75-55</span>
                </div>
                <div class="v4-tier-item">
                  <div class="v4-tier-circle c">C</div>
                  <span class="v4-tier-name">AVERAGE</span>
                  <span class="v4-tier-val">55-35</span>
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
        </div><!-- /v4-sidebar-right -->
      </div><!-- /v4-layout-wrapper -->
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
      this.updateTableView();
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

    // View toggle buttons (Categories/Table)
    const viewBtns = this.container.querySelectorAll('.v4-action-btn[data-view]');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        
        // Update button states
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Switch views
        const categoriesView = this.container?.querySelector('#view-categories') as HTMLElement;
        const tableView = this.container?.querySelector('#view-table') as HTMLElement;
        
        if (view === 'categories') {
          if (categoriesView) categoriesView.style.display = 'grid';
          if (tableView) tableView.style.display = 'none';
        } else if (view === 'table') {
          if (categoriesView) categoriesView.style.display = 'none';
          if (tableView) tableView.style.display = 'block';
          this.updateTableView();
        }
      });
    });

    // Radar expand/collapse
    const expandBtn = this.container?.querySelector('#radar-expand-btn');
    const overlay = this.container?.querySelector('#radar-overlay') as HTMLElement;
    const overlayClose = this.container?.querySelector('#radar-overlay-close');
    
    expandBtn?.addEventListener('click', () => {
      if (overlay) {
        overlay.style.display = 'flex';
        // Render a copy of the chart in the overlay
        this.renderOverlayChart();
      }
    });
    
    overlayClose?.addEventListener('click', () => {
      if (overlay) overlay.style.display = 'none';
    });
    
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay || e.target === overlay.querySelector('.v4-radar-overlay-backdrop')) {
        overlay.style.display = 'none';
      }
    });

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
      'ALL': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg>',
      'TOP': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      'JUNGLE': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22v-8m0-12v8m0 0l4-4m-4 4l-4-4"/></svg>',
      'JGL': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22v-8m0-12v8m0 0l4-4m-4 4l-4-4"/></svg>',
      'MID': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
      'ADC': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
      'SUPPORT': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      'SUP': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
    };

    titleEl.textContent = `METRICS ${role === 'JUNGLE' ? 'JGL' : role}`;
    iconEl.innerHTML = roleIcons[role] || roleIcons['MID'];

    const arrowUpSvg = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    const arrowDownSvg = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>';
    
    container.innerHTML = metrics.map(m => {
      const isInverted = m.direction === 'lower-is-better';
      return `
        <button class="v4-metric-pill" data-metric="${m.id}" title="${m.name}">
          <span class="pill-name">${m.name}</span>
          <span class="pill-arrow ${isInverted ? 'down' : 'up'}">${isInverted ? arrowDownSvg : arrowUpSvg}</span>
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
          <span class="pill-remove"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg></span>
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
    const playerTeamEl = this.container?.querySelector('#selected-player-team') as HTMLElement;
    const playerRankBadge = this.container?.querySelector('#player-rank-badge') as HTMLElement;
    const playerRankEl = this.container?.querySelector('#player-rank');
    const playerAvgBadge = this.container?.querySelector('#player-avg-badge') as HTMLElement;
    const playerAvgEl = this.container?.querySelector('#player-avg');
    
    if (playerNameEl) playerNameEl.textContent = player.name;
    if (playerRoleEl) {
      playerRoleEl.textContent = player.role;
      playerRoleEl.setAttribute('data-role', player.role);
    }
    if (playerTeamEl) {
      if (player.team) {
        playerTeamEl.textContent = player.team;
        playerTeamEl.style.display = 'inline-flex';
      } else {
        playerTeamEl.style.display = 'none';
      }
    }

    // Calculate rank and average score for this player
    const allRolePlayers = this.currentRole === 'ALL' 
      ? players 
      : players.filter(p => p.role === this.currentRole);
    
    // Calculate scores for all players to find rank
    const playerScoresList = allRolePlayers.map(p => {
      let totalScore = 0;
      let count = 0;
      selectedMetrics.forEach(metricId => {
        const value = p.stats[metricId];
        if (value !== undefined) {
          const metric = ALL_METRICS.find(m => m.id === metricId);
          const isInverted = metric?.direction === 'lower-is-better';
          const percentile = this.calculatePercentileForRole(value, metricId, allRolePlayers, isInverted);
          totalScore += percentile;
          count++;
        }
      });
      return { player: p, avgScore: count > 0 ? totalScore / count : 0 };
    });
    
    // Sort by score descending
    playerScoresList.sort((a, b) => b.avgScore - a.avgScore);
    
    // Find selected player score
    const playerAvgScore = playerScoresList.find(p => p.player.id === playerId)?.avgScore || 0;
    
    // Determine player tier for color coding
    let playerTierClass = 'rank-c';
    if (playerAvgScore >= 75) playerTierClass = 'rank-s';
    else if (playerAvgScore >= 60) playerTierClass = 'rank-a';
    else if (playerAvgScore >= 50) playerTierClass = 'rank-b';
    
    // Update tier and avg display - show PLAYER TIER (S/A/B/C) not rank number
    let playerTierLabel = 'C';
    if (playerAvgScore >= 75) playerTierLabel = 'S';
    else if (playerAvgScore >= 60) playerTierLabel = 'A';
    else if (playerAvgScore >= 50) playerTierLabel = 'B';
    
    if (playerRankEl && playerRankBadge) {
      playerRankEl.textContent = playerTierLabel;
      playerRankBadge.className = `v4-stat-badge tier-badge ${playerTierClass}`;
      playerRankBadge.style.display = 'inline-flex';
    }
    if (playerAvgEl && playerAvgBadge) {
      playerAvgEl.textContent = Math.round(playerAvgScore).toString();
      playerAvgBadge.style.display = 'inline-flex';
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
        // Use new Stats Tiers thresholds
        if (percentile >= 90) return 'S';
        if (percentile >= 75) return 'A';
        if (percentile >= 55) return 'B';
        if (percentile >= 35) return 'C';
        return 'D';
      });
    });

    // Store config for overlay
    this.lastRadarConfig = config;

    if (emptyState) emptyState.style.display = 'none';
    if (chartContainer) chartContainer.style.display = 'block';
    
    this.radarChart?.setViewMode(this.centileViewMode);
    this.radarChart?.render(config);
    
    // Update comparison legend
    this.updateComparisonLegend(player, players);
  }

  private renderOverlayChart(): void {
    const overlayChart = this.container?.querySelector('#radar-overlay-chart');
    if (!overlayChart) return;
    
    // Clear previous chart
    overlayChart.innerHTML = '';
    
    // Check if we have a stored config
    if (!this.lastRadarConfig) {
      overlayChart.innerHTML = '<p style="color: var(--v4-text-muted); text-align: center; margin-top: 40vh;">Select a player first</p>';
      return;
    }
    
    // Destroy previous overlay chart if exists
    this.overlayRadarChart?.destroy();
    
    // Create a new RadarChart instance for the overlay
    this.overlayRadarChart = new RadarChart('radar-overlay-chart');
    
    // Render with the stored config
    this.overlayRadarChart.setViewMode(this.centileViewMode);
    this.overlayRadarChart.render(this.lastRadarConfig);
  }

  private updateComparisonLegend(player1: Player, players: Player[]): void {
    if (this.currentMode !== 'compare' || !this.comparedPlayerId) return;
    
    const player2 = players.find(p => p.id === this.comparedPlayerId);
    if (!player2) return;
    
    const legend1Name = this.container?.querySelector('#legend-player1-name');
    const legend1Team = this.container?.querySelector('#legend-player1-team');
    const legend2Name = this.container?.querySelector('#legend-player2-name');
    const legend2Team = this.container?.querySelector('#legend-player2-team');
    
    if (legend1Name) legend1Name.textContent = player1.name;
    if (legend1Team) legend1Team.textContent = player1.team || 'No Team';
    if (legend2Name) legend2Name.textContent = player2.name;
    if (legend2Team) legend2Team.textContent = player2.team || 'No Team';
    
    // Add click handlers to toggle datasets
    const legendCards = this.container?.querySelectorAll('.v4-legend-card');
    legendCards?.forEach((card) => {
      card.addEventListener('click', () => {
        card.classList.toggle('hidden');
        // Toggle dataset visibility in chart
        // This would need Chart.js dataset visibility API
      });
    });
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
        // Use getStatsGrade for correct S/A/B/C/D tiers with new thresholds
        const grade = GradeCalculator.getStatsGrade(percentile);
        const color = GradeCalculator.getStatsGradeColor(grade);

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

  private updateTableView(): void {
    const playerId = this.core.getState('selectedPlayerId');
    const players: Player[] = this.core.getState('players');
    const selectedMetrics: string[] = this.core.getState('selectedMetrics') || [];

    const playerNameEl = this.container?.querySelector('#table-player-name');
    const playerTeamEl = this.container?.querySelector('#table-player-team');
    const tableBody = this.container?.querySelector('#table-metrics-list');

    if (!playerNameEl || !playerTeamEl || !tableBody) return;

    if (!playerId || players.length === 0) {
      playerNameEl.textContent = 'Select a player';
      playerTeamEl.textContent = '';
      tableBody.innerHTML = '<p class="v4-no-data">Import data to see table view</p>';
      return;
    }

    const player = players.find((p: Player) => p.id === playerId);
    if (!player) {
      tableBody.innerHTML = '<p class="v4-no-data">Player not found</p>';
      return;
    }

    playerNameEl.textContent = player.name;
    playerTeamEl.textContent = player.team || '';

    const rolePlayers = this.currentRole === 'ALL' 
      ? players 
      : players.filter(p => p.role === this.currentRole);

    const rows = selectedMetrics.map(id => {
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
        <div class="v4-table-row">
          <span class="v4-table-metric">${METRIC_DISPLAY_NAMES[id] || metric.name}</span>
          <span class="v4-table-value" style="color: ${color}">${displayValue}</span>
        </div>
      `;
    }).join('');

    tableBody.innerHTML = rows || '<p class="v4-no-data">No metrics selected</p>';
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

    // Update player count badge
    const countBadge = this.container?.querySelector('#leaderboard-count');
    if (countBadge) {
      countBadge.textContent = String(rolePlayers.length);
    }

    // Render top 12 - V4 with Player Tiers (S/A/B/C) mapped to Player Tiers thresholds
    container.innerHTML = playerScores.slice(0, 12).map((item, index) => {
      const rank = index + 1;
      const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default';
      
      // Use PLAYER TIERS thresholds (S/A/B/C) - matching the Player Tiers card
      // S (Elite): 100-75, A (Excellent): 75-60, B (Good): 60-50, C (Weak): <50
      let grade: string;
      let gradeClass: string;
      if (item.score >= 75) {
        grade = 'S';
        gradeClass = 's';
      } else if (item.score >= 60) {
        grade = 'A';
        gradeClass = 'a';
      } else if (item.score >= 50) {
        grade = 'B';
        gradeClass = 'b';
      } else {
        grade = 'C';
        gradeClass = 'c';
      }

      // Grade color for rank badge
      const gradeColorClass = `grade-${gradeClass}`;
      
      return `
        <div class="v4-lb-row" data-player-id="${item.player.id}">
          <div class="v4-lb-rank ${rankClass}">${rank}</div>
          <div class="v4-lb-info">
            <div class="v4-lb-name">${item.player.name}</div>
            <div class="v4-lb-team">${item.player.team || 'No Team'}</div>
          </div>
          <div class="v4-lb-score">${Math.round(item.score)}</div>
          <div class="v4-lb-grade ${gradeColorClass}">${grade}</div>
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
    const legend = this.container?.querySelector('#comparison-legend') as HTMLElement;
    
    if (panel) panel.style.display = 'block';
    if (legend) legend.style.display = 'flex';
    
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
    const legend = this.container?.querySelector('#comparison-legend') as HTMLElement;
    if (panel) panel.style.display = 'none';
    if (legend) legend.style.display = 'none';
    this.comparedPlayerId = null;
    this.updateView();
  }

  destroy(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    this.radarChart?.destroy();
    this.overlayRadarChart?.destroy();
    this.container?.remove();
    this.container = null;
  }
}
