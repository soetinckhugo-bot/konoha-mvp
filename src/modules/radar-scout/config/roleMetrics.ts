/**
 * Role Metrics Configuration - V4 Design
 * Définit les métriques par rôle avec couleurs et direction
 */

import type { MetricConfig, MetricCategory, MetricDirection } from '../../../core/types';

// Couleurs par rôle (thème V4)
export const ROLE_COLORS = {
  TOP: '#FF5757',      // Rouge
  JUNGLE: '#4ADE80',   // Vert  
  MID: '#60A5FA',      // Bleu
  ADC: '#FACC15',      // Jaune
  SUPPORT: '#C084FC'   // Violet
};

export const ROLE_THEMES = {
  TOP: { primary: '#FF5757', bg: 'rgba(255, 87, 87, 0.15)', glow: '0 0 20px rgba(255, 87, 87, 0.3)' },
  JUNGLE: { primary: '#4ADE80', bg: 'rgba(74, 222, 128, 0.15)', glow: '0 0 20px rgba(74, 222, 128, 0.3)' },
  MID: { primary: '#60A5FA', bg: 'rgba(96, 165, 250, 0.15)', glow: '0 0 20px rgba(96, 165, 250, 0.3)' },
  ADC: { primary: '#FACC15', bg: 'rgba(250, 204, 21, 0.15)', glow: '0 0 20px rgba(250, 204, 21, 0.3)' },
  SUPPORT: { primary: '#C084FC', bg: 'rgba(192, 132, 252, 0.15)', glow: '0 0 20px rgba(192, 132, 252, 0.3)' }
};

// Interface pour la config d'une métrique de rôle
export interface RoleMetricDef {
  id: string;
  name: string;
  category: MetricCategory;
  direction: MetricDirection;
  inverted: boolean; // true = rouge (plus bas = mieux)
  format: 'decimal' | 'percentage' | 'integer';
  decimals?: number;
}

// Mapping des métriques vers les noms complets pour l'affichage
export const METRIC_DISPLAY_NAMES: Record<string, string> = {
  // Combat/Fight
  'win_rate': 'Win Rate',
  'kda': 'Kill/Death/Assist Ratio',
  'kp_percent': 'Kill Participation',
  'ks_percent': 'Kill Share',
  'death_share': 'Death Share',
  'fb_percent': 'First Blood Rate',
  'fb_victim': 'First Blood Victim',
  'solo_kills': 'Solo Kills',
  'penta_kills': 'Penta Kills',
  'steals': 'Steals',
  'dmg_percent': 'Damage Share',
  'dpm': 'Damage Per Minute',
  'dmg_percent_at_15': 'Damage % @15',
  'kills': 'Kills',
  'deaths': 'Deaths',
  'assists': 'Assists',
  'counter_pick_rate': 'Counter Pick Rate',
  'games_played': 'Games Played',
  // Farming/Resources
  'cspm': 'CS Per Minute',
  'cs_share_at_15': 'CS Share @15',
  'csd_at_10': 'CS Difference @10',
  'csd_at_15': 'CS Difference @15',
  // Vision
  'vspm': 'Vision Score Per Minute',
  'wpm': 'Wards Per Minute',
  'cwpm': 'Control Wards Per Minute',
  'wcpm': 'Wards Cleared Per Minute',
  'vision_share': 'Vision Score Share',
  'vwpm': 'Vision Wards Per Minute',
  // Early/Resources
  'gd_at_10': 'Gold Difference @10',
  'gd_at_15': 'Gold Difference @15',
  'xpd_at_10': 'XP Difference @10',
  'xpd_at_15': 'XP Difference @15',
  // Economy/Resources
  'gpm': 'Gold Per Minute',
  'egpm': 'Earned Gold Per Minute',
  'gold_share': 'Gold Share'
};

// Catégorisation pour le Percentile Analysis (3 colonnes)
export const PERCENTILE_CATEGORIES = {
  fight: ['win_rate', 'kda', 'kp_percent', 'ks_percent', 'death_share', 'fb_percent', 'fb_victim', 'solo_kills', 'penta_kills', 'steals', 'dmg_percent', 'dpm', 'dmg_percent_at_15', 'kills', 'deaths', 'assists', 'counter_pick_rate', 'games_played'],
  vision: ['vspm', 'wpm', 'cwpm', 'wcpm', 'vision_share', 'vwpm'],
  resources: ['cspm', 'cs_share_at_15', 'csd_at_10', 'csd_at_15', 'gd_at_10', 'gd_at_15', 'xpd_at_10', 'xpd_at_15', 'gpm', 'egpm', 'gold_share']
};

// Toutes les métriques uniques pour le mode ALL
export const ALL_METRICS: RoleMetricDef[] = [
  // Combat
  { id: 'win_rate', name: 'W%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
  { id: 'kda', name: 'KDA', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  { id: 'kp_percent', name: 'KP', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
  { id: 'ks_percent', name: 'KS%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
  { id: 'death_share', name: 'DTH%', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'percentage' },
  { id: 'fb_percent', name: 'FB%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
  { id: 'solo_kills', name: 'Solo Kills', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'integer' },
  { id: 'steals', name: 'STL', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'integer' },
  { id: 'dmg_percent', name: 'DMG%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
  { id: 'dpm', name: 'DPM', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  { id: 'dmg_percent_at_15', name: 'D%P15', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
  { id: 'kills', name: 'K', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'integer' },
  { id: 'deaths', name: 'D', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'integer' },
  { id: 'assists', name: 'A', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'integer' },
  { id: 'fb_victim', name: 'FB Victim', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'integer' },
  { id: 'penta_kills', name: 'Penta Kills', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'integer' },
  // Farming
  { id: 'cspm', name: 'CSPM', category: 'farming', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  { id: 'cs_share_at_15', name: 'CS%P15', category: 'farming', direction: 'higher-is-better', inverted: false, format: 'percentage' },
  { id: 'csd_at_10', name: 'CSD@10', category: 'farming', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  { id: 'csd_at_15', name: 'CSD@15', category: 'farming', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  // Vision
  { id: 'vspm', name: 'VSPM', category: 'vision', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  { id: 'wpm', name: 'WPM', category: 'vision', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  { id: 'cwpm', name: 'CWPM', category: 'vision', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  { id: 'wcpm', name: 'WCPM', category: 'vision', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  { id: 'vision_share', name: 'VS%', category: 'vision', direction: 'higher-is-better', inverted: false, format: 'percentage' },
  { id: 'vwpm', name: 'VWPM', category: 'vision', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  // Early
  { id: 'gd_at_10', name: 'GD@10', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  { id: 'gd_at_15', name: 'GD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  { id: 'xpd_at_10', name: 'XPD@10', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  { id: 'xpd_at_15', name: 'XPD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  // Economy
  { id: 'gpm', name: 'GPM', category: 'economy', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  { id: 'egpm', name: 'EGPM', category: 'economy', direction: 'higher-is-better', inverted: false, format: 'decimal' },
  { id: 'gold_share', name: 'GOLD%', category: 'economy', direction: 'higher-is-better', inverted: false, format: 'percentage' },
  // General
  { id: 'counter_pick_rate', name: 'CTR%', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'percentage' },
  { id: 'games_played', name: 'GP', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'integer' }
];

// Métriques par rôle - EXACTEMENT comme vos screens
export const ROLE_METRICS: Record<string, RoleMetricDef[]> = {
  TOP: [
    { id: 'win_rate', name: 'W%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'kp_percent', name: 'KP', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'counter_pick_rate', name: 'CTR%', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'percentage' },
    { id: 'death_share', name: 'DTH%', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'percentage' },
    { id: 'cspm', name: 'CSPM', category: 'farming', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'dmg_percent', name: 'DMG%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'gpm', name: 'GPM', category: 'economy', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'gold_share', name: 'GOLD%', category: 'economy', direction: 'lower-is-better', inverted: true, format: 'percentage' },
    { id: 'fb_victim', name: 'FB Victim', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'integer' },
    { id: 'solo_kills', name: 'Solo Kills', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'integer' },
    { id: 'xpd_at_15', name: 'XPD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'csd_at_15', name: 'CSD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'gd_at_15', name: 'GD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' }
  ],
  
  JUNGLE: [
    { id: 'win_rate', name: 'W%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'kda', name: 'KDA', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'kp_percent', name: 'KP', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'death_share', name: 'DTH%', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'percentage' },
    { id: 'fb_percent', name: 'FB%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'dmg_percent_at_15', name: 'D%P15', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'gpm', name: 'GPM', category: 'economy', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'gold_share', name: 'GOLD%', category: 'economy', direction: 'lower-is-better', inverted: true, format: 'percentage' },
    { id: 'vspm', name: 'VSPM', category: 'vision', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'vision_share', name: 'VS%', category: 'vision', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'gd_at_15', name: 'GD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'csd_at_15', name: 'CSD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'xpd_at_15', name: 'XPD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'fb_victim', name: 'FB Victim', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'integer' }
  ],
  
  MID: [
    { id: 'win_rate', name: 'W%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'kda', name: 'KDA', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'kp_percent', name: 'KP', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'ks_percent', name: 'KS%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'death_share', name: 'DTH%', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'percentage' },
    { id: 'fb_percent', name: 'FB%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'cspm', name: 'CSPM', category: 'farming', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'dmg_percent', name: 'DMG%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'gpm', name: 'GPM', category: 'economy', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'gd_at_15', name: 'GD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'csd_at_15', name: 'CSD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'xpd_at_15', name: 'XPD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'fb_victim', name: 'FB Victim', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'integer' },
    { id: 'solo_kills', name: 'Solo Kills', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'integer' }
  ],
  
  ADC: [
    { id: 'win_rate', name: 'W%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'kda', name: 'KDA', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'kp_percent', name: 'KP', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'ks_percent', name: 'KS%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'death_share', name: 'DTH%', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'percentage' },
    { id: 'cspm', name: 'CSPM', category: 'farming', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'cs_share_at_15', name: 'CS%P15', category: 'farming', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'dpm', name: 'DPM', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'dmg_percent', name: 'DMG%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'dmg_percent_at_15', name: 'D%P15', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'gpm', name: 'GPM', category: 'economy', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'gold_share', name: 'GOLD%', category: 'economy', direction: 'lower-is-better', inverted: true, format: 'percentage' },
    { id: 'gd_at_15', name: 'GD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'csd_at_15', name: 'CSD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'xpd_at_15', name: 'XPD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'fb_victim', name: 'FB Victim', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'integer' }
  ],
  
  SUPPORT: [
    { id: 'win_rate', name: 'W%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'counter_pick_rate', name: 'CTR%', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'percentage' },
    { id: 'deaths', name: 'D', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'integer' },
    { id: 'assists', name: 'A', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'integer' },
    { id: 'kp_percent', name: 'KP', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'death_share', name: 'DTH%', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'percentage' },
    { id: 'fb_percent', name: 'FB%', category: 'combat', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'wpm', name: 'WPM', category: 'vision', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'cwpm', name: 'CWPM', category: 'vision', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'wcpm', name: 'WCPM', category: 'vision', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'vision_share', name: 'VS%', category: 'vision', direction: 'higher-is-better', inverted: false, format: 'percentage' },
    { id: 'vspm', name: 'VSPM', category: 'vision', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'vwpm', name: 'VWPM', category: 'vision', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'xpd_at_15', name: 'XPD@15', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'xpd_at_10', name: 'XPD@10', category: 'early', direction: 'higher-is-better', inverted: false, format: 'decimal' },
    { id: 'fb_victim', name: 'FB Victim', category: 'combat', direction: 'lower-is-better', inverted: true, format: 'integer' }
  ]
};

// Helper pour récupérer les métriques d'un rôle
// Mode 'ALL' = toutes les métriques uniques de tous les rôles
export function getMetricsForRole(role: string): RoleMetricDef[] {
  if (role === 'ALL') {
    return ALL_METRICS;
  }
  return ROLE_METRICS[role] || ROLE_METRICS['MID'];
}

// Helper pour convertir en MetricConfig
export function toMetricConfig(def: RoleMetricDef): MetricConfig {
  return {
    id: def.id,
    name: def.name,
    category: def.category,
    type: def.format === 'percentage' ? 'percentage' : def.format === 'integer' ? 'number' : 'ratio',
    direction: def.direction,
    normalize: { min: 0, max: 100 },
    format: def.format,
    decimals: def.decimals || (def.format === 'integer' ? 0 : def.format === 'percentage' ? 1 : 2),
    icon: getIconForMetric(def.id)
  };
}

function getIconForMetric(id: string): string {
  const icons: Record<string, string> = {
    'win_rate': '🏆',
    'kda': '⚔️',
    'kp_percent': '🤝',
    'ks_percent': '🎯',
    'death_share': '💀',
    'dmg_percent': '💥',
    'dpm': '🔥',
    'cspm': '🌾',
    'gpm': '💰',
    'gold_share': '🥇',
    'fb_percent': '🔴',
    'fb_victim': '🩸',
    'solo_kills': '🥷',
    'penta_kills': '🏆',
    'csd_at_15': '⏱️',
    'gd_at_15': '💵',
    'xpd_at_15': '📈',
    'vspm': '👁️',
    'wpm': '🚩',
    'cwpm': '🎌',
    'wcpm': '🧹',
    'vision_share': '🔮'
  };
  return icons[id] || '📊';
}

/**
 * Coefficients de pondération V4 pour le calcul du score leaderboard
 * Basé sur web-v4/app.js - roleWeights
 * 
 * Règles:
 * - 0 = Exclu du calcul (ex: win_rate reflète l'équipe)
 * - 0.5 = Peu important
 * - 1 = Standard
 * - 1.5 = Important
 * - 2 = Très important
 */
export const ROLE_WEIGHTS_V4: Record<string, Record<string, number>> = {
  TOP: {
    win_rate: 0,           // W% = 0 (toujours exclu)
    kp_percent: 1,         // KP = 1
    counter_pick_rate: 1,  // CTR% = 1
    death_share: 1,        // DTH% = 1
    cspm: 1.5,             // CSPM = 1.5
    dmg_percent: 1,        // DMG% = 1
    egpm: 1,               // GPM (EGPM) = 1
    gold_share: 1.5,       // GOLD% = 1.5
    fb_victim: 1,          // FB Victim = 1
    solo_kills: 1.5,       // SoloKills = 1.5
    penta_kills: 1,        // PentaKills = 1
    xpd_at_15: 1.5,        // XPD@15 = 1.5
    csd_at_15: 1.5,        // CSD@15 = 1.5
    gd_at_15: 1            // GD@15 = 1
  },
  
  JUNGLE: {
    win_rate: 0,           // W% = 0
    kda: 1,                // KDA = 1
    kp_percent: 1.5,       // KP = 1.5
    death_share: 1,        // DTH% = 1
    fb_percent: 1.5,       // FB% = 1.5
    dmg_percent_at_15: 1,  // D%P15 = 1
    egpm: 1,               // EGPM = 1
    gold_share: 1,         // GOLD% = 1
    vspm: 1.5,             // VSPM = 1.5
    vision_share: 1,       // VS% = 1
    gd_at_15: 1.5,         // GD@15 = 1.5
    csd_at_15: 1,          // CSD@15 = 1
    xpd_at_15: 1,          // XPD@15 = 1 (PAS inversé!)
    fb_victim: 1,          // FB Victim = 1
    penta_kills: 1         // PentaKills = 1
  },
  
  MID: {
    win_rate: 0,           // W% = 0
    kda: 1,                // KDA = 1
    kp_percent: 1,         // KP = 1
    ks_percent: 1.5,       // KS% = 1.5
    death_share: 1.5,      // DTH% = 1.5
    fb_percent: 1,         // FB% = 1
    cspm: 1.5,             // CSPM = 1.5
    dmg_percent: 1.5,      // DMG% = 1.5
    egpm: 1,               // EGPM = 1
    gd_at_15: 1.5,         // GD@15 = 1.5
    csd_at_15: 1,          // CSD@15 = 1
    xpd_at_15: 1.5,        // XPD@15 = 1.5
    fb_victim: 1.5,        // FB Victim = 1.5
    solo_kills: 1.5,       // SoloKills = 1.5
    penta_kills: 1         // PentaKills = 1
  },
  
  ADC: {
    win_rate: 0,           // W% = 0
    kda: 1.5,              // KDA = 1.5
    kp_percent: 1,         // KP = 1
    ks_percent: 1.5,       // KS% = 1.5
    death_share: 1.5,      // DTH% = 1.5
    cspm: 1.5,             // CSPM = 1.5
    cs_share_at_15: 1,     // CS%P15 = 1
    dpm: 1.5,              // DPM = 1.5
    dmg_percent: 1,        // DMG% = 1
    dmg_percent_at_15: 1,  // D%P15 = 1
    egpm: 1.5,             // EGPM = 1.5
    gold_share: 1,         // GOLD% = 1
    gd_at_15: 1,           // GD@15 = 1
    csd_at_15: 1.5,        // CSD@15 = 1.5
    xpd_at_15: 1,          // XPD@15 = 1
    fb_victim: 1           // FB Victim = 1
  },
  
  SUPPORT: {
    win_rate: 0,           // W% = 0
    counter_pick_rate: 1,  // CTR% = 1
    deaths: 1.5,           // D = 1.5
    assists: 1.5,          // A = 1.5
    kp_percent: 1.5,       // KP = 1.5
    death_share: 1,        // DTH% = 1
    fb_percent: 1.5,       // FB% = 1.5
    wpm: 0.5,              // WPM = 0.5
    cwpm: 0.5,             // CWPM = 0.5
    wcpm: 0.5,             // WCPM = 0.5
    vision_share: 0.5,     // VS% = 0.5
    vspm: 0.5,             // VSPM = 0.5
    vwpm: 0.5,             // VWPM = 0.5
    xpd_at_15: 1,          // XPD@15 = 1
    xpd_at_10: 1,          // XPD@10 = 1
    fb_victim: 1,          // FB Victim = 1
    penta_kills: 1         // PentaKills = 1
  }
};

/**
 * Helper pour récupérer le poids d'une métrique pour un rôle
 * @param role - Rôle du joueur
 * @param metricId - ID de la métrique
 * @returns Poids (défaut: 1)
 */
export function getRoleWeight(role: string, metricId: string): number {
  const weights = ROLE_WEIGHTS_V4[role];
  if (!weights) return 1;
  return weights[metricId] ?? 1;
}
