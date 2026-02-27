// BMAD Types - Simplified for Vercel build
export interface BMADModule {
  readonly id: string;
  render(container: HTMLElement): void;
  update?(context: unknown): void;
  destroy(): void;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  role: string;
  stats: Record<string, number>;
}
