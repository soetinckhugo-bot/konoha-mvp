// PlayerSelectModule.ts - Simplified for Vercel build
// @ts-nocheck
export class PlayerSelectModule {
  readonly id = 'player-select';
  private container: HTMLElement | null = null;
  
  render(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = '<div>Player Select</div>';
  }
  
  destroy(): void {
    this.container = null;
  }
}
