/**
 * RadarScout - Default Metrics Configuration
 * Story 3.1
 */

import type { MetricConfig } from '../../../core/types';

export const defaultMetrics: MetricConfig[] = [
  {
    id: 'kda',
    name: 'KDA',
    category: 'combat',
    type: 'ratio',
    direction: 'higher-is-better',
    normalize: { min: 0, max: 10, roleSpecific: true },
    format: 'decimal',
    decimals: 2,
    description: 'Ratio Kills/Deaths/Assists',
    icon: '⚔️'
  },
  {
    id: 'kp_percent',
    name: 'KP%',
    category: 'combat',
    type: 'percentage',
    direction: 'higher-is-better',
    normalize: { min: 0, max: 100 },
    format: 'percentage',
    decimals: 1,
    description: 'Kill Participation percentage',
    icon: '🤝'
  },
  {
    id: 'dmg_percent',
    name: 'DMG%',
    category: 'combat',
    type: 'percentage',
    direction: 'higher-is-better',
    normalize: { min: 0, max: 40 },
    format: 'percentage',
    decimals: 1,
    description: 'Damage percentage of team',
    icon: '💥'
  },
  {
    id: 'dt_percent',
    name: 'DT%',
    category: 'combat',
    type: 'percentage',
    direction: 'lower-is-better',
    normalize: { min: 0, max: 30 },
    format: 'percentage',
    decimals: 1,
    description: 'Damage Taken percentage',
    icon: '🛡️'
  },
  {
    id: 'cspm',
    name: 'CSPM',
    category: 'farming',
    type: 'number',
    direction: 'higher-is-better',
    normalize: { min: 0, max: 12, roleSpecific: true },
    format: 'decimal',
    decimals: 1,
    description: 'CS Per Minute',
    icon: '🌾'
  },
  {
    id: 'csd_at_15',
    name: 'CSD@15',
    category: 'early',
    type: 'number',
    direction: 'higher-is-better',
    normalize: { min: -20, max: 20, roleSpecific: true },
    format: 'decimal',
    decimals: 1,
    description: 'CS Difference at 15 minutes',
    icon: '⏱️'
  },
  {
    id: 'gd_at_15',
    name: 'GD@15',
    category: 'early',
    type: 'number',
    direction: 'higher-is-better',
    normalize: { min: -2000, max: 2000, roleSpecific: true },
    format: 'decimal',
    decimals: 0,
    description: 'Gold Difference at 15 minutes',
    icon: '💰'
  },
  {
    id: 'vspm',
    name: 'VSPM',
    category: 'vision',
    type: 'number',
    direction: 'higher-is-better',
    normalize: { min: 0, max: 3, roleSpecific: true },
    format: 'decimal',
    decimals: 2,
    description: 'Vision Score Per Minute',
    icon: '👁️'
  },
  {
    id: 'dpm',
    name: 'DPM',
    category: 'combat',
    type: 'number',
    direction: 'higher-is-better',
    normalize: { min: 0, max: 1000, roleSpecific: true },
    format: 'decimal',
    decimals: 0,
    description: 'Damage Per Minute',
    icon: '🔥'
  },
  {
    id: 'fb_percent',
    name: 'FB%',
    category: 'combat',
    type: 'percentage',
    direction: 'higher-is-better',
    normalize: { min: 0, max: 50 },
    format: 'percentage',
    decimals: 1,
    description: 'First Blood rate',
    icon: '🔴'
  },
  {
    id: 'wpm',
    name: 'WPM',
    category: 'vision',
    type: 'number',
    direction: 'higher-is-better',
    normalize: { min: 0, max: 5, roleSpecific: true },
    format: 'decimal',
    decimals: 2,
    description: 'Wards Per Minute',
    icon: '🚩'
  },
  {
    id: 'wcpm',
    name: 'WCPM',
    category: 'vision',
    type: 'number',
    direction: 'higher-is-better',
    normalize: { min: 0, max: 1, roleSpecific: true },
    format: 'decimal',
    decimals: 2,
    description: 'Wards Cleared Per Minute',
    icon: '🧹'
  },
  {
    id: 'solo_kills',
    name: 'Solo Kills',
    category: 'combat',
    type: 'number',
    direction: 'higher-is-better',
    normalize: { min: 0, max: 20, roleSpecific: true },
    format: 'integer',
    decimals: 0,
    description: 'Solo Kills',
    icon: '🥷'
  },
  {
    id: 'fb_victim',
    name: 'FB Victim',
    category: 'combat',
    type: 'number',
    direction: 'lower-is-better',
    normalize: { min: 0, max: 20, roleSpecific: true },
    format: 'integer',
    decimals: 0,
    description: 'First Blood Victim',
    icon: '🩸'
  },
  {
    id: 'xpd_at_15',
    name: 'XPD@15',
    category: 'early',
    type: 'number',
    direction: 'higher-is-better',
    normalize: { min: -2000, max: 2000, roleSpecific: true },
    format: 'decimal',
    decimals: 0,
    description: 'XP Difference at 15 minutes',
    icon: '📈'
  },
  {
    id: 'egpm',
    name: 'EGPM',
    category: 'economy',
    type: 'number',
    direction: 'higher-is-better',
    normalize: { min: 0, max: 500, roleSpecific: true },
    format: 'decimal',
    decimals: 0,
    description: 'Earned Gold Per Minute',
    icon: '💵'
  }
];

// Mapping des colonnes CSV vers IDs métriques
export const csvColumnMapping: Record<string, string> = {
  'kda': 'kda',
  'kp': 'kp_percent',
  'kp%': 'kp_percent',
  'dmg%': 'dmg_percent',
  'dt%': 'dt_percent',
  'cspm': 'cspm',
  'csd@15': 'csd_at_15',
  'csd15': 'csd_at_15',
  'gd@15': 'gd_at_15',
  'gd15': 'gd_at_15',
  'xpd@15': 'xpd_at_15',
  'xpd15': 'xpd_at_15',
  'visionscore': 'vspm',
  'vs': 'vspm',
  'dpm': 'dpm',
  'firstblood%': 'fb_percent',
  'fb%': 'fb_percent',
  'wpm': 'wpm',
  'wcpm': 'wcpm',
  'solokills': 'solo_kills',
  'fbvictim': 'fb_victim',
  'fbvictim_added': 'fb_victim',
  'egpm': 'egpm'
};
