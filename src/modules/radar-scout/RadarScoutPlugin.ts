// RadarScoutPlugin.ts - V4 Design System avec Chart.js
// @ts-nocheck
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default class RadarScoutPlugin {
  id = 'radar-scout';
  name = 'Radar Scout';
  version = '2.0.0';
  description = 'Visualiseur de statistiques radar pour joueurs LoL';
  
  private chart: Chart | null = null;
  private api: any = null;
  private selectedPlayer: any = null;
  private comparedPlayer: any = null;
  private currentMode = 'solo';
  private currentRole = 'ALL';
  private selectedMetrics = ['kda', 'kp', 'cspm', 'visionScore', 'dpm'];
  private showPercentile = false;
  
  async mount(api: any) {
    this.api = api;
    console.log('RadarScout plugin mounted');
    
    const container = document.getElementById('module-container');
    if (!container) return;
    
    this.renderLayout(container);
    this.setupEventListeners();
    
    const players = api.getState('players') || [];
    if (players.length > 0) {
      this.populatePlayerSelect(players);
      this.selectedPlayer = players[0];
      this.renderRadar();
    }
    
    api.subscribe?.('players', (players: any[]) => {
      this.populatePlayerSelect(players);
      if (players.length > 0 && !this.selectedPlayer) {
        this.selectedPlayer = players[0];
        this.renderRadar();
      }
    });
  }
  
  unmount() {
    this.chart?.destroy();
    return Promise.resolve();
  }
  
  private renderLayout(container: HTMLElement) {
    container.innerHTML = `
      <div class="v4-layout" data-role="ALL">
        <!-- Left Sidebar -->
        <aside class="v4-sidebar-left">
          <!-- Player Selection Card -->
          <div class="v4-card">
            <div class="v4-card-header compact">
              <span class="v4-header-icon">👤</span>
              <span class="v4-header-title">Sélection Joueur</span>
            </div>
            <div class="v4-card-body">
              <div class="v4-select-wrapper" style="margin-bottom:12px;">
                <select id="player-select" class="v4-select">
                  <option value="">Choisir un joueur...</option>
                </select>
              </div>
              <div id="player-info" class="player-info" style="display:none;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                  <span id="player-role" class="v4-role-tag"></span>
                  <span id="player-team" class="v4-team-tag"></span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Mode Selection -->
          <div class="v4-card" style="margin-top:8px;">
            <div class="v4-card-header compact">
              <span class="v4-header-icon">🎮</span>
              <span class="v4-header-title">Mode</span>
            </div>
            <div class="v4-card-body">
              <div class="v4-mode-list">
                <button class="v4-mode-item active" data-mode="solo">
                  <span class="v4-mode-icon">👤</span>
                  <span class="v4-mode-text">
                    <span class="v4-mode-name">Individuel</span>
                    <span class="v4-mode-desc">Analyse détaillée</span>
                  </span>
                </button>
                <button class="v4-mode-item" data-mode="compare">
                  <span class="v4-mode-icon">⚔️</span>
                  <span class="v4-mode-text">
                    <span class="v4-mode-name">Comparaison</span>
                    <span class="v4-mode-desc">2 joueurs</span>
                  </span>
                </button>
                <button class="v4-mode-item" data-mode="benchmark">
                  <span class="v4-mode-icon">📊</span>
                  <span class="v4-mode-text">
                    <span class="v4-mode-name">Benchmark</span>
                    <span class="v4-mode-desc">vs moyenne</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Role Filter -->
          <div class="v4-card" style="margin-top:8px;">
            <div class="v4-card-header compact">
              <span class="v4-header-icon">🎯</span>
              <span class="v4-header-title">Rôle</span>
            </div>
            <div class="v4-card-body">
              <div class="v4-roles-grid">
                <button class="v4-role-btn active" data-role="ALL">
                  <span class="v4-role-icon">🌐</span>
                  <span class="v4-role-label">ALL</span>
                </button>
                <button class="v4-role-btn" data-role="TOP">
                  <span class="v4-role-icon">🛡️</span>
                  <span class="v4-role-label">TOP</span>
                </button>
                <button class="v4-role-btn" data-role="JUNGLE">
                  <span class="v4-role-icon">🌿</span>
                  <span class="v4-role-label">JGL</span>
                </button>
                <button class="v4-role-btn" data-role="MID">
                  <span class="v4-role-icon">⚡</span>
                  <span class="v4-role-label">MID</span>
                </button>
                <button class="v4-role-btn" data-role="ADC">
                  <span class="v4-role-icon">🏹</span>
                  <span class="v4-role-label">ADC</span>
                </button>
                <button class="v4-role-btn" data-role="SUPPORT">
                  <span class="v4-role-icon">💚</span>
                  <span class="v4-role-label">SUP</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Metrics -->
          <div class="v4-card" style="margin-top:8px;">
            <div class="v4-card-header compact">
              <span class="v4-header-icon">📈</span>
              <span class="v4-header-title">Métriques</span>
            </div>
            <div class="v4-card-body">
              <div class="v4-metrics-pills" id="metrics-pills">
                ${this.renderMetricPills()}
              </div>
            </div>
          </div>
        </aside>
        
        <!-- Center - Radar -->
        <div class="v4-center">
          <!-- Radar Header -->
          <div class="v4-radar-header">
            <div class="v4-player-badge">
              <span id="radar-player-name" class="v4-player-name">Sélectionnez un joueur</span>
              <span id="radar-role-tag" class="v4-role-tag" style="display:none;"></span>
            </div>
            <div class="v4-view-toggle">
              <button class="v4-toggle-btn" id="toggle-values">Valeurs</button>
              <button class="v4-toggle-btn active" id="toggle-percentile">% Centiles</button>
            </div>
          </div>
          
          <!-- Radar Chart -->
          <div class="v4-radar-container">
            <canvas id="radar-canvas"></canvas>
          </div>
        </div>
        
        <!-- Right Sidebar - Leaderboard -->
        <aside class="v4-sidebar-right">
          <div class="v4-card" style="height:100%;">
            <div class="v4-card-header compact">
              <span class="v4-header-icon">🏆</span>
              <span class="v4-header-title">Classement</span>
              <span class="v4-player-count-badge" id="leaderboard-count">0</span>
            </div>
            <div class="v4-card-body v4-card-body-scroll" id="leaderboard-body">
              <div class="v4-leaderboard-empty">Aucun joueur</div>
            </div>
          </div>
        </aside>
      </div>
      
      <style>
        /* Layout fixes for injected content */
        .player-info { animation: fadeIn 0.3s ease; }
        .v4-leaderboard-empty {
          text-align: center;
          padding: 40px 20px;
          color: var(--v4-text-muted);
          font-size: 13px;
        }
        .v4-leaderboard-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .v4-leaderboard-item:hover {
          background: var(--v4-bg-hover);
        }
        .v4-leaderboard-item.active {
          background: var(--role-glow, rgba(5, 170, 206, 0.15));
          border: 1px solid var(--v4-accent);
        }
        .v4-rank {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
        }
        .v4-rank.top3 {
          background: var(--v4-accent);
          color: #000;
        }
        .v4-rank.other {
          background: var(--v4-bg-input);
          color: var(--v4-text-muted);
        }
        .v4-leaderboard-info {
          flex: 1;
          min-width: 0;
        }
        .v4-leaderboard-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--v4-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .v4-leaderboard-team {
          font-size: 11px;
          color: var(--v4-text-muted);
        }
        .v4-leaderboard-score {
          font-size: 14px;
          font-weight: 700;
          color: var(--v4-accent);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    `;
    
    // Add layout wrapper class
    const layout = container.querySelector('.v4-layout');
    if (layout) {
      layout.classList.add('v4-layout-wrapper');
    }
  }
  
  private renderMetricPills() {
    const metrics = [
      { id: 'kda', label: 'KDA' },
      { id: 'kp', label: 'KP%' },
      { id: 'cspm', label: 'CSPM' },
      { id: 'visionScore', label: 'Vision' },
      { id: 'dpm', label: 'DPM' },
      { id: 'gd15', label: 'GD@15' },
    ];
    return metrics.map(m => `
      <button class="v4-metric-pill ${this.selectedMetrics.includes(m.id) ? 'active' : ''}" data-metric="${m.id}">
        ${m.label}
      </button>
    `).join('');
  }
  
  private setupEventListeners() {
    // Player select
    document.getElementById('player-select')?.addEventListener('change', (e) => {
      const players = this.api.getState('players') || [];
      this.selectedPlayer = players.find((p: any) => p.id === (e.target as HTMLSelectElement).value);
      this.updatePlayerInfo();
      this.renderRadar();
      this.updateLeaderboardHighlight();
    });
    
    // Mode selection
    document.querySelectorAll('.v4-mode-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.v4-mode-item').forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
        this.currentMode = (e.currentTarget as HTMLElement).dataset.mode || 'solo';
        this.renderRadar();
      });
    });
    
    // Role filter
    document.querySelectorAll('.v4-role-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.v4-role-btn').forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
        this.currentRole = (e.currentTarget as HTMLElement).dataset.role || 'ALL';
        document.querySelector('.v4-layout')?.setAttribute('data-role', this.currentRole);
        this.filterPlayersByRole();
      });
    });
    
    // Metric pills
    document.getElementById('metrics-pills')?.addEventListener('click', (e) => {
      const pill = (e.target as HTMLElement).closest('.v4-metric-pill');
      if (!pill) return;
      
      const metric = pill.dataset.metric;
      if (this.selectedMetrics.includes(metric)) {
        if (this.selectedMetrics.length > 3) {
          this.selectedMetrics = this.selectedMetrics.filter(m => m !== metric);
          pill.classList.remove('active');
        }
      } else {
        this.selectedMetrics.push(metric);
        pill.classList.add('active');
      }
      this.renderRadar();
    });
    
    // Toggle percentile/values
    document.getElementById('toggle-percentile')?.addEventListener('click', () => {
      this.showPercentile = true;
      document.getElementById('toggle-percentile')?.classList.add('active');
      document.getElementById('toggle-values')?.classList.remove('active');
      this.renderRadar();
    });
    
    document.getElementById('toggle-values')?.addEventListener('click', () => {
      this.showPercentile = false;
      document.getElementById('toggle-values')?.classList.add('active');
      document.getElementById('toggle-percentile')?.classList.remove('active');
      this.renderRadar();
    });
  }
  
  private populatePlayerSelect(players: any[]) {
    const select = document.getElementById('player-select') as HTMLSelectElement;
    if (!select) return;
    select.innerHTML = '<option value="">Choisir un joueur...</option>' +
      players.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    
    // Populate leaderboard
    this.updateLeaderboard(players);
  }
  
  private updateLeaderboard(players: any[]) {
    const container = document.getElementById('leaderboard-body');
    const countBadge = document.getElementById('leaderboard-count');
    if (!container) return;
    
    countBadge && (countBadge.textContent = String(players.length));
    
    if (players.length === 0) {
      container.innerHTML = '<div class="v4-leaderboard-empty">Aucun joueur</div>';
      return;
    }
    
    // Sort by KDA for demo
    const sorted = [...players].sort((a, b) => (b.stats?.kda || 0) - (a.stats?.kda || 0));
    
    container.innerHTML = sorted.slice(0, 12).map((p, i) => `
      <div class="v4-leaderboard-item ${p.id === this.selectedPlayer?.id ? 'active' : ''}" data-player-id="${p.id}">
        <span class="v4-rank ${i < 3 ? 'top3' : 'other'}">${i + 1}</span>
        <div class="v4-leaderboard-info">
          <div class="v4-leaderboard-name">${p.name}</div>
          <div class="v4-leaderboard-team">${p.team || 'N/A'}</div>
        </div>
        <span class="v4-leaderboard-score">${(p.stats?.kda || 0).toFixed(1)}</span>
      </div>
    `).join('');
    
    // Click to select
    container.querySelectorAll('.v4-leaderboard-item').forEach(item => {
      item.addEventListener('click', () => {
        const playerId = (item as HTMLElement).dataset.playerId;
        const players = this.api.getState('players') || [];
        this.selectedPlayer = players.find((p: any) => p.id === playerId);
        
        const select = document.getElementById('player-select') as HTMLSelectElement;
        if (select) select.value = playerId || '';
        
        this.updatePlayerInfo();
        this.renderRadar();
        this.updateLeaderboardHighlight();
      });
    });
  }
  
  private updateLeaderboardHighlight() {
    document.querySelectorAll('.v4-leaderboard-item').forEach(item => {
      item.classList.toggle('active', (item as HTMLElement).dataset.playerId === this.selectedPlayer?.id);
    });
  }
  
  private filterPlayersByRole() {
    const players = this.api.getState('players') || [];
    const filtered = this.currentRole === 'ALL' 
      ? players 
      : players.filter((p: any) => p.role === this.currentRole);
    this.updateLeaderboard(filtered);
  }
  
  private updatePlayerInfo() {
    const info = document.getElementById('player-info');
    const roleTag = document.getElementById('player-role');
    const teamTag = document.getElementById('player-team');
    const radarName = document.getElementById('radar-player-name');
    const radarRole = document.getElementById('radar-role-tag');
    
    if (!this.selectedPlayer) {
      info?.style.setProperty('display', 'none');
      radarRole?.style.setProperty('display', 'none');
      if (radarName) radarName.textContent = 'Sélectionnez un joueur';
      return;
    }
    
    info?.style.setProperty('display', 'block');
    if (roleTag) {
      roleTag.textContent = this.selectedPlayer.role;
      roleTag.className = `v4-role-tag role-${this.selectedPlayer.role.toLowerCase()}`;
    }
    if (teamTag) teamTag.textContent = this.selectedPlayer.team || 'No Team';
    if (radarName) radarName.textContent = this.selectedPlayer.name;
    if (radarRole) {
      radarRole.textContent = this.selectedPlayer.role;
      radarRole.style.display = 'inline-block';
    }
    
    // Update role theme
    document.querySelector('.v4-layout')?.setAttribute('data-role', this.selectedPlayer.role);
  }
  
  private renderRadar() {
    if (!this.selectedPlayer) return;
    
    const canvas = document.getElementById('radar-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    this.chart?.destroy();
    
    const stats = this.selectedPlayer.stats || {};
    const labels = this.selectedMetrics.map(m => this.getMetricLabel(m));
    const data = this.selectedMetrics.map(m => {
      const val = stats[m] || 0;
      return this.showPercentile ? this.normalizeValue(val, m) : val;
    });
    
    const accentColor = this.getRoleColor(this.selectedPlayer.role);
    
    this.chart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: this.selectedPlayer.name,
          data,
          backgroundColor: accentColor + '33',
          borderColor: accentColor,
          borderWidth: 2,
          pointBackgroundColor: accentColor,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: accentColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: this.showPercentile ? 100 : undefined,
            ticks: { 
              display: false,
              stepSize: this.showPercentile ? 25 : undefined
            },
            grid: { color: 'rgba(148,163,184,0.1)' },
            angleLines: { color: 'rgba(148,163,184,0.1)' },
            pointLabels: {
              color: '#94a3b8',
              font: { size: 12, family: 'Inter', weight: '600' }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(21,21,30,0.95)',
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(148,163,184,0.2)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (ctx: any) => {
                const metric = this.selectedMetrics[ctx.dataIndex];
                const rawValue = stats[metric] || 0;
                const percentile = this.normalizeValue(rawValue, metric);
                return this.showPercentile 
                  ? `${ctx.label}: ${percentile.toFixed(0)}% (raw: ${rawValue.toFixed(1)})`
                  : `${ctx.label}: ${rawValue.toFixed(1)}`;
              }
            }
          }
        }
      }
    });
  }
  
  private normalizeValue(value: number, metric: string): number {
    const ranges: Record<string, [number, number]> = {
      kda: [0, 10], kp: [0, 100], cspm: [5, 10],
      visionScore: [20, 100], dpm: [300, 800], gd15: [-500, 1500]
    };
    const [min, max] = ranges[metric] || [0, 100];
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  }
  
  private getMetricLabel(metric: string): string {
    const labels: Record<string, string> = {
      kda: 'KDA', kp: 'KP%', cspm: 'CSPM', visionScore: 'VISION',
      dpm: 'DPM', gd15: 'GD@15'
    };
    return labels[metric] || metric.toUpperCase();
  }
  
  private getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      TOP: '#FF4444', JUNGLE: '#00E676', MID: '#00D4FF',
      ADC: '#FFD700', SUPPORT: '#E040FB'
    };
    return colors[role] || '#05AACE';
  }
}
