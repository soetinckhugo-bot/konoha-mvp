/**
 * KONOHA CORE INTERFACES
 * ======================
 * API Contracts - Version 1.0 STABLE
 * Date: 2026-02-25
 * 
 * ⚠️  CRITICAL: Ces interfaces sont STABILISÉES (IR PASS)
 */

// =============================================================================
// CORE TYPES - Types fondamentaux
// =============================================================================

/** Rôles League of Legends */
export type LoLRole = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

/** Catégories de métriques */
export type MetricCategory = 'combat' | 'vision' | 'farming' | 'early' | 'economy';

/** Types de données métrique */
export type MetricType = 'percentage' | 'number' | 'ratio' | 'time';

/** Direction d'interprétation */
export type MetricDirection = 'higher-is-better' | 'lower-is-better';

/** Format d'affichage (sérialisable) */
export type MetricFormat = 'decimal' | 'percentage' | 'time' | 'integer';

/** Modes de visualisation radar */
export type RadarViewMode = 'solo' | 'compare' | 'benchmark' | 'duel';

/** Vue temporelle */
export type Timeframe = 'all' | '10' | '15' | 'compare';

// =============================================================================
// FR31: METRIC CONFIG API - Interface stabilisée
// =============================================================================

export interface MetricConfig {
  /** Identifiant unique (snake_case recommandé) */
  id: string;

  /** Nom affiché (ex: "CSD@15") */
  name: string;

  /** Catégorie regroupant la métrique */
  category: MetricCategory;

  /** Type de donnée pour le formatage */
  type: MetricType;

  /** Direction d'interprétation (pour normalisation) */
  direction: MetricDirection;

  /** Configuration de normalisation 0-100 */
  normalize: {
    /** Valeur minimale (score 0) */
    min: number;
    /** Valeur maximale (score 100) */
    max: number;
    /** true si plages différentes par rôle */
    roleSpecific?: boolean;
  };

  /** Format d'affichage (enum sérialisable - pas de fonction!) */
  format: MetricFormat;

  /** Nombre de décimales (défaut: 1) */
  decimals?: number;

  /** Description pour tooltip/lexique */
  description?: string;

  /** Icône (emoji ou classe CSS) */
  icon?: string;

  /**
   * EXTENSIBILITY: Bucket pour extensions futures
   */
  advanced?: {
    /** Poids pour scoring global (optionnel) */
    weight?: number;
    /** Métriques à masquer par défaut */
    hidden?: boolean;
    /** Ordre d'affichage */
    order?: number;
    /** Tags pour filtrage */
    tags?: string[];
  };
}

/** Type de grade pour les stats (5 tiers: S/A/B/C/D) */
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

/** Type de grade pour les joueurs (4 tiers) */
export type PlayerTier = 'ELITE' | 'EXCELLENT' | 'GOOD' | 'WEAK';

/**
 * Valeur métrique avec contexte
 */
export interface MetricValue {
  config: MetricConfig;
  raw: number;
  normalized: number;  // 0-100
  percentile: number;  // 0-100
  grade: Grade;
}

// =============================================================================
// FR29: PLUGIN API - Dynamic Module Loading
// =============================================================================

/**
 * Interface que tous les modules doivent implémenter
 */
export interface Plugin {
  /** Identifiant unique du module */
  readonly id: string;

  /** Nom affiché dans le HUB */
  readonly name: string;

  /** Version sémantique */
  readonly version: string;

  /** Icône pour navigation */
  readonly icon?: string;

  /**
   * Initialisation du module
   */
  mount(core: CoreAPI): void | Promise<void>;

  /**
   * Nettoyage avant démontage
   */
  unmount(): void | Promise<void>;

  /**
   * Vérifie si le module peut s'activer avec les données actuelles
   */
  canActivate(state: AppState): boolean;
}

/**
 * Métadonnées d'un plugin (pour registry)
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  entryPoint: string;  // Path pour dynamic import
  dependencies?: string[];  // IDs plugins requis
}

// =============================================================================
// CORE API - Interface exposée aux modules
// =============================================================================

/**
 * API Core fournie à chaque module au mount()
 */
export interface CoreAPI {
  // ── FR31: Metric Registry API ─────────────────────────────────────────────
  
  /** Enregistre une nouvelle métrique */
  registerMetric(config: MetricConfig): void;
  
  /** Récupère une métrique par ID */
  getMetric(id: string): MetricConfig | undefined;
  
  /** Liste toutes les métriques enregistrées */
  listMetrics(): MetricConfig[];
  
  /** Liste les métriques par catégorie */
  listMetricsByCategory(category: MetricCategory): MetricConfig[];

  // ── State Management ─────────────────────────────────────────────────────
  
  /** Lit une valeur du state global */
  getState<K extends keyof AppState>(key: K): AppState[K];
  
  /** Écrit une valeur et notifie les abonnés */
  setState<K extends keyof AppState>(key: K, value: AppState[K]): void;
  
  /** S'abonne aux changements d'une clé */
  subscribe<K extends keyof AppState>(
    key: K,
    callback: (newVal: AppState[K], oldVal: AppState[K]) => void
  ): () => void;  // Retourne unsubscribe

  // ── Event Bus ────────────────────────────────────────────────────────────
  
  /** Émet un événement */
  emit<T = unknown>(event: string, payload?: T): void;
  
  /** Écoute un événement */
  on<T = unknown>(event: string, handler: (payload: T) => void): () => void;
  
  /** Écoute une seule fois */
  once<T = unknown>(event: string, handler: (payload: T) => void): void;

  // ── Services ─────────────────────────────────────────────────────────────
  
  /** Service d'export (PNG, clipboard) */
  export: ExportServiceAPI;
  
  /** Service de données (CSV, localStorage) */
  data: DataServiceAPI;
  
  /** Service de normalisation */
  normalize: NormalizationServiceAPI;

  // ── Data Import ───────────────────────────────────────────────────────────
  
  /** Importe un fichier CSV */
  importCSV(file: File): Promise<void>;

  // ── Theming ──────────────────────────────────────────────────────────────
  
  /** Récupère une variable CSS thème */
  getThemeVar(name: string): string;
  
  /** Applique un thème */
  setTheme(themeId: string): void;
}

// =============================================================================
// SERVICES APIs
// =============================================================================

export interface ExportServiceAPI {
  /** Exporte l'élément en PNG */
  toPNG(element: HTMLElement, options: ExportOptions): Promise<Blob>;
  
  /** Copie dans le presse-papiers */
  toClipboard(blob: Blob): Promise<void>;
  
  /** Télécharge le fichier */
  download(blob: Blob, filename: string): void;
}

export interface ExportOptions {
  /** Largeur en pixels */
  width?: number;
  /** Hauteur en pixels */
  height?: number;
  /** Échelle (pour haute résolution) */
  scale?: number;
  /** Fond transparent */
  transparent?: boolean;
  /** Format: 'solo' (1200x800) ou 'social' (1080x1080) */
  mode: 'solo' | 'social';
}

export interface DataServiceAPI {
  /** Parse un fichier CSV */
  parseCSV(file: File): Promise<ParsedCSV>;
  
  /** Sauvegarde dans localStorage */
  persist(key: string, data: unknown): void;
  
  /** Charge depuis localStorage */
  load<T>(key: string): T | null;
  
  /** Efface les données */
  clear(): void;
}

export interface NormalizationServiceAPI {
  /** Normalise une valeur selon la config métrique */
  normalize(value: number, metric: MetricConfig, role?: LoLRole): number;
  
  /** Calcule le centile d'une valeur */
  calculatePercentile(
    value: number,
    metricId: string,
    pool: Player[]
  ): number;
  
  /** Détermine le grade S/A/B/C/D pour les stats */
  getGrade(percentile: number): Grade;
  
  /** Calcule les plages min/max pour toutes les métriques */
  calculateRanges(players: Player[]): Record<string, { min: number; max: number }>;
  
  /** Calcule les distributions de centiles pour toutes les métriques */
  calculateCentiles(players: Player[]): Record<string, number[]>;
}

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * Shape du state global
 */
export interface AppState {
  // ── Données ──────────────────────────────────────────────────────────────
  players: Player[];
  availableMetrics: string[];  // IDs des métriques
  selectedMetrics: string[];   // IDs sélectionnées
  
  // ── Configuration UI ─────────────────────────────────────────────────────
  currentModule: string | null;
  currentView: RadarViewMode;
  currentRole: LoLRole | 'all';
  currentTimeframe: Timeframe;
  
  // ── Sélections ───────────────────────────────────────────────────────────
  selectedPlayerId: string | null;
  comparedPlayerId: string | null;
  
  // ── Cache ────────────────────────────────────────────────────────────────
  metricRanges: Record<string, { min: number; max: number }>;
  centiles: Record<string, number[]>;  // par métrique + rôle
  
  // ── UI State ─────────────────────────────────────────────────────────────
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;
}

// =============================================================================
// DOMAIN MODELS
// =============================================================================

/**
 * Joueur professionnel LoL
 */
export interface Player {
  /** ID unique */
  id: string;
  
  /** Nom affiché */
  name: string;
  
  /** Équipe actuelle */
  team: string;
  
  /** Rôle principal */
  role: LoLRole;
  
  /** Région/Ligue */
  league?: string;
  
  /** Nombre de parties */
  gamesPlayed: number;
  
  /** Stats brutes (clé = metricId) */
  stats: Record<string, number>;
  
  /** Métadonnées */
  _source: 'csv' | 'api';
  _importedAt: number;
}

/**
 * Résultat du parsing CSV
 */
export interface ParsedCSV {
  players: Player[];
  columns: string[];
  metrics: string[];  // Colonnes identifiées comme métriques
  warnings: string[];
}

/**
 * Configuration du radar chart
 */
export interface RadarConfig {
  metrics: MetricConfig[];
  datasets: RadarDataset[];
  options: RadarOptions;
}

export interface RadarDataset {
  label: string;
  playerId: string;
  data: number[];  // Valeurs normalisées 0-100
  rawData: number[];  // Valeurs brutes
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  pointTiers?: string[]; // Tiers pour chaque point (S, A, B, C)
  borderDash?: number[]; // Pattern ligne pointillée (benchmark)
}

export interface RadarOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  animation: boolean | { duration: number };
  scales: {
    r: {
      min: number;
      max: number;
      ticks: { display: boolean };
    };
  };
}

// =============================================================================
// PLUGIN REGISTRY
// =============================================================================

/**
 * Interface du PluginRegistry (Core)
 */
export interface PluginRegistry {
  /** Enregistre un plugin (appelé par le Core au scan) */
  register(manifest: PluginManifest): void;
  
  /** Charge et monte un plugin dynamiquement */
  load(pluginId: string): Promise<Plugin>;
  
  /** Démonte un plugin */
  unload(pluginId: string): Promise<void>;
  
  /** Liste les plugins disponibles */
  list(): PluginManifest[];
  
  /** Plugin actuellement actif */
  getActive(): Plugin | null;
}

// =============================================================================
// EVENTS - Types pour EventBus
// =============================================================================

export interface CoreEvents {
  // Lifecycle
  'app:ready': void;
  'app:error': { message: string; code?: string };
  
  // Data
  'data:imported': { count: number; source: string };
  'data:cleared': void;
  
  // Module
  'module:mounted': { id: string };
  'module:unmounted': { id: string };
  
  // Player
  'player:selected': { playerId: string };
  'player:compared': { playerId: string };
  
  // View
  'view:changed': { view: RadarViewMode };
  'role:changed': { role: LoLRole | 'all' };
}

/** Type helper pour émettre des événements typés */
export type EmitEvent<T extends keyof CoreEvents> = (
  event: T,
  payload: CoreEvents[T]
) => void;

// =============================================================================
// EXPORTS
// =============================================================================

/** Version de l'API Core */
export const CORE_API_VERSION = '1.0.0';

/** 
 * STATS TIERS - 5 tiers pour les métriques individuelles
 * S: 90-100 (Elite - Cyan)
 * A: 80-90 (Excellent - Green)  
 * B: 65-80 (Good - Yellow)
 * C: 50-65 (Average - Orange)
 * D: <50 (Weak - Red)
 */
export const STATS_GRADE_THRESHOLDS = {
  S: 90,   // Elite: 100-90
  A: 80,   // Excellent: 90-80
  B: 65,   // Good: 80-65
  C: 50,   // Average: 65-50
  D: 0     // Weak: <50
} as const;

/** 
 * PLAYER TIERS - 4 tiers pour le score global
 * Elite: 75-100
 * Excellent: 60-75
 * Good: 50-60
 * Weak: <50
 */
export const PLAYER_GRADE_THRESHOLDS = {
  ELITE: 75,      // 75-100
  EXCELLENT: 60,  // 60-75
  GOOD: 50,       // 50-60
  WEAK: 0         // <50
} as const;

// Alias pour compatibilité
export const GRADE_THRESHOLDS = STATS_GRADE_THRESHOLDS;

/** Catégories avec couleurs associées */
export const CATEGORY_COLORS: Record<MetricCategory, string> = {
  combat: '#FF6B6B',   // Rouge
  vision: '#4ECDC4',   // Cyan
  farming: '#FFD93D',  // Or
  early: '#A855F7',    // Violet
  economy: '#00E676'   // Vert
};

export default {
  CORE_API_VERSION,
  GRADE_THRESHOLDS,
  CATEGORY_COLORS
};
