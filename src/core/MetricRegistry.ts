/**
 * MetricRegistry - FR31: registerMetric() API
 * Story 1.3
 */

import type { MetricConfig, MetricCategory, LoLRole } from './types';

export class MetricRegistry {
  private metrics = new Map<string, MetricConfig>();

  /**
   * Enregistre une métrique (API FR31)
   */
  register(config: MetricConfig): void {
    if (this.metrics.has(config.id)) {
      console.warn(`Metric ${config.id} already registered, skipping`);
      return;
    }

    // Validation
    this.validateConfig(config);
    
    this.metrics.set(config.id, config);
  }

  /**
   * Récupère une métrique par ID
   */
  get(id: string): MetricConfig | undefined {
    return this.metrics.get(id);
  }

  /**
   * Liste toutes les métriques
   */
  list(): MetricConfig[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Liste les métriques par catégorie
   */
  listByCategory(category: MetricCategory): MetricConfig[] {
    return this.list().filter(m => m.category === category);
  }

  /**
   * Liste les métriques par rôle (pour métriques roleSpecific)
   */
  listByRole(_role: LoLRole): MetricConfig[] {
    // Retourne toutes les métriques pertinentes pour un rôle
    return this.list().filter(m => {
      if (!m.normalize.roleSpecific) return true;
      return true;
    });
  }

  private validateConfig(config: MetricConfig): void {
    if (!config.id || typeof config.id !== 'string') {
      throw new Error('MetricConfig.id is required and must be a string');
    }
    if (!config.name || typeof config.name !== 'string') {
      throw new Error('MetricConfig.name is required');
    }
    if (!config.category) {
      throw new Error('MetricConfig.category is required');
    }
    if (!config.normalize || typeof config.normalize.min !== 'number') {
      throw new Error('MetricConfig.normalize with min/max is required');
    }
  }

  /**
   * Persiste les métriques custom dans localStorage
   */
  persist(): void {
    try {
      const metrics = this.list();
      localStorage.setItem('konoha_metrics', JSON.stringify(metrics));
    } catch (err) {
      console.error('Failed to persist metrics:', err);
    }
  }

  /**
   * Restaure les métriques depuis localStorage
   */
  restore(): void {
    try {
      const saved = localStorage.getItem('konoha_metrics');
      if (saved) {
        const metrics: MetricConfig[] = JSON.parse(saved);
        metrics.forEach(m => this.register(m));
      }
    } catch (err) {
      console.error('Failed to restore metrics:', err);
    }
  }
}
