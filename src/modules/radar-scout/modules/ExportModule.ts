// ExportModule.ts - Export avec icônes SVG
// @ts-nocheck
import type { BMADModule } from '../core/types';
import { Icons } from '../design/Icons';

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
          <span class="btn-icon">${Icons.image}</span>
          <span>PNG</span>
        </button>
        <button class="export-btn" id="export-csv" title="Exporter les données en CSV">
          <span class="btn-icon">${Icons.fileText}</span>
          <span>CSV</span>
        </button>
        <button class="export-btn" id="export-json" title="Exporter les données en JSON">
          <span class="btn-icon">${Icons.code}</span>
          <span>JSON</span>
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
        .btn-icon {
          width: 16px;
          height: 16px;
        }
      </style>
    `;

    container.querySelector('#export-png')?.addEventListener('click', () => this.exportPNG());
    container.querySelector('#export-csv')?.addEventListener('click', () => this.exportCSV());
    container.querySelector('#export-json')?.addEventListener('click', () => this.exportJSON());
  }

  update(state: any): void {}

  private exportPNG(): void {
    const canvas = document.getElementById('radar-chart-canvas') as HTMLCanvasElement;
    if (!canvas) {
      alert('Aucun radar à exporter');
      return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(canvas, 0, 0);
    ctx.save();
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'right';
    ctx.fillText('LeagueHugoScout', tempCanvas.width - 20, tempCanvas.height - 20);
    ctx.restore();

    const link = document.createElement('a');
    const player = this.coordinator.getState().selectedPlayer;
    link.download = player ? `${player.name}_radar.png` : 'radar.png';
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

    const headers = ['Player', 'Team', 'Role', 'KDA', 'KP%', 'CSPM', 'Vision', 'DPM', 'GD@15'];
    const rows = players.map(p => [
      p.name, p.team || 'N/A', p.role,
      p.stats?.kda || 0, p.stats?.kp || 0, p.stats?.cspm || 0,
      p.stats?.visionScore || 0, p.stats?.dpm || 0, p.stats?.gd15 || 0
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
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
        id: p.id, name: p.name, team: p.team, role: p.role, stats: p.stats
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
