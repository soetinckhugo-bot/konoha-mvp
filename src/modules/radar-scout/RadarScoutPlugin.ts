// RadarScoutPlugin.ts - Point d'entrée BMAD v2.0
// @ts-nocheck
import { ModuleCoordinator } from './core/ModuleCoordinator';
import { PlayerSelectModule } from './modules/PlayerSelectModule';
import { ModeSelectorModule } from './modules/ModeSelectorModule';
import { RoleFilterModule } from './modules/RoleFilterModule';
import { MetricsSelectorModule } from './modules/MetricsSelectorModule';
import { RadarChartModule } from './modules/RadarChartModule';
import { LeaderboardModule } from './modules/LeaderboardModule';
import { PlayerAnalysisModule } from './modules/PlayerAnalysisModule';
import { ExportModule } from './modules/ExportModule';

export default class RadarScoutPlugin {
  id = 'radar-scout';
  name = 'Radar Scout';
  version = '2.0.0';
  description = 'Visualiseur de statistiques radar pour joueurs LoL';
  
  private coordinator: ModuleCoordinator | null = null;

  async mount(api: any) {
    console.log('🎯 RadarScout BMAD v2.0 mounted');
    
    const container = document.getElementById('module-container');
    if (!container) {
      console.error('module-container not found');
      return;
    }

    // Initialiser le coordinator
    this.coordinator = new ModuleCoordinator(api);

    // Rendre le layout V4
    this.renderLayout(container);

    // Enregistrer les modules BMAD
    this.coordinator.register(new PlayerSelectModule(), 'player-select-container');
    this.coordinator.register(new ModeSelectorModule(), 'mode-selector-container');
    this.coordinator.register(new RoleFilterModule(), 'role-filter-container');
    this.coordinator.register(new MetricsSelectorModule(), 'metrics-selector-container');
    this.coordinator.register(new ExportModule(), 'export-container');
    this.coordinator.register(new PlayerAnalysisModule(), 'player-analysis-container');
    this.coordinator.register(new RadarChartModule(), 'radar-chart-container');
    this.coordinator.register(new LeaderboardModule(), 'leaderboard-container');

    // Charger les données initiales
    const players = api.getState('players') || [];
    this.coordinator.setState('players', players);
    
    if (players.length > 0) {
      this.coordinator.setState('selectedPlayer', players[0]);
    }

    // S'abonner aux changements de players
    api.subscribe?.('players', (players: any[]) => {
      this.coordinator?.setState('players', players);
      if (players.length > 0 && !this.coordinator?.getState().selectedPlayer) {
        this.coordinator?.setState('selectedPlayer', players[0]);
      }
    });
  }
  
  unmount() {
    this.coordinator?.destroy();
    this.coordinator = null;
    return Promise.resolve();
  }

  private renderLayout(container: HTMLElement): void {
    container.innerHTML = `
      <div class="v4-layout v4-layout-wrapper" data-role="ALL">
        <!-- Left Sidebar -->
        <aside class="v4-sidebar-left">
          <!-- Player Selection Card -->
          <div class="v4-card">
            <div class="v4-card-header compact">
              <span class="v4-header-icon">👤</span>
              <span class="v4-header-title">Sélection Joueur</span>
            </div>
            <div class="v4-card-body" id="player-select-container"></div>
          </div>
          
          <!-- Mode Selection -->
          <div class="v4-card" style="margin-top:8px;">
            <div class="v4-card-header compact">
              <span class="v4-header-icon">🎮</span>
              <span class="v4-header-title">Mode</span>
            </div>
            <div class="v4-card-body" id="mode-selector-container"></div>
          </div>
          
          <!-- Role Filter -->
          <div class="v4-card" style="margin-top:8px;">
            <div class="v4-card-header compact">
              <span class="v4-header-icon">🎯</span>
              <span class="v4-header-title">Rôle</span>
            </div>
            <div class="v4-card-body" id="role-filter-container"></div>
          </div>
          
          <!-- Metrics -->
          <div class="v4-card" style="margin-top:8px;">
            <div class="v4-card-header compact">
              <span class="v4-header-icon">📈</span>
              <span class="v4-header-title">Métriques</span>
            </div>
            <div class="v4-card-body" id="metrics-selector-container"></div>
          </div>
          
          <!-- Export -->
          <div class="v4-card" style="margin-top:8px;">
            <div class="v4-card-header compact">
              <span class="v4-header-icon">💾</span>
              <span class="v4-header-title">Export</span>
            </div>
            <div class="v4-card-body" id="export-container"></div>
          </div>
        </aside>
        
        <!-- Center Column -->
        <div class="v4-center-col">
          <!-- Radar Chart -->
          <div class="v4-card" id="radar-chart-container" style="flex:1; min-height:400px;"></div>
          
          <!-- Player Analysis (under radar) -->
          <div id="player-analysis-container" style="margin-top:8px;"></div>
        </div>
        
        <!-- Right Sidebar - Leaderboard -->
        <aside class="v4-sidebar-right">
          <div class="v4-card" id="leaderboard-container" style="height:100%;"></div>
        </aside>
      </div>
      
      <style>
        /* Layout 3 colonnes */
        .v4-layout-wrapper { 
          display: grid; 
          grid-template-columns: 220px 1fr 240px; 
          gap: 12px; 
          padding: 12px 16px;
          max-width: 1600px;
          margin: 0 auto;
        }
        .v4-center-col {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .v4-sidebar-left, .v4-sidebar-right {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        /* Styles complémentaires pour le leaderboard */
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
        .player-info { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 1100px) {
          .v4-layout-wrapper { grid-template-columns: 200px 1fr 200px; }
        }
        @media (max-width: 900px) {
          .v4-layout-wrapper { grid-template-columns: 1fr; }
          .v4-sidebar-left, .v4-sidebar-right { order: 2; }
        }
      </style>
    `;
  }
}
