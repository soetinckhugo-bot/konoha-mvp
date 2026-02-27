// ExportModule.ts - Export PNG/CSV/JSON avec watermark LeagueHugoScout
// @ts-nocheck
import type { BMADModule } from '../core/types';

export class ExportModule implements BMADModule {
  readonly id = 'export-module';
  private container: HTMLElement | null = null;
  private coordinator: any = null;

  render(container: HTMLElement, coordinator: any): void {
    this.container = container;
    this.coordinator = coordinator;

    container.innerHTML = `
      <div class="export-panel">
        <button class="export-btn" id="export-png" title="Exporter le radar en PNG">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Export PNG
        </button>
        <button class="export-btn" id="export-csv" title="Exporter les données en CSV">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Export CSV
        </button>
        <button class="export-btn" id="export-json" title="Exporter les données en JSON">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Export JSON
        </button>
      </div>
      
      <style>
        .export-panel {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .export-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--v4-bg-input);
          border: 1px solid var(--v4-border);
          border-radius: 8px;
          color: var(--v4-text);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .export-btn:hover {
          background: var(--v4-accent);
          border-color: var(--v4-accent);
          color: #000;
        }
        .export-btn svg {
          flex-shrink: 0;
        }
      </style>
    `;

    // Event listeners
    container.querySelector('#export-png')?.addEventListener('click', () => this.exportPNG());
    container.querySelector('#export-csv')?.addEventListener('click', () => this.exportCSV());
    container.querySelector('#export-json')?.addEventListener('click', () => this.exportJSON());
  }

  update(state: any): void {
    // Rien à mettre à jour en temps réel
  }

  private exportPNG(): void {
    const canvas = document.getElementById('radar-chart-canvas') as HTMLCanvasElement;
    if (!canvas) {
      alert('Aucun radar à exporter');
      return;
    }

    // Créer un canvas temporaire avec le watermark
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Copier le radar
    ctx.drawImage(canvas, 0, 0);

    // Ajouter le watermark LeagueHugoScout
    ctx.save();
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'right';
    ctx.fillText('LeagueHugoScout', tempCanvas.width - 20, tempCanvas.height - 20);
    ctx.restore();

    // Télécharger
    const link = document.createElement('a');
    const player = this.coordinator.getState().selectedPlayer;
    const filename = player ? `${player.name}_radar.png` : 'radar.png';
    link.download = filename;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  }

  private exportCSV(): void {
    const state = this.coordinator.getState();
    const players = state.players || [];
    
    if (players.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    // Headers
    const headers = ['Player', 'Team', 'Role', 'KDA', 'KP%', 'CSPM', 'Vision', 'DPM', 'GD@15'];
    
    // Data rows
    const rows = players.map(p => [
      p.name,
      p.team || 'N/A',
      p.role,
      p.stats?.kda || 0,
      p.stats?.kp || 0,
      p.stats?.cspm || 0,
      p.stats?.visionScore || 0,
      p.stats?.dpm || 0,
      p.stats?.gd15 || 0
    ]);

    // CSV content
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'leaguehugoscout_data.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private exportJSON(): void {
    const state = this.coordinator.getState();
    const players = state.players || [];
    
    if (players.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      source: 'LeagueHugoScout',
      playerCount: players.length,
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        team: p.team,
        role: p.role,
        stats: p.stats
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'leaguehugoscout_data.json';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  destroy(): void {
    this.container = null;
    this.coordinator = null;
  }
}
