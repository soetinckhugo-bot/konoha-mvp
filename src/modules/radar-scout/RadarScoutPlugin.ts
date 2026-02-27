// RadarScoutPlugin.ts - V4 Layout avec Chart.js
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
  private selectedMetrics = ['kda', 'kp', 'cspm', 'visionScore', 'dpm'];
  
  async mount(api: any) {
    this.api = api;
    console.log('RadarScout plugin mounted');
    
    const container = document.getElementById('module-container');
    if (!container) return;
    
    this.renderLayout(container);
    this.setupEventListeners();
    
    // Load initial data
    const players = api.getState('players') || [];
    if (players.length > 0) {
      this.populatePlayerSelect(players);
      this.selectedPlayer = players[0];
      this.renderRadar();
    }
    
    // Subscribe to state changes
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
    console.log('RadarScout plugin unmounted');
    return Promise.resolve();
  }
  
  private renderLayout(container: HTMLElement) {
    container.innerHTML = `
      <div class="v4-layout">
        <!-- Sidebar -->
        <aside class="v4-sidebar">
          <div class="v4-panel player-panel">
            <h3 class="panel-title">Sélection Joueur</h3>
            <select id="player-select" class="v4-select">
              <option value="">Choisir un joueur...</option>
            </select>
            <div id="player-info" class="player-info" style="display:none;margin-top:12px;">
              <div class="player-role-badge" id="player-role"></div>
              <div class="player-team" id="player-team"></div>
            </div>
          </div>
          
          <div class="v4-panel metrics-panel" style="margin-top:16px;">
            <h3 class="panel-title">Métriques</h3>
            <div class="metrics-grid" id="metrics-grid">
              ${this.renderMetricToggles()}
            </div>
          </div>
          
          <div class="v4-panel actions-panel" style="margin-top:16px;">
            <button id="export-radar-btn" class="v4-btn v4-btn-primary" style="width:100%;">
              📊 Exporter PNG
            </button>
          </div>
        </aside>
        
        <!-- Main Content -->
        <div class="v4-main">
          <div class="v4-panel chart-panel">
            <div class="chart-header">
              <h2 id="chart-title">Sélectionnez un joueur</h2>
              <div class="chart-actions">
                <button id="toggle-percentile" class="v4-btn v4-btn-sm">% Centiles</button>
              </div>
            </div>
            <div class="chart-container">
              <canvas id="radar-canvas"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        .v4-layout { display:grid; grid-template-columns:300px 1fr; gap:24px; padding:24px; max-width:1400px; margin:0 auto; }
        .v4-sidebar { display:flex; flex-direction:column; }
        .v4-panel { background:rgba(20,22,30,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px; backdrop-filter:blur(10px); }
        .panel-title { font-size:14px; font-weight:600; color:#fff; margin:0 0 12px 0; text-transform:uppercase; letter-spacing:0.5px; }
        .v4-select { width:100%; padding:10px 14px; background:rgba(10,12,18,0.8); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; font-size:14px; }
        .metrics-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .metric-toggle { display:flex; align-items:center; gap:8px; padding:8px; background:rgba(255,255,255,0.04); border-radius:6px; cursor:pointer; transition:background 0.2s; }
        .metric-toggle:hover { background:rgba(255,255,255,0.08); }
        .metric-toggle input { accent-color:#4ECDC4; }
        .metric-toggle label { font-size:12px; color:#a0a8b8; cursor:pointer; }
        .v4-btn { padding:10px 18px; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; }
        .v4-btn-primary { background:linear-gradient(135deg,#4ECDC4,#44A08D); color:#fff; }
        .v4-btn-primary:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(78,205,196,0.3); }
        .v4-btn-sm { padding:6px 12px; font-size:12px; background:rgba(255,255,255,0.08); color:#fff; }
        .v4-main { min-height:600px; }
        .chart-panel { height:100%; display:flex; flex-direction:column; }
        .chart-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
        .chart-header h2 { font-size:18px; color:#fff; margin:0; }
        .chart-container { flex:1; display:flex; align-items:center; justify-content:center; min-height:500px; position:relative; }
        #radar-canvas { max-width:500px; max-height:500px; }
        .player-role-badge { display:inline-block; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:600; text-transform:uppercase; }
        .player-role-TOP { background:#FF6B6B; }
        .player-role-JUNGLE { background:#4ECDC4; }
        .player-role-MID { background:#FFD93D; color:#000; }
        .player-role-ADC { background:#6BCB77; }
        .player-role-SUPPORT { background:#A855F7; }
        .player-team { font-size:12px; color:#8892a0; margin-top:4px; }
        @media (max-width:900px) {
          .v4-layout { grid-template-columns:1fr; }
          .v4-sidebar { order:2; }
        }
      </style>
    `;
  }
  
  private renderMetricToggles() {
    const metrics = [
      { id: 'kda', label: 'KDA' },
      { id: 'kp', label: 'KP%' },
      { id: 'cspm', label: 'CSPM' },
      { id: 'visionScore', label: 'Vision' },
      { id: 'dpm', label: 'DPM' },
      { id: 'gd15', label: 'GD@15' },
    ];
    return metrics.map(m => `
      <div class="metric-toggle">
        <input type="checkbox" id="metric-${m.id}" value="${m.id}" ${this.selectedMetrics.includes(m.id) ? 'checked' : ''}>
        <label for="metric-${m.id}">${m.label}</label>
      </div>
    `).join('');
  }
  
  private setupEventListeners() {
    // Player select
    const playerSelect = document.getElementById('player-select');
    playerSelect?.addEventListener('change', (e) => {
      const players = this.api.getState('players') || [];
      this.selectedPlayer = players.find((p: any) => p.id === (e.target as HTMLSelectElement).value);
      this.updatePlayerInfo();
      this.renderRadar();
    });
    
    // Metric toggles
    document.querySelectorAll('.metric-toggle input').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.checked) {
          this.selectedMetrics.push(target.value);
        } else {
          this.selectedMetrics = this.selectedMetrics.filter(m => m !== target.value);
        }
        this.renderRadar();
      });
    });
    
    // Export
    document.getElementById('export-radar-btn')?.addEventListener('click', () => {
      this.exportRadar();
    });
  }
  
  private populatePlayerSelect(players: any[]) {
    const select = document.getElementById('player-select') as HTMLSelectElement;
    if (!select) return;
    select.innerHTML = '<option value="">Choisir un joueur...</option>' +
      players.map(p => `<option value="${p.id}">${p.name} (${p.team || 'N/A'})</option>`).join('');
  }
  
  private updatePlayerInfo() {
    const info = document.getElementById('player-info');
    const roleBadge = document.getElementById('player-role');
    const team = document.getElementById('player-team');
    
    if (!this.selectedPlayer) {
      info?.style.setProperty('display', 'none');
      return;
    }
    
    info?.style.setProperty('display', 'block');
    if (roleBadge) {
      roleBadge.className = `player-role-badge player-role-${this.selectedPlayer.role}`;
      roleBadge.textContent = this.selectedPlayer.role;
    }
    if (team) team.textContent = this.selectedPlayer.team || 'No Team';
    
    const title = document.getElementById('chart-title');
    if (title) title.textContent = this.selectedPlayer.name;
  }
  
  private renderRadar() {
    if (!this.selectedPlayer) return;
    
    const canvas = document.getElementById('radar-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    this.chart?.destroy();
    
    const stats = this.selectedPlayer.stats || {};
    const labels = this.selectedMetrics.map(m => this.getMetricLabel(m));
    const data = this.selectedMetrics.map(m => this.normalizeValue(stats[m] || 0, m));
    
    this.chart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: this.selectedPlayer.name,
          data,
          backgroundColor: 'rgba(78, 205, 196, 0.2)',
          borderColor: '#4ECDC4',
          borderWidth: 2,
          pointBackgroundColor: '#4ECDC4',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#4ECDC4'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            min: 0,
            ticks: { display: false },
            grid: { color: 'rgba(255,255,255,0.1)' },
            angleLines: { color: 'rgba(255,255,255,0.1)' },
            pointLabels: {
              color: '#a0a8b8',
              font: { size: 12, family: 'Inter' }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(20,22,30,0.9)',
            titleColor: '#fff',
            bodyColor: '#a0a8b8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: {
              label: (ctx: any) => {
                const metric = this.selectedMetrics[ctx.dataIndex];
                const rawValue = stats[metric] || 0;
                return `${ctx.label}: ${rawValue.toFixed(1)} (${ctx.raw.toFixed(0)}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  private normalizeValue(value: number, metric: string): number {
    // Simple normalization - can be enhanced with proper ranges
    const ranges: Record<string, [number, number]> = {
      kda: [0, 10],
      kp: [0, 100],
      cspm: [5, 10],
      visionScore: [20, 100],
      dpm: [300, 800],
      gd15: [-500, 1500]
    };
    const [min, max] = ranges[metric] || [0, 100];
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  }
  
  private getMetricLabel(metric: string): string {
    const labels: Record<string, string> = {
      kda: 'KDA', kp: 'KP%', cspm: 'CSPM', visionScore: 'Vision',
      dpm: 'DPM', gd15: 'GD@15', csd15: 'CSD@15', xpd15: 'XPD@15'
    };
    return labels[metric] || metric;
  }
  
  private exportRadar() {
    const canvas = document.getElementById('radar-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `${this.selectedPlayer?.name || 'radar'}_stats.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}
