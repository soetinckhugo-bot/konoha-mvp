/**
 * PluginRegistry - Gestion du cycle de vie des modules
 * Story 1.1
 */

import type { Plugin, PluginManifest } from './types';

export class PluginRegistry {
  private manifests = new Map<string, PluginManifest>();
  private loadedPlugins = new Map<string, Plugin>();
  private activePlugin: Plugin | null = null;

  /**
   * Enregistre un manifest de plugin (appelé au scan initial)
   */
  register(manifest: PluginManifest): void {
    if (this.manifests.has(manifest.id)) {
      console.warn(`Plugin ${manifest.id} déjà enregistré`);
      return;
    }
    this.manifests.set(manifest.id, manifest);
  }

  /**
   * Charge dynamiquement un plugin via import()
   */
  async load(pluginId: string): Promise<Plugin> {
    if (this.loadedPlugins.has(pluginId)) {
      return this.loadedPlugins.get(pluginId)!;
    }

    const manifest = this.manifests.get(pluginId);
    if (!manifest) {
      throw new Error(`Plugin ${pluginId} non trouvé`);
    }

    // Dynamic import du module
    const module = await import(/* @vite-ignore */ manifest.entryPoint);
    const PluginClass = module.default;
    const plugin = new PluginClass() as Plugin;

    this.loadedPlugins.set(pluginId, plugin);
    return plugin;
  }

  /**
   * Décharge un plugin proprement
   */
  async unload(pluginId: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) return;

    await plugin.unmount();
    this.loadedPlugins.delete(pluginId);

    if (this.activePlugin === plugin) {
      this.activePlugin = null;
    }
  }

  /**
   * Définit le plugin actif
   */
  setActive(plugin: Plugin | null): void {
    this.activePlugin = plugin;
  }

  getActive(): Plugin | null {
    return this.activePlugin;
  }

  list(): PluginManifest[] {
    return Array.from(this.manifests.values());
  }

  /**
   * Récupère un plugin chargé
   */
  getLoaded(pluginId: string): Plugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }
}
