/**
 * ExportService - Export PNG et clipboard
 * Story 5.1
 */

import html2canvas from 'html2canvas';
import type { ExportOptions } from './types';

export class ExportService {
  /**
   * Capture un élément DOM en PNG
   */
  async toPNG(element: HTMLElement, options: ExportOptions): Promise<Blob> {
    const canvas = await html2canvas(element, {
      width: options.width,
      height: options.height,
      scale: options.scale || 2,  // Haute résolution
      backgroundColor: options.transparent ? null : undefined,
      logging: false,
      useCORS: true
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/png', 0.95);
    });
  }

  /**
   * Copie dans le presse-papiers
   */
  async toClipboard(blob: Blob): Promise<void> {
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
  }

  /**
   * Télécharge le fichier
   */
  download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
