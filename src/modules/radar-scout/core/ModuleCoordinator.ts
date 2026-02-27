// ModuleCoordinator.ts - Orchestrateur BMAD v2.0
// @ts-nocheck
import type { BMADModule } from './types';

export interface CoordinatorState {
  mode: 'solo' | 'compare' | 'benchmark' | 'team';
  selectedPlayer: any | null;
  comparedPlayer: any | null;
  currentRole: string;
  selectedMetrics: string[];
  players: any[];
}

export class ModuleCoordinator {
  private modules: Map<string, BMADModule> = new Map();
  private containers: Map<string, HTMLElement> = new Map();
  private state: CoordinatorState = {
    mode: 'solo',
    selectedPlayer: null,
    comparedPlayer: null,
    currentRole: 'ALL',
    selectedMetrics: ['kda', 'kp', 'cspm', 'visionScore', 'dpm'],
    players: []
  };
  private listeners: Set<(state: CoordinatorState) => void> = new Set();
  private api: any;

  constructor(api: any) {
    this.api = api;
  }

  // Enregistrer un module BMAD
  register(module: BMADModule, containerId: string): void {
    this.modules.set(module.id, module);
    
    const container = document.getElementById(containerId);
    if (container) {
      this.containers.set(module.id, container);
      module.render(container, this);
    }
  }

  // Obtenir l'état
  getState(): CoordinatorState {
    return { ...this.state };
  }

  // Mettre à jour l'état et notifier les modules
  setState<K extends keyof CoordinatorState>(key: K, value: CoordinatorState[K]): void {
    this.state[key] = value;
    this.notifyModules();
    this.listeners.forEach(cb => cb(this.getState()));
  }

  // S'abonner aux changements d'état
  subscribe(callback: (state: CoordinatorState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notifier tous les modules d'une mise à jour
  private notifyModules(): void {
    this.modules.forEach(module => {
      if (module.update) {
        module.update(this.getState());
      }
    });
  }

  // Détruire tous les modules
  destroy(): void {
    this.modules.forEach(module => module.destroy());
    this.modules.clear();
    this.containers.clear();
    this.listeners.clear();
  }
}
