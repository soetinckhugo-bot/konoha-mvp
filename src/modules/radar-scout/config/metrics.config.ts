// metrics.config.ts - Configuration complète des métriques par rôle
// @ts-nocheck

// Toutes les métriques disponibles avec leurs propriétés
export interface MetricConfig {
  id: string;
  label: string;
  description: string;
  category: 'combat' | 'farming' | 'vision' | 'early' | 'economy' | 'general';
  inverted: boolean; // true = plus bas c'est mieux
  format: 'number' | 'percent' | 'time';
  decimals: number;
}

// Configuration complète des métriques basée sur CBLOL_Cup_2026_merged_clean.csv
export const ALL_METRICS: MetricConfig[] = [
  // General
  { id: 'GP', label: 'GP', description: 'Games Played', category: 'general', inverted: false, format: 'number', decimals: 0 },
  { id: 'W%', label: 'W%', description: 'Win Rate', category: 'general', inverted: false, format: 'percent', decimals: 1 },
  
  // Combat
  { id: 'K', label: 'K', description: 'Kills', category: 'combat', inverted: false, format: 'number', decimals: 1 },
  { id: 'D', label: 'D', description: 'Deaths', category: 'combat', inverted: true, format: 'number', decimals: 1 },
  { id: 'A', label: 'A', description: 'Assists', category: 'combat', inverted: false, format: 'number', decimals: 1 },
  { id: 'KDA', label: 'KDA', description: 'Kill/Death/Assist Ratio', category: 'combat', inverted: false, format: 'number', decimals: 1 },
  { id: 'KP', label: 'KP', description: 'Kill Participation', category: 'combat', inverted: false, format: 'percent', decimals: 1 },
  { id: 'KS%', label: 'KS%', description: 'Kill Share', category: 'combat', inverted: false, format: 'percent', decimals: 1 },
  { id: 'DTH%', label: 'DTH%', description: 'Death Share', category: 'combat', inverted: true, format: 'percent', decimals: 1 },
  { id: 'FB%', label: 'FB%', description: 'First Blood Rate', category: 'combat', inverted: false, format: 'percent', decimals: 1 },
  { id: 'FB Victim', label: 'FB Victim', description: 'First Blood Victim', category: 'combat', inverted: true, format: 'number', decimals: 1 },
  { id: 'Penta Kills', label: 'Penta', description: 'Penta Kills', category: 'combat', inverted: false, format: 'number', decimals: 0 },
  { id: 'Solo Kills', label: 'Solo', description: 'Solo Kills', category: 'combat', inverted: false, format: 'number', decimals: 1 },
  { id: 'CTR%', label: 'CTR%', description: 'Counter Pick Rate', category: 'combat', inverted: true, format: 'percent', decimals: 1 },
  
  // Damage
  { id: 'DPM', label: 'DPM', description: 'Damage Per Minute', category: 'combat', inverted: false, format: 'number', decimals: 0 },
  { id: 'DMG%', label: 'DMG%', description: 'Damage Share', category: 'combat', inverted: false, format: 'percent', decimals: 1 },
  { id: 'D%P15', label: 'D%P15', description: 'Damage Share @15', category: 'combat', inverted: false, format: 'percent', decimals: 1 },
  { id: 'TDPG', label: 'TDPG', description: 'Team Damage Per Gold', category: 'combat', inverted: false, format: 'number', decimals: 0 },
  
  // Farming
  { id: 'CSPM', label: 'CSPM', description: 'CS Per Minute', category: 'farming', inverted: false, format: 'number', decimals: 1 },
  { id: 'CS%P15', label: 'CS%P15', description: 'CS Share @15', category: 'farming', inverted: false, format: 'percent', decimals: 1 },
  
  // Early Game
  { id: 'GD10', label: 'GD10', description: 'Gold Diff @10', category: 'early', inverted: false, format: 'number', decimals: 0 },
  { id: 'XPD10', label: 'XPD10', description: 'XP Diff @10', category: 'early', inverted: false, format: 'number', decimals: 0 },
  { id: 'CSD10', label: 'CSD10', description: 'CS Diff @10', category: 'early', inverted: false, format: 'number', decimals: 1 },
  { id: 'GD@15', label: 'GD@15', description: 'Gold Diff @15', category: 'early', inverted: false, format: 'number', decimals: 0 },
  { id: 'CSD@15', label: 'CSD@15', description: 'CS Diff @15', category: 'early', inverted: false, format: 'number', decimals: 1 },
  { id: 'XPD@15', label: 'XPD@15', description: 'XP Diff @15', category: 'early', inverted: false, format: 'number', decimals: 0 },
  { id: 'XPD@10', label: 'XPD@10', description: 'XP Diff @10', category: 'early', inverted: false, format: 'number', decimals: 0 },
  
  // Economy
  { id: 'EGPM', label: 'EGPM', description: 'Earned Gold Per Minute', category: 'economy', inverted: false, format: 'number', decimals: 0 },
  { id: 'GOLD%', label: 'GOLD%', description: 'Gold Share', category: 'economy', inverted: true, format: 'percent', decimals: 1 },
  { id: 'Gold%', label: 'Gold%', description: 'Gold Share', category: 'economy', inverted: true, format: 'percent', decimals: 1 },
  { id: 'STL', label: 'STL', description: 'Steals', category: 'economy', inverted: false, format: 'number', decimals: 0 },
  
  // Vision
  { id: 'WPM', label: 'WPM', description: 'Wards Per Minute', category: 'vision', inverted: false, format: 'number', decimals: 2 },
  { id: 'CWPM', label: 'CWPM', description: 'Control Wards Per Minute', category: 'vision', inverted: false, format: 'number', decimals: 2 },
  { id: 'WCPM', label: 'WCPM', description: 'Wards Cleared Per Minute', category: 'vision', inverted: false, format: 'number', decimals: 2 },
  { id: 'VWPM', label: 'VWPM', description: 'Vision Wards Per Minute', category: 'vision', inverted: false, format: 'number', decimals: 2 },
  { id: 'VS%', label: 'VS%', description: 'Vision Score Share', category: 'vision', inverted: false, format: 'percent', decimals: 1 },
  { id: 'VSPM', label: 'VSPM', description: 'Vision Score Per Minute', category: 'vision', inverted: false, format: 'number', decimals: 2 },
  { id: 'VS', label: 'VS', description: 'Vision Score', category: 'vision', inverted: false, format: 'number', decimals: 1 },
];

// Métriques par rôle - EXACTEMENT comme les screenshots
export const ROLE_METRICS: Record<string, string[]> = {
  // ALL: toutes les métriques sauf doublons
  ALL: ['GP', 'W%', 'CTR%', 'K', 'D', 'A', 'KDA', 'KP', 'KS%', 'DTH%', 'FB%', 'GD10', 'XPD10', 'CSD10', 'CSPM', 'CS%P15', 'DPM', 'DMG%', 'D%P15', 'TDPG', 'EGPM', 'GOLD%', 'STL', 'WPM', 'CWPM', 'WCPM', 'VS%', 'VSPM', 'GD@15', 'CSD@15', 'XPD@15', 'FB Victim', 'Penta Kills', 'Solo Kills'],
  
  // TOP: W%, KP, CTR%, DTH%, CSPM, DMG%, GPM, GOLD%, FB Victim, Solo Kills, XPD@15, CSD@15, GD@15
  TOP: ['W%', 'KP', 'CTR%', 'DTH%', 'CSPM', 'DMG%', 'DPM', 'GOLD%', 'FB Victim', 'Solo Kills', 'XPD@15', 'CSD@15', 'GD@15', 'KDA'],
  
  // JUNGLE: W%, KDA, KP, DTH%, FB%, D%P15, GPM, GOLD%, VSPM, VS%, GD@15, CSD@15, XPD@15, FB Victim
  JUNGLE: ['W%', 'KDA', 'KP', 'DTH%', 'FB%', 'D%P15', 'EGPM', 'GOLD%', 'VSPM', 'VS%', 'GD@15', 'CSD@15', 'XPD@15', 'FB Victim'],
  
  // MID: W%, KDA, KP, KS%, DTH%, FB%, CSPM, DMG%, GPM, GD@15, CSD@15, XPD@15, FB Victim, Solo Kills
  MID: ['W%', 'KDA', 'KP', 'KS%', 'DTH%', 'FB%', 'CSPM', 'DMG%', 'DPM', 'GD@15', 'CSD@15', 'XPD@15', 'FB Victim', 'Solo Kills'],
  
  // ADC: W%, KDA, KP, KS%, DTH%, CSPM, CS%P15, DPM, DMG%, D%P15, GPM, GOLD%, GD@15, CSD@15, XPD@15, FB Victim
  ADC: ['W%', 'KDA', 'KP', 'KS%', 'DTH%', 'CSPM', 'CS%P15', 'DPM', 'DMG%', 'D%P15', 'EGPM', 'GOLD%', 'GD@15', 'CSD@15', 'XPD@15', 'FB Victim'],
  
  // SUPPORT: W%, CTR%, D, A, KP, DTH%, FB%, WPM, CWPM, WCPM, VS%, VSPM, VWPM, XPD@15, XPD@10, FB Victim
  SUPPORT: ['W%', 'CTR%', 'D', 'A', 'KP', 'DTH%', 'FB%', 'WPM', 'CWPM', 'WCPM', 'VS%', 'VSPM', 'GD@15', 'CSD@15', 'FB Victim']
};

// Helper: récupérer les métriques pour un rôle
export function getMetricsForRole(role: string): MetricConfig[] {
  const metricIds = ROLE_METRICS[role] || ROLE_METRICS.ALL;
  return metricIds
    .map(id => ALL_METRICS.find(m => m.id === id))
    .filter(Boolean) as MetricConfig[];
}

// Helper: formater une valeur selon sa métrique
export function formatMetricValue(value: number, metricId: string): string {
  const config = ALL_METRICS.find(m => m.id === metricId);
  if (!config) return value?.toFixed(1) || '0';
  
  if (value === undefined || value === null) return '-';
  
  let formatted = value.toFixed(config.decimals);
  
  if (config.format === 'percent') {
    formatted += '%';
  }
  
  return formatted;
}

// Helper: normaliser une valeur (0-100)
export function normalizeMetric(value: number, metricId: string): number {
  const config = ALL_METRICS.find(m => m.id === metricId);
  if (!config || value === undefined || value === null) return 50;
  
  // Plages approximatives pour chaque type de métrique
  const ranges: Record<string, [number, number]> = {
    'KDA': [0, 8],
    'KP': [30, 80],
    'KS%': [10, 40],
    'DTH%': [15, 35],
    'FB%': [10, 60],
    'CSPM': [4, 10],
    'DPM': [300, 800],
    'DMG%': [15, 35],
    'GD@15': [-500, 1500],
    'CSD@15': [-10, 20],
    'XPD@15': [-500, 1000],
    'WPM': [0.5, 2.5],
    'VSPM': [1, 4],
    'W%': [30, 70],
    'CTR%': [30, 80],
    'GOLD%': [15, 25],
  };
  
  const [min, max] = ranges[metricId] || [0, 100];
  let normalized = ((value - min) / (max - min)) * 100;
  normalized = Math.max(0, Math.min(100, normalized));
  
  // Inverser si nécessaire
  if (config.inverted) {
    normalized = 100 - normalized;
  }
  
  return normalized;
}
