// CentilesPanelModule.ts - Simplified for Vercel build
// @ts-nocheck
export class CentilesPanelModule {
  readonly id = 'centiles-panel';
  private container: HTMLElement | null = null;
  
  render(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = '<div>Centiles Panel</div>';
  }
  
  destroy(): void {
    this.container = null;
  }
}
