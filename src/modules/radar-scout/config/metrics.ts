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
  }
];

// Mapping des colonnes CSV vers IDs métriques
export const csvColumnMapping: Record<string, string> = {
  'kda': 'kda',
  'kp': 'kp_percent',
  'kp%': 'kp_percent',
  'dmg%': 'dmg_percent',
  'cspm': 'cspm',
  'csd@15': 'csd_at_15',
  'gd@15': 'gd_at_15',
  'visionscore': 'vspm',
  'vs': 'vspm',
  'dpm': 'dpm'
};
