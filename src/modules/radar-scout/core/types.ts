// BMAD Core Types - Minimal pour Vercel
// @ts-nocheck

export interface BMADModule {
  readonly id: string;
  render(container: HTMLElement, coordinator: any): void;
  update?(state: any): void;
  destroy(): void;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  role: string;
  stats: Record<string, number>;
}
