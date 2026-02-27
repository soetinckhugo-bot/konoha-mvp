// SoloModule.ts - Simplified for Vercel build
// @ts-nocheck
export class SoloModule {
  readonly id = 'solo-module';
  private container: HTMLElement | null = null;
  
  render(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = '<div>Solo Module</div>';
  }
  
  destroy(): void {
    this.container = null;
  }
}
