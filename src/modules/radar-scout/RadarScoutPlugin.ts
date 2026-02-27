// RadarScoutPlugin.ts - Point d'entrée BMAD v2.0
// @ts-nocheck
import { ModuleCoordinator } from './core/ModuleCoordinator';
import { Icons } from './design/Icons';
import { PlayerSelectModule } from './modules/PlayerSelectModule';
import { ModeSelectorModule } from './modules/ModeSelectorModule';
import { RoleFilterModule } from './modules/RoleFilterModule';
import { MetricsSelectorModule } from './modules/MetricsSelectorModule';
import { RadarChartModule } from './modules/RadarChartModule';
import { LeaderboardModule } from './modules/LeaderboardModule';
import { PlayerTiersModule } from './modules/PlayerTiersModule';
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

    this.coordinator = new ModuleCoordinator(api);
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
    this.coordinator.register(new PlayerTiersModule(), 'player-tiers-container');

    const players = api.getState('players') || [];
    this.coordinator.setState('players', players);
    
    if (players.length > 0) {
      this.coordinator.setState('selectedPlayer', players[0]);
    }

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
          <!-- Player Selection -->
          <div class="v4-card">
            <div class="v4-card-header compact">
              <span class="header-icon">${Icons.user}</span>
              <span class="v4-header-title">Sélection Joueur</span>
            </div>
            <div class="v4-card-body" id="player-select-container"></div>
          </div>
          
          <!-- Mode Selection -->
          <div class="v4-card" style="margin-top:12px;">
            <div class="v4-card-header compact">
              <span class="header-icon">${Icons.gamepad}</span>
              <span class="v4-header-title">Mode</span>
            </div>
            <div class="v4-card-body" id="mode-selector-container"></div>
          </div>
          
          <!-- Role Filter -->
          <div class="v4-card" style="margin-top:12px;">
            <div class="v4-card-header compact">
              <span class="header-icon">${Icons.target}</span>
              <span class="v4-header-title">Rôle</span>
            </div>
            <div class="v4-card-body" id="role-filter-container"></div>
          </div>
          
          <!-- Metrics -->
          <div class="v4-card" style="margin-top:12px;">
            <div class="v4-card-header compact">
              <span class="header-icon">${Icons.chart}</span>
              <span class="v4-header-title">Métriques</span>
            </div>
            <div class="v4-card-body" id="metrics-selector-container"></div>
          </div>
          
          <!-- Export -->
          <div class="v4-card" style="margin-top:12px;">
            <div class="v4-card-header compact">
              <span class="header-icon">${Icons.save}</span>
              <span class="v4-header-title">Export</span>
            </div>
            <div class="v4-card-body" id="export-container"></div>
          </div>
        </aside>
        
        <!-- Center Column -->
        <div class="v4-center-col">
          <div class="v4-card" id="radar-chart-container" style="flex:1; min-height:400px;"></div>
          <div id="player-analysis-container" style="margin-top:12px;"></div>
        </div>
        
        <!-- Right Sidebar - Leaderboard + Tiers -->
        <aside class="v4-sidebar-right">
          <div class="v4-card" id="leaderboard-container"></div>
          <div id="player-tiers-container"></div>
        </aside>
      </div>
      
      <style>
        .v4-layout-wrapper { 
          display: grid; 
          grid-template-columns: 240px 1fr 280px; 
          gap: 16px; 
          padding: 16px;
          max-width: 1600px;
          margin: 0 auto;
          align-items: start;
        }
        .v4-center-col {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .v4-sidebar-left, .v4-sidebar-right {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .v4-card {
          background: var(--v4-bg-card);
          border: 1px solid var(--v4-border);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--shadow-card);
          transition: all 0.3s ease;
        }
        .v4-card:hover {
          border-color: var(--v4-border-visible);
          box-shadow: var(--shadow-card), 0 0 30px var(--role-glow, transparent);
        }
        .v4-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--v4-border);
        }
        .v4-card-header.compact {
          padding: 12px;
        }
        .header-icon {
          width: 18px;
          height: 18px;
          color: var(--v4-accent);
        }
        .v4-header-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--v4-text);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex: 1;
        }
        .v4-card-body {
          padding: 12px;
        }
        
        @media (max-width: 1200px) {
          .v4-layout-wrapper { grid-template-columns: 220px 1fr 260px; }
        }
        @media (max-width: 1000px) {
          .v4-layout-wrapper { grid-template-columns: 1fr; }
          .v4-sidebar-left, .v4-sidebar-right { order: 2; }
        }
      </style>
    `;
  }
}
