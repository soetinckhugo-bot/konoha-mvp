// BenchmarkModule.ts - Simplified for Vercel build
// @ts-nocheck
export class BenchmarkModule {
  readonly id = 'benchmark';
  private container: HTMLElement | null = null;
  
  render(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = '<div>Benchmark Module</div>';
  }
  
  destroy(): void {
    this.container = null;
  }
}
