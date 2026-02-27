/**
 * @fileoverview PlayerFilterService - Filtrage et tri des joueurs
 * 
 * Service extrait de RadarScoutModuleV4 (lignes 542-559, 991-1086)
 * Gère le filtrage par rôle, le tri, la recherche et le ranking
 * 
 * @example
 * const service = new PlayerFilterService();
 * const midPlayers = service.filterByRole(players, 'MID');
 * const top10 = service.getTopPlayers(players, 10, 'kda');
 */

import type { Player } from '../../../core/types';
import type { IPlayerFilterService } from '../../../core/types/bmad';
import { PercentileService } from './PercentileService';
import { GradeService } from './GradeService';

/**
 * Options de filtrage
 */
export interface FilterOptions {
  role?: string;
  team?: string;
  minGames?: number;
  searchQuery?: string;
}

/**
 * Options de tri
 */
export interface SortOptions {
  metric: string;
  descending?: boolean;
}

/**
 * Resultat de ranking
 */
export interface RankedPlayer extends Player {
  rank: number;
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  percentiles: Map<string, number>;
}

/**
 * Service de filtrage et tri des joueurs
 */
export class PlayerFilterService implements IPlayerFilterService {
  private percentileService: PercentileService;
  private gradeService: GradeService;
  
  constructor() {
    this.percentileService = new PercentileService();
    this.gradeService = new GradeService();
  }
  
  /**
   * Filtre les joueurs par rôle
   * 
   * @param players - Liste des joueurs
   * @param role - Rôle à filtrer (TOP, JUNGLE, MID, ADC, SUPPORT, ALL)
   * @returns Joueurs filtrés
   */
  filterByRole(players: Player[], role: string): Player[] {
    if (role === 'ALL' || !role) {
      return [...players];
    }
    
    return players.filter(p => p.role === role);
  }
  
  /**
   * Filtre les joueurs par équipe
   * 
   * @param players - Liste des joueurs
   * @param team - Nom de l'équipe
   * @returns Joueurs de l'équipe
   */
  filterByTeam(players: Player[], team: string): Player[] {
    if (!team) return [...players];
    return players.filter(p => p.team === team);
  }
  
  /**
   * Filtre les joueurs avec recherche texte
   * Recherche dans le nom et l'équipe
   * 
   * @param players - Liste des joueurs
   * @param query - Requête de recherche
   * @returns Joueurs correspondants
   */
  searchByName(players: Player[], query: string): Player[] {
    if (!query || query.trim() === '') {
      return [...players];
    }
    
    const lowerQuery = query.toLowerCase().trim();
    
    return players.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(lowerQuery);
      const teamMatch = p.team.toLowerCase().includes(lowerQuery);
      return nameMatch || teamMatch;
    });
  }
  
  /**
   * Trie les joueurs par nom (ordre alphabétique)
   * 
   * @param players - Liste des joueurs
   * @param descending - true pour Z-A, false pour A-Z
   * @returns Joueurs triés par nom
   */
  sortByName(players: Player[], descending: boolean = false): Player[] {
    const sorted = [...players].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      
      if (descending) {
        return nameB.localeCompare(nameA);
      }
      return nameA.localeCompare(nameB);
    });
    
    return sorted;
  }
  
  /**
   * Trie les joueurs par une métrique
   * 
   * @param players - Liste des joueurs
   * @param metric - Métrique de tri
   * @param descending - true pour ordre décroissant (meilleur en premier)
   * @returns Joueurs triés
   */
  sortByScore(
    players: Player[],
    metric: string,
    descending: boolean = true
  ): Player[] {
    const sorted = [...players].sort((a, b) => {
      const valueA = a.stats[metric] || 0;
      const valueB = b.stats[metric] || 0;
      
      if (descending) {
        return valueB - valueA;
      }
      return valueA - valueB;
    });
    
    return sorted;
  }
  
  /**
   * Trie les joueurs par score composite (moyenne des percentiles)
   * 
   * @param players - Liste des joueurs
   * @param metrics - Métriques à inclure dans le score
   * @param allPlayers - Tous les joueurs (pour calcul des percentiles)
   * @param descending - true pour meilleur en premier
   * @returns Joueurs triés par score composite
   */
  sortByCompositeScore(
    players: Player[],
    metrics: string[],
    allPlayers: Player[],
    descending: boolean = true
  ): Player[] {
    // Calculer le score pour chaque joueur
    const withScores = players.map(player => {
      const percentiles = this.percentileService.calculatePercentiles(
        player,
        metrics,
        allPlayers
      );
      
      const score = this.percentileService.calculateAveragePercentile(percentiles);
      
      return { player, score };
    });
    
    // Trier par score
    withScores.sort((a, b) => {
      if (descending) return b.score - a.score;
      return a.score - b.score;
    });
    
    return withScores.map(item => item.player);
  }
  
  /**
   * Récupère le top N joueurs
   * 
   * @param players - Liste des joueurs
   * @param n - Nombre de joueurs à récupérer
   * @param metric - Métrique de tri (optionnel, défaut: composite)
   * @returns Top N joueurs
   */
  getTopPlayers(players: Player[], n: number, metric?: string): Player[] {
    let sorted: Player[];
    
    if (metric) {
      sorted = this.sortByScore(players, metric);
    } else {
      // Tri par KDA par défaut
      sorted = this.sortByScore(players, 'kda');
    }
    
    return sorted.slice(0, n);
  }
  
  /**
   * Classe les joueurs avec ranking complet
   * Ajoute rank, score, grade et percentiles à chaque joueur
   * 
   * @param players - Liste des joueurs
   * @param allPlayers - Tous les joueurs (pour contexte)
   * @param metrics - Métriques pour le scoring
   * @returns Joueurs classés avec métadonnées
   */
  rankPlayers(
    players: Player[],
    allPlayers: Player[],
    metrics: string[] = ['kda', 'kp', 'cspm', 'dpm', 'visionScore']
  ): RankedPlayer[] {
    // Calculer les scores
    const withScores = players.map(player => {
      const percentiles = this.percentileService.calculatePercentiles(
        player,
        metrics,
        allPlayers
      );
      
      const score = this.percentileService.calculateAveragePercentile(percentiles);
      const grade = this.gradeService.getPlayerGradeFromAverage(score);
      
      return {
        ...player,
        score,
        grade,
        percentiles,
        rank: 0, // Sera défini après le tri
      };
    });
    
    // Trier par score décroissant
    withScores.sort((a, b) => b.score - a.score);
    
    // Assigner les ranks
    withScores.forEach((player, index) => {
      player.rank = index + 1;
    });
    
    return withScores;
  }
  
  /**
   * Filtre multi-critères
   * 
   * @param players - Liste des joueurs
   * @param options - Options de filtrage
   * @returns Joueurs filtrés
   */
  filter(players: Player[], options: FilterOptions): Player[] {
    let result = [...players];
    
    // Filtre par rôle
    if (options.role && options.role !== 'ALL') {
      result = this.filterByRole(result, options.role);
    }
    
    // Filtre par équipe
    if (options.team) {
      result = this.filterByTeam(result, options.team);
    }
    
    // Filtre par recherche
    if (options.searchQuery) {
      result = this.searchByName(result, options.searchQuery);
    }
    
    // Filtre par nombre de games minimum
    if (options.minGames) {
      result = result.filter(p => (p.stats.games || 0) >= options.minGames!);
    }
    
    return result;
  }
  
  /**
   * Récupère les statistiques d'un groupe de joueurs
   * 
   * @param players - Liste des joueurs
   * @returns Statistiques globales
   */
  getGroupStats(players: Player[]): {
    count: number;
    avgKDA: number;
    avgKP: number;
    avgCSPM: number;
    topPlayer: Player | null;
  } {
    if (players.length === 0) {
      return {
        count: 0,
        avgKDA: 0,
        avgKP: 0,
        avgCSPM: 0,
        topPlayer: null,
      };
    }
    
    const sumKDA = players.reduce((acc, p) => acc + (p.stats.kda || 0), 0);
    const sumKP = players.reduce((acc, p) => acc + (p.stats.kp || 0), 0);
    const sumCSPM = players.reduce((acc, p) => acc + (p.stats.cspm || 0), 0);
    
    const topPlayer = this.sortByScore(players, 'kda')[0];
    
    return {
      count: players.length,
      avgKDA: sumKDA / players.length,
      avgKP: sumKP / players.length,
      avgCSPM: sumCSPM / players.length,
      topPlayer,
    };
  }
  
  /**
   * Formate le nom du joueur avec son équipe
   * Format: "Nom (Equipe)"
   * 
   * @param player - Joueur
   * @returns String formatée
   */
  formatPlayerName(player: Player): string {
    return `${player.name} (${player.team})`;
  }
}

// Export singleton
export const playerFilterService = new PlayerFilterService();
export default PlayerFilterService;
