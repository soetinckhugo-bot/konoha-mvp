/**
 * @fileoverview Tests for PlayerFilterService
 * BMAD Phase 2 - Semaine 4
 */

import { describe, it, expect } from 'vitest';
import { PlayerFilterService } from '../PlayerFilterService';
import type { Player } from '../../../../core/types';

const createMockPlayers = (): Player[] => [
  { id: 'p1', name: 'Faker', role: 'MID', team: 'T1', gamesPlayed: 10, stats: { kda: 5.0, kp: 70 }, _source: 'csv' as const, _importedAt: Date.now() },
  { id: 'p2', name: 'Zeus', role: 'TOP', team: 'T1', gamesPlayed: 10, stats: { kda: 4.0, kp: 60 }, _source: 'csv' as const, _importedAt: Date.now() },
  { id: 'p3', name: 'Chovy', role: 'MID', team: 'GEN', gamesPlayed: 10, stats: { kda: 4.5, kp: 65 }, _source: 'csv' as const, _importedAt: Date.now() },
  { id: 'p4', name: 'Peanut', role: 'JUNGLE', team: 'GEN', gamesPlayed: 10, stats: { kda: 3.5, kp: 75 }, _source: 'csv' as const, _importedAt: Date.now() },
  { id: 'p5', name: 'Gumayusi', role: 'ADC', team: 'T1', gamesPlayed: 10, stats: { kda: 3.0, kp: 55 }, _source: 'csv' as const, _importedAt: Date.now() },
];

describe('PlayerFilterService', () => {
  const service = new PlayerFilterService();
  const players = createMockPlayers();

  describe('filterByRole', () => {
    it('should filter by role', () => {
      const midPlayers = service.filterByRole(players, 'MID');
      expect(midPlayers).toHaveLength(2);
      expect(midPlayers.every(p => p.role === 'MID')).toBe(true);
    });

    it('should return all players for ALL role', () => {
      const all = service.filterByRole(players, 'ALL');
      expect(all).toHaveLength(5);
    });

    it('should return empty array for unknown role', () => {
      const result = service.filterByRole(players, 'UNKNOWN');
      expect(result).toHaveLength(0);
    });
  });

  describe('filterByTeam', () => {
    it('should filter by team', () => {
      const t1Players = service.filterByTeam(players, 'T1');
      expect(t1Players).toHaveLength(3);
    });
  });

  describe('searchByName', () => {
    it('should search by player name', () => {
      const result = service.searchByName(players, 'Faker');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Faker');
    });

    it('should search case insensitive', () => {
      const result = service.searchByName(players, 'faker');
      expect(result).toHaveLength(1);
    });

    it('should search by team', () => {
      const result = service.searchByName(players, 'T1');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return all for empty query', () => {
      const result = service.searchByName(players, '');
      expect(result).toHaveLength(5);
    });
  });

  describe('sortByScore', () => {
    it('should sort by KDA descending', () => {
      const sorted = service.sortByScore(players, 'kda', true);
      expect(sorted[0].name).toBe('Faker'); // 5.0 KDA
      expect(sorted[sorted.length - 1].name).toBe('Gumayusi'); // 3.0 KDA
    });

    it('should sort ascending when specified', () => {
      const sorted = service.sortByScore(players, 'kda', false);
      expect(sorted[0].name).toBe('Gumayusi'); // 3.0 KDA
    });
  });

  describe('getTopPlayers', () => {
    it('should return top N players', () => {
      const top3 = service.getTopPlayers(players, 3, 'kda');
      expect(top3).toHaveLength(3);
      expect(top3[0].name).toBe('Faker');
    });

    it('should handle N > players count', () => {
      const top10 = service.getTopPlayers(players, 10, 'kda');
      expect(top10).toHaveLength(5);
    });
  });

  describe('formatPlayerName', () => {
    it('should format player name with team', () => {
      const formatted = service.formatPlayerName(players[0]);
      expect(formatted).toBe('Faker (T1)');
    });
  });

  describe('getGroupStats', () => {
    it('should calculate group statistics', () => {
      const stats = service.getGroupStats(players);
      
      expect(stats.count).toBe(5);
      expect(stats.avgKDA).toBeGreaterThan(0);
      expect(stats.topPlayer).toBeDefined();
    });

    it('should handle empty players', () => {
      const stats = service.getGroupStats([]);
      
      expect(stats.count).toBe(0);
      expect(stats.topPlayer).toBeNull();
    });
  });
});
