// metrics.config.ts - Configuration complète des métriques par rôle
// @ts-nocheck

// Toutes les métriques disponibles avec leurs propriétés
export interface MetricConfig {
  id: string;
  label: string;
  description: string;
  category: 'combat' | 'farming' | 'vision' | 'early' | 'economy';
  inverted: boolean; // true = plus bas c'est mieux (ex: deaths)
  format: 'number' | 'percent' | 'time';
  decimals: number;
}

// Configuration complète des métriques
export const ALL_METRICS: MetricConfig[] = [
  // Combat
  { id: 'kda', label: 'KDA', description: 'Ratio Kills + Assists / Deaths', category: 'combat', inverted: false, format: 'number', decimals: 2 },
  { id: 'kp', label: 'KP%', description: 'Kill Participation', category: 'combat', inverted: false, format: 'percent', decimals: 1 },
  { id: 'ks', label: 'KS%', description: 'Kill Share', category: 'combat', inverted: false, format: 'percent', decimals: 1 },
  { id: 'dth', label: 'DTH%', description: 'Death Share', category: 'combat', inverted: true, format: 'percent', decimals: 1 },
  { id: 'fb', label: 'FB%', description: 'First Blood Rate', category: 'combat', inverted: false, format: 'percent', decimals: 1 },
  { id: 'dpm', label: 'DPM', description: 'Damage Per Minute', category: 'combat', inverted: false, format: 'number', decimals: 0 },
  { id: 'dmg', label: 'DMG%', description: 'Damage Share', category: 'combat', inverted: false, format: 'percent', decimals: 1 },
  { id: 'dt', label: 'DT%', description: 'Damage Taken %', category: 'combat', inverted: true, format: 'percent', decimals: 1 },
  { id: 'soloKills', label: 'Solo', description: 'Solo Kills', category: 'combat', inverted: false, format: 'number', decimals: 1 },
  
  // Farming
  { id: 'cspm', label: 'CSPM', description: 'CS Per Minute', category: 'farming', inverted: false, format: 'number', decimals: 1 },
  { id: 'cs', label: 'CS%', description: 'CS Share @15', category: 'farming', inverted: false, format: 'percent', decimals: 1 },
  
  // Vision
  { id: 'visionScore', label: 'VS', description: 'Vision Score', category: 'vision', inverted: false, format: 'number', decimals: 1 },
  { id: 'vspm', label: 'VSPM', description: 'Vision Score Per Minute', category: 'vision', inverted: false, format: 'number', decimals: 2 },
  { id: 'wpm', label: 'WPM', description: 'Wards Per Minute', category: 'vision', inverted: false, format: 'number', decimals: 2 },
  { id: 'wcpm', label: 'WCPM', description: 'Wards Cleared Per Minute', category: 'vision', inverted: false, format: 'number', decimals: 2 },
  
  // Early Game
  { id: 'gd15', label: 'GD@15', description: 'Gold Difference @15', category: 'early', inverted: false, format: 'number', decimals: 0 },
  { id: 'csd15', label: 'CSD@15', description: 'CS Difference @15', category: 'early', inverted: false, format: 'number', decimals: 1 },
  { id: 'xpd15', label: 'XPD@15', description: 'XP Difference @15', category: 'early', inverted: false, format: 'number', decimals: 0 },
  { id: 'dp15', label: 'D%P15', description: 'Damage Share @15', category: 'early', inverted: false, format: 'percent', decimals: 1 },
  
  // Economy
  { id: 'gpm', label: 'GPM', description: 'Gold Per Minute', category: 'economy', inverted: false, format: 'number', decimals: 0 },
  { id: 'gold', label: 'GOLD%', description: 'Gold Share', category: 'economy', inverted: false, format: 'percent', decimals: 1 },
];

// Métriques par rôle - sélection des plus pertinentes
export const ROLE_METRICS: Record<string, string[]> = {
  TOP: ['kda', 'kp', 'cspm', 'csd15', 'gd15', 'xpd15', 'dpm', 'dt', 'soloKills', 'visionScore'],
  JUNGLE: ['kda', 'kp', 'fb', 'gd15', 'xpd15', 'cspm', 'dpm', 'visionScore', 'wpm', 'wcpm'],
  MID: ['kda', 'kp', 'ks', 'cspm', 'csd15', 'gd15', 'dpm', 'soloKills', 'visionScore', 'dmg'],
  ADC: ['kda', 'kp', 'cspm', 'dpm', 'dmg', 'gd15', 'csd15', 'dp15', 'visionScore', 'gpm'],
  SUPPORT: ['kda', 'kp', 'visionScore', 'vspm', 'wpm', 'wcpm', 'gd15', 'dth', 'fb', 'cs']
};

// Coefficients de pondération par rôle pour le scoring global
export const ROLE_WEIGHTS: Record<string, Record<string, number>> = {
  TOP: {
    kda: 1.2, kp: 0.8, cspm: 1.4, csd15: 1.5, gd15: 1.4,
    xpd15: 1.2, dpm: 0.9, dt: 0.7, soloKills: 1.3, visionScore: 0.6,
    wpm: 0.5, wcpm: 0.5, dmg: 0.8, gold: 1.0
  },
  JUNGLE: {
    kda: 1.2, kp: 1.5, fb: 1.4, gd15: 1.3, xpd15: 1.2,
    cspm: 0.7, dpm: 0.8, visionScore: 1.4, wpm: 1.5, wcpm: 1.3,
    ks: 0.9, dth: 1.0, soloKills: 0.8
  },
  MID: {
    kda: 1.3, kp: 1.0, ks: 1.2, cspm: 1.3, csd15: 1.4,
    gd15: 1.3, dpm: 1.5, soloKills: 1.4, visionScore: 0.7,
    dmg: 1.4, xpd15: 1.2, fb: 0.9
  },
  ADC: {
    kda: 1.0, kp: 0.9, cspm: 1.5, dpm: 1.5, dmg: 1.5,
    gd15: 1.2, csd15: 1.3, dp15: 1.4, visionScore: 0.5,
    gpm: 1.3, gold: 1.4, ks: 1.2
  },
  SUPPORT: {
    kda: 1.1, kp: 1.5, visionScore: 1.5, vspm: 1.5, wpm: 1.5,
    wcpm: 1.4, gd15: 0.9, dth: 1.2, fb: 1.1, cs: 0.4,
    cspm: 0.3, dpm: 0.4
  }
};

// Plages de normalisation pour chaque métrique (min, max)
export const METRIC_RANGES: Record<string, [number, number]> = {
  kda: [0, 8],
  kp: [30, 90],
  ks: [10, 40],
  dth: [15, 35],
  fb: [10, 50],
  dpm: [300, 800],
  dmg: [15, 35],
  dt: [15, 30],
  soloKills: [0, 8],
  cspm: [4, 10],
  cs: [15, 25],
  visionScore: [20, 100],
  vspm: [1, 3],
  wpm: [0.5, 2.5],
  wcpm: [0.3, 1.5],
  gd15: [-500, 1500],
  csd15: [-10, 20],
  xpd15: [-500, 1000],
  dp15: [10, 30],
  gpm: [300, 500],
  gold: [18, 24]
};

// Helper: récupérer les métriques pour un rôle
export function getMetricsForRole(role: string): MetricConfig[] {
  const metricIds = ROLE_METRICS[role] || ROLE_METRICS.TOP;
  return metricIds.map(id => ALL_METRICS.find(m => m.id === id)!).filter(Boolean);
}

// Helper: récupérer les poids pour un rôle
export function getWeightsForRole(role: string): Record<string, number> {
  return ROLE_WEIGHTS[role] || ROLE_WEIGHTS.TOP;
}

// Helper: normaliser une valeur
export function normalizeMetric(value: number, metricId: string): number {
  const [min, max] = METRIC_RANGES[metricId] || [0, 100];
  const config = ALL_METRICS.find(m => m.id === metricId);
  
  let normalized = ((value - min) / (max - min)) * 100;
  normalized = Math.max(0, Math.min(100, normalized));
  
  // Inverser si nécessaire (ex: DTH% - plus bas c'est mieux)
  if (config?.inverted) {
    normalized = 100 - normalized;
  }
  
  return normalized;
}

// Helper: formater une valeur selon sa métrique
export function formatMetricValue(value: number, metricId: string): string {
  const config = ALL_METRICS.find(m => m.id === metricId);
  if (!config) return value.toFixed(1);
  
  let formatted = value.toFixed(config.decimals);
  
  if (config.format === 'percent') {
    formatted += '%';
  }
  
  return formatted;
}
