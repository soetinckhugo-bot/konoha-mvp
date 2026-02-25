/**
 * KonohaCore - Singleton assemblant tous les services
 * Assembly Task 1.6
 */

import type { CoreAPI, PluginManifest } from './types';
import { PluginRegistry } from './PluginRegistry';
import { AppStateManager } from './AppStateManager';
import { MetricRegistry } from './MetricRegistry';
import { EventBus } from './EventBus';
import { ThemeService } from './ThemeService';
import { DataService } from './DataService';
import { StorageService } from './StorageService';
import { NormalizationService } from './NormalizationService';
import { ExportService } from './ExportService';

export class KonohaCore {
  private static instance: KonohaCore;

  // Services internes
  private pluginRegistry: PluginRegistry;
  private stateManager: AppStateManager;
  private metricRegistry: MetricRegistry;
  private eventBus: EventBus;
  private themeService: ThemeService;
  private dataService: DataService;
  private storageService: StorageService;
  private normalizationService: NormalizationService;
  private exportService: ExportService;

  // API exposée aux modules
  public api: CoreAPI;

  private constructor() {
    // Initialiser les services
    this.pluginRegistry = new PluginRegistry();
    this.stateManager = new AppStateManager();
    this.metricRegistry = new MetricRegistry();
    this.eventBus = new EventBus();
    this.themeService = new ThemeService();
    this.dataService = new DataService();
    this.storageService = new StorageService();
    this.normalizationService = new NormalizationService();
    this.exportService = new ExportService();

    // Construire l'API
    this.api = this.buildAPI();
  }

  static getInstance(): KonohaCore {
    if (!KonohaCore.instance) {
      KonohaCore.instance = new KonohaCore();
    }
    return KonohaCore.instance;
  }

  async initialize(): Promise<void> {
    // 1. Injecter les tokens CSS
    this.themeService.injectTokens();

    // 2. Restaurer le state depuis localStorage
    this.stateManager.restore();

    // 3. Restaurer les métriques custom
    this.metricRegistry.restore();

    // 4. Charger les données sauvegardées
    const savedPlayers = this.storageService.loadPlayers();
    if (savedPlayers) {
      this.stateManager.setState('players', savedPlayers);
    }

    const savedRanges = this.storageService.loadMetricRanges();
    if (savedRanges) {
      this.stateManager.setState('metricRanges', savedRanges.global);
      this.normalizationService.setMetricRanges(savedRanges.global);
    }

    // 5. Scanner les modules disponibles
    await this.scanModules();

    // 6. Émettre événement ready
    this.eventBus.emit('app:ready');
  }

  private async scanModules(): Promise<void> {
    // Auto-discovery des modules - pour l'instant on charge manuellement
    // Les modules seront enregistrés via leur manifest
    console.log('[KONOHA] Module scan complete');
  }

  private buildAPI(): CoreAPI {
    return {
      // FR31: Metric Registry API
      registerMetric: (config) => this.metricRegistry.register(config),
      getMetric: (id) => this.metricRegistry.get(id),
      listMetrics: () => this.metricRegistry.list(),
      listMetricsByCategory: (cat) => this.metricRegistry.listByCategory(cat),

      // State Management
      getState: (key) => this.stateManager.getState(key),
      setState: (key, value) => this.stateManager.setState(key, value),
      subscribe: (key, cb) => this.stateManager.subscribe(key, cb),

      // Event Bus
      emit: (event, payload) => this.eventBus.emit(event, payload),
      on: (event, handler) => this.eventBus.on(event, handler),
      once: (event, handler) => this.eventBus.once(event, handler),

      // Services
      export: {
        toPNG: (el, opts) => this.exportService.toPNG(el, opts),
        toClipboard: (blob) => this.exportService.toClipboard(blob),
        download: (blob, filename) => this.exportService.download(blob, filename)
      },
      
      data: {
        parseCSV: (file) => this.dataService.parseCSV(file),
        persist: (key, data) => this.storageService.set(key, data),
        load: (key) => this.storageService.get(key),
        clear: () => this.storageService.clear()
      },
      
      normalize: {
        normalize: (value, metric, role) => this.normalizationService.normalize(value, metric, role),
        calculatePercentile: (value, metricId, pool) => {
          // Mettre à jour les centiles si nécessaire
          const centiles = this.normalizationService.calculateCentiles(pool);
          this.normalizationService.setCentiles(centiles);
          return this.normalizationService.calculatePercentile(value, metricId);
        },
        getGrade: (percentile) => this.normalizationService.getGrade(percentile),
        calculateRanges: (players) => this.normalizationService.calculateRanges(players),
        calculateCentiles: (players) => this.normalizationService.calculateCentiles(players)
      },

      // Data Import
      importCSV: async (file) => {
        const result = await this.dataService.parseCSV(file);
        const players = result.players;
        this.stateManager.setState('players', players);
        
        // Calculer les ranges et centiles
        const ranges = this.normalizationService.calculateRanges(players);
        this.normalizationService.setMetricRanges(ranges);
        const centiles = this.normalizationService.calculateCentiles(players);
        this.normalizationService.setCentiles(centiles);
        
        // Sauvegarder dans le cache
        this.storageService.set('cached_players', players);
        this.storageService.set('cached_timestamp', Date.now());
      },

      // Theming
      getThemeVar: (name) => this.themeService.getThemeVar(name),
      setTheme: (id) => this.themeService.setTheme(id)
    };
  }

  // Méthodes utilitaires pour les modules
  
  /**
   * Enregistre un plugin manifest
   */
  registerPlugin(manifest: PluginManifest): void {
    this.pluginRegistry.register(manifest);
  }

  /**
   * Charge et monte un plugin
   */
  async loadPlugin(pluginId: string): Promise<void> {
    const plugin = await this.pluginRegistry.load(pluginId);
    
    // Vérifier canActivate
    const state = this.stateManager.getFullState();
    if (!plugin.canActivate(state)) {
      console.warn(`Plugin ${pluginId} cannot activate with current state`);
      return;
    }

    // Décharger le plugin actif
    const active = this.pluginRegistry.getActive();
    if (active) {
      await active.unmount();
    }

    // Monter le nouveau plugin
    await plugin.mount(this.api);
    this.pluginRegistry.setActive(plugin);
    this.stateManager.setState('currentModule', pluginId);
  }

  /**
   * Importe un fichier CSV
   */
  async importCSV(file: File): Promise<void> {
    this.stateManager.setState('isLoading', true);
    
    try {
      const parsed = await this.dataService.parseCSV(file);
      
      // Sauvegarder les joueurs
      this.storageService.savePlayers(parsed.players);
      this.stateManager.setState('players', parsed.players);
      
      // Calculer et sauvegarder les plages
      const ranges = this.normalizationService.calculateRanges(parsed.players);
      const centiles = this.normalizationService.calculateCentiles(parsed.players);
      
      this.normalizationService.setMetricRanges(ranges);
      this.normalizationService.setCentiles(centiles);
      
      this.stateManager.setState('metricRanges', ranges);
      this.storageService.saveMetricRanges({ global: ranges, byRole: {} as Record<string, Record<string, { min: number; max: number }>> });
      
      // Enregistrer les métriques dans le MetricRegistry avec catégories intelligentes
      for (const metricId of parsed.metrics) {
        if (!this.metricRegistry.get(metricId)) {
          // Détecter la catégorie selon le nom de la métrique
          const category = this.detectMetricCategory(metricId);
          const type = this.detectMetricType(metricId);
          const direction = this.detectMetricDirection(metricId);
          const format = this.detectMetricFormat(metricId);
          
          this.metricRegistry.register({
            id: metricId,
            name: this.formatMetricName(metricId),
            category,
            type,
            direction,
            normalize: { min: 0, max: 100 },
            format,
            decimals: format === 'percentage' ? 1 : 2
          });
        }
      }
      
      // Mettre à jour les métriques disponibles
      this.stateManager.setState('availableMetrics', parsed.metrics);
      this.stateManager.setState('selectedMetrics', parsed.metrics.slice(0, 8)); // Sélectionner les 8 premières
      
      // Émettre événement
      this.eventBus.emit('data:imported', { count: parsed.players.length, source: file.name });
      
      if (parsed.warnings.length > 0) {
        console.warn('[KONOHA] Import warnings:', parsed.warnings);
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.stateManager.setState('error', message);
      this.eventBus.emit('app:error', { message, code: 'IMPORT_FAILED' });
    } finally {
      this.stateManager.setState('isLoading', false);
    }
  }

  // Accès interne pour le Core
  getPluginRegistry(): PluginRegistry { return this.pluginRegistry; }
  getStateManager(): AppStateManager { return this.stateManager; }
  getEventBus(): EventBus { return this.eventBus; }
  getMetricRegistry(): MetricRegistry { return this.metricRegistry; }
  getNormalizationService(): NormalizationService { return this.normalizationService; }

  // === Helpers pour détection automatique des métriques ===
  
  private detectMetricCategory(metricId: string): 'combat' | 'vision' | 'farming' | 'early' | 'economy' {
    const id = metricId.toLowerCase();
    
    // Vision metrics
    if (id.includes('vision') || id.includes('wpm') || id.includes('vspm') || id.includes('wcpm') || id.includes('cwpm') || id.includes('vs%')) {
      return 'vision';
    }
    
    // Farming metrics
    if (id.includes('cspm') || id.includes('cs') || id.includes('farm')) {
      return 'farming';
    }
    
    // Early game metrics
    if (id.includes('@15') || id.includes('at_15') || id.includes('10') || id.includes('@10')) {
      return 'early';
    }
    
    // Economy metrics
    if (id.includes('gold') || id.includes('gpm') || id.includes('egpm')) {
      return 'economy';
    }
    
    // Combat metrics (default)
    return 'combat';
  }

  private detectMetricType(metricId: string): 'number' | 'percentage' | 'ratio' {
    const id = metricId.toLowerCase();
    
    if (id.includes('percent') || id.includes('%') || id.includes('share')) {
      return 'percentage';
    }
    
    if (id === 'kda') {
      return 'ratio';
    }
    
    return 'number';
  }

  private detectMetricDirection(metricId: string): 'higher-is-better' | 'lower-is-better' {
    const id = metricId.toLowerCase();
    
    // Lower is better for these
    if (id.includes('death') || id.includes('dth') || id.includes('counter_pick') || id.includes('ctr')) {
      return 'lower-is-better';
    }
    
    return 'higher-is-better';
  }

  private detectMetricFormat(metricId: string): 'decimal' | 'percentage' | 'integer' {
    const id = metricId.toLowerCase();
    
    if (id.includes('percent') || id.includes('%') || id.includes('share')) {
      return 'percentage';
    }
    
    if (id === 'kills' || id === 'deaths' || id === 'assists' || id === 'games_played' || id === 'steals' || id === 'solo_kills') {
      return 'integer';
    }
    
    return 'decimal';
  }

  private formatMetricName(metricId: string): string {
    // Convertir les IDs techniques en noms lisibles
    const nameMap: Record<string, string> = {
      'kda': 'KDA',
      'kills': 'K',
      'deaths': 'D',
      'assists': 'A',
      'kp_percent': 'KP%',
      'ks_percent': 'KS%',
      'dmg_percent': 'DMG%',
      'dt_percent': 'DT%',
      'dpm': 'DPM',
      'fb_percent': 'FB%',
      'solo_kills': 'SoloKills',
      'steals': 'STL',
      'cspm': 'CSPM',
      'csd_at_15': 'CSD@15',
      'gd_at_15': 'GD@15',
      'xpd_at_15': 'XPD@15',
      'csd_at_10': 'CSD@10',
      'gd_at_10': 'GD@10',
      'xpd_at_10': 'XPD@10',
      'egpm': 'EGPM',
      'gold_share': 'GOLD%',
      'wpm': 'WPM',
      'cwpm': 'CWPM',
      'wcpm': 'WCPM',
      'vspm': 'VSPM',
      'vision_share': 'VS%',
      'win_rate': 'W%',
      'counter_pick_rate': 'CTR%'
    };
    
    return nameMap[metricId.toLowerCase()] || 
           metricId
             .replace(/_/g, ' ')
             .replace(/\b\w/g, l => l.toUpperCase());
  }
}
