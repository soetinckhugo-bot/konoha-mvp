/**
 * ExportService - Service d'export pour BMAD
 * 
 * Responsabilité : Exporter les graphiques et données
 * Formats : PNG, CSV, JSON
 */

export interface ExportConfig {
  filename?: string;
  quality?: number;
  backgroundColor?: string;
}

export class ExportService {
  /**
   * Exporte un élément DOM en PNG
   */
  static async exportToPNG(
    _element: HTMLElement,
    config: ExportConfig = {}
  ): Promise<Blob> {
    const {
      quality = 1,
      backgroundColor = '#0a0a0f'
    } = config;

    // Utilise html2canvas ou équivalent
    // Pour l'instant, on crée une implémentation basique
    const canvas = await this.domToCanvas(element, backgroundColor);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        },
        'image/png',
        quality
      );
    });
  }

  /**
   * Télécharge un blob
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Exporte les données joueurs en CSV
   */
  static exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string = 'players.csv'
  ): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(h => {
          const value = row[h];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, filename);
  }

  /**
   * Exporte les données en JSON
   */
  static exportToJSON<T>(
    data: T,
    filename: string = 'data.json'
  ): void {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    this.downloadBlob(blob, filename);
  }

  /**
   * Convertit un élément DOM en canvas
   */
  private static async domToCanvas(
    _element: HTMLElement,
    backgroundColor: string
  ): Promise<HTMLCanvasElement> {
    // Mock rect - in real app would use element.getBoundingClientRect()
    const _rect = { width: 400, height: 400 };
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = rect.width * 2; // Retina
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    // Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Scale for retina
    ctx.scale(2, 2);
    
    // Simple rendering - dans une vraie app, utiliser html2canvas
    await this.renderElement(ctx, element, 0, 0);
    
    return canvas;
  }

  /**
   * Rend un élément sur le canvas (simplifié)
   */
  private static async renderElement(
    ctx: CanvasRenderingContext2D,
    _element: HTMLElement,
    x: number,
    y: number
  ): Promise<void> {
    // Implémentation simplifiée
    // Dans une vraie app, utiliser html2canvas ou similar
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Radar Scout Export', x + 20, y + 30);
    
    // Dessine un cercle radar simplifié
    const centerX = x + 200;
    const centerY = y + 200;
    const radius = 150;
    
    ctx.strokeStyle = '#60A5FA';
    ctx.lineWidth = 2;
    
    // Cercles concentriques
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 5) * i, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Lignes axes
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      ctx.stroke();
    }
  }
}

export default ExportService;
