/**
 * DataService - CSV Parsing avec PapaParse
 * Story 2.2
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
    const metrics = this.detectNumericMetrics(data, columns);

    // Créer objets Player
    const players = data.map((row, index) => 
      this.createPlayer(row, index, nameColumn, teamColumn, roleColumn, metrics)
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

    // Extraire les stats
    const stats: Record<string, number> = {};
    metrics.forEach(metric => {
      const val = row[metric];
      if (typeof val === 'number') {
        stats[this.normalizeMetricId(metric)] = val;
      } else if (typeof val === 'string') {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) {
          stats[this.normalizeMetricId(metric)] = parsed;
        }
      }
    });

    return {
      id: `player_${index}_${name.replace(/\s+/g, '_')}`,
      name,
      team: teamCol ? String(row[teamCol] || '') : '',
      role: this.normalizeRole(roleCol ? String(row[roleCol]) : null),
      gamesPlayed: 0,  // TODO: Détecter si colonne existe
      stats,
      _source: 'csv',
      _importedAt: Date.now()
    };
  }

  private normalizeMetricId(colName: string): string {
    // Convertir nom colonne en ID métrique
    // KDA → kda, CSD@15 → csd_at_15, etc.
    return colName
      .toLowerCase()
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
