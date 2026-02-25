/**
 * DataService - CSV Parsing avec PapaParse
 * Story 2.2 - LCK Cup 2026 Support
 */

import Papa from 'papaparse';
import type { Player, ParsedCSV, LoLRole } from './types';

export interface ParseOptions {
  header?: boolean;
  dynamicTyping?: boolean;
  skipEmptyLines?: boolean;
}

export class DataService {
  /**
   * Parse un fichier CSV
   */
  async parseCSV(file: File, options: ParseOptions = {}): Promise<ParsedCSV> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: options.header ?? true,
        dynamicTyping: options.dynamicTyping ?? true,
        skipEmptyLines: options.skipEmptyLines ?? true,
        encoding: 'UTF-8',
        complete: (results) => {
          const parsed = this.processResults(results.data as Record<string, unknown>[]);
          resolve(parsed);
        },
        error: (error) => {
          reject(new Error(`CSV Parse Error: ${error.message}`));
        }
      });
    });
  }

  private processResults(data: Record<string, unknown>[]): ParsedCSV {
    if (data.length === 0) {
      return { players: [], columns: [], metrics: [], warnings: ['Fichier vide'] };
    }

    const columns = Object.keys(data[0]);
    const warnings: string[] = [];

    // Détecter colonnes spéciales
    const nameColumn = this.detectNameColumn(columns);
    const teamColumn = this.detectTeamColumn(columns);
    const roleColumn = this.detectRoleColumn(columns);

    if (!nameColumn) warnings.push('Colonne joueur non détectée');
    if (!roleColumn) warnings.push('Colonne rôle non détectée');

    // Détecter métriques numériques
    const rawMetrics = this.detectNumericMetrics(data, columns);
    
    // Normaliser les IDs des métriques
    const metrics = rawMetrics.map(m => this.normalizeMetricId(m));

    // Créer objets Player
    const players = data.map((row, index) => 
      this.createPlayer(row, index, nameColumn, teamColumn, roleColumn, rawMetrics)
    ).filter((p): p is Player => p !== null);

    return { players, columns, metrics, warnings };
  }

  private detectNameColumn(columns: string[]): string | null {
    const candidates = ['Player', 'player', 'Name', 'name', 'PLAYER', 'NAME'];
    return candidates.find(c => columns.includes(c)) || null;
  }

  private detectTeamColumn(columns: string[]): string | null {
    const candidates = ['Team', 'team', 'TEAM', 'Org', 'org'];
    return candidates.find(c => columns.includes(c)) || null;
  }

  private detectRoleColumn(columns: string[]): string | null {
    const candidates = ['Pos', 'pos', 'Position', 'position', 'ROLE', 'Role', 'role'];
    return candidates.find(c => columns.includes(c)) || null;
  }

  private detectNumericMetrics(data: Record<string, unknown>[], columns: string[]): string[] {
    return columns.filter(col => {
      // Ignorer colonnes d'identification
      if (this.isIdentifierColumn(col)) return false;

      // Vérifier si la majorité des valeurs sont numériques
      const numericCount = data.filter(row => {
        const val = row[col];
        return typeof val === 'number' || 
               (typeof val === 'string' && !isNaN(parseFloat(val)));
      }).length;

      return numericCount / data.length > 0.8;  // 80% numérique
    });
  }

  private isIdentifierColumn(col: string): boolean {
    const identifiers = ['Player', 'player', 'Name', 'name', 'Team', 'team', 
                        'Pos', 'pos', 'Position', 'position', 'League', 'league'];
    return identifiers.includes(col);
  }

  private createPlayer(
    row: Record<string, unknown>,
    index: number,
    nameCol: string | null,
    teamCol: string | null,
    roleCol: string | null,
    metrics: string[]
  ): Player | null {
    const name = nameCol ? String(row[nameCol]) : `Player_${index}`;
    if (!name || name === 'undefined') return null;

    // Extraire les stats avec les noms originaux des colonnes
    const stats: Record<string, number> = {};
    metrics.forEach(metric => {
      const val = row[metric];
      const normalizedId = this.normalizeMetricId(metric);
      if (typeof val === 'number') {
        stats[normalizedId] = val;
      } else if (typeof val === 'string') {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) {
          stats[normalizedId] = parsed;
        }
      }
    });

    return {
      id: `player_${index}_${name.replace(/\s+/g, '_')}`,
      name,
      team: teamCol ? String(row[teamCol] || '') : '',
      role: this.normalizeRole(roleCol ? String(row[roleCol]) : null),
      gamesPlayed: this.extractGamesPlayed(row),
      stats,
      _source: 'csv',
      _importedAt: Date.now()
    };
  }

  private extractGamesPlayed(row: Record<string, unknown>): number {
    const gp = row['GP'] || row['gp'] || row['Games'] || row['games'];
    if (typeof gp === 'number') return gp;
    if (typeof gp === 'string') {
      const parsed = parseInt(gp, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private normalizeMetricId(colName: string): string {
    // Mapping COMPLET pour LCK Cup 2026 et Oracle's Elixir
    const mapping: Record<string, string> = {
      // === GENERAL ===
      'gp': 'games_played',
      'w%': 'win_rate',
      'ctr%': 'counter_pick_rate',
      
      // === COMBAT - Kills/Deaths/Assists ===
      'k': 'kills',
      'd': 'deaths',
      'a': 'assists',
      'kda': 'kda',
      
      // === COMBAT - Participation ===
      'kp': 'kp_percent',
      'kp%': 'kp_percent',
      'ks%': 'ks_percent',
      'kills share': 'ks_percent',
      
      // === COMBAT - Damage ===
      'dpm': 'dpm',
      'dmg%': 'dmg_percent',
      'damage%': 'dmg_percent',
      'd%p15': 'dmg_percent_at_15',
      'd%p15 ': 'dmg_percent_at_15',
      'tdpg': 'team_dmg_per_gold',
      
      // === COMBAT - Deaths ===
      'dth%': 'death_share',
      'dt%': 'dt_percent',
      
      // === COMBAT - First Blood ===
      'fb%': 'fb_percent',
      'firstblood%': 'fb_percent',
      'fb% ': 'fb_percent',
      
      // === COMBAT - FB Victim ===
      'fbvictim': 'fb_victim',
      'fbvictim_added': 'fb_victim',
      'fb_victim': 'fb_victim',
      'firstbloodvictim': 'fb_victim',
      
      // === COMBAT - Solo Kills ===
      'solokills': 'solo_kills',
      'solo_kills': 'solo_kills',
      'solokills ': 'solo_kills',
      
      // === COMBAT - Steals ===
      'stl': 'steals',
      
      // === FARMING - CS ===
      'cspm': 'cspm',
      'cs%p15': 'cs_share_at_15',
      
      // === FARMING - CS Difference ===
      'csd10': 'csd_at_10',
      'csd@10': 'csd_at_10',
      'csd15': 'csd_at_15',
      'csd@15': 'csd_at_15',
      
      // === ECONOMY - Gold ===
      'egpm': 'egpm',
      'earned gpm': 'egpm',
      'gold%': 'gold_share',
      'gold% ': 'gold_share',
      
      // === Combat - Penta Kills ===
      'pentakills': 'penta_kills',
      'penta kills': 'penta_kills',
      'penta_kills': 'penta_kills',
      'gd10': 'gd_at_10',
      'gd@10': 'gd_at_10',
      'gd15': 'gd_at_15',
      'gd@15': 'gd_at_15',
      
      // === XP ===
      'xpd10': 'xpd_at_10',
      'xpd@10': 'xpd_at_10',
      'xpd15': 'xpd_at_15',
      'xpd@15': 'xpd_at_15',
      
      // === VISION ===
      'wpm': 'wpm',
      'cwpm': 'cwpm',
      'control wards per minute': 'cwpm',
      'wcpm': 'wcpm',
      'wards cleared per minute': 'wcpm',
      'vs%': 'vision_share',
      'vspm': 'vspm',
      'vision score per minute': 'vspm'
    };
    
    const normalized = colName.toLowerCase().trim();
    return mapping[normalized] || normalized
      .replace(/[@\s%]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private normalizeRole(roleValue: string | null): LoLRole {
    if (!roleValue) return 'TOP';  // Default

    const normalized = roleValue.toUpperCase().trim();
    
    if (['TOP', 'T', 'TP'].includes(normalized)) return 'TOP';
    if (['JUNGLE', 'JGL', 'JG', 'JUN', 'JNG'].includes(normalized)) return 'JUNGLE';
    if (['MID', 'M', 'MIDDLE'].includes(normalized)) return 'MID';
    if (['ADC', 'BOT', 'AD', 'A', 'CARRY'].includes(normalized)) return 'ADC';
    if (['SUPPORT', 'SUP', 'SUPP', 'S', 'UTILITY'].includes(normalized)) return 'SUPPORT';
    
    return 'TOP';  // Default fallback
  }
}
