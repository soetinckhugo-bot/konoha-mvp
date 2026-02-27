// CompareModule.ts - Simplified for Vercel build
// @ts-nocheck
export class CompareModule {
  readonly id = 'compare';
  private container: HTMLElement | null = null;
  
  render(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = '<div>Compare Module</div>';
  }
  
  destroy(): void {
    this.container = null;
  }
}
