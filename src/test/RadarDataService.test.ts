/**
 * @fileoverview Tests for RadarDataService
 * BMAD Phase 4: Testing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RadarDataService } from '../modules/radar-scout/services/RadarDataService';
import type { Player, MetricConfig } from '../core/types';

describe('RadarDataService', () => {
  let service: RadarDataService;
  
  const mockMetrics: MetricConfig[] = [
    {
      id: 'kda',
      name: 'KDA',
      category: 'combat',
      type: 'ratio',
      direction: 'higher-is-better',
      normalize: { min: 0, max: 10 },
      format: 'decimal',
    },
    {
      id: 'cspm',
      name: 'CSPM',
      category: 'farming',
      type: 'number',
      direction: 'higher-is-better',
      normalize: { min: 0, max: 10 },
      format: 'decimal',
    },
  ];

  const mockPlayers: Player[] = [
    { id: 'p1', name: 'Faker', team: 'T1', role: 'MID', gamesPlayed: 10, stats: { kda: 4.5, cspm: 8.5 }, _source: 'csv', _importedAt: Date.now() },
    { id: 'p2', name: 'Chovy', team: 'GEN', role: 'MID', gamesPlayed: 10, stats: { kda: 5.2, cspm: 9.0 }, _source: 'csv', _importedAt: Date.now() },
    { id: 'p3', name: 'Zeus', team: 'T1', role: 'TOP', gamesPlayed: 10, stats: { kda: 3.8, cspm: 7.5 }, _source: 'csv', _importedAt: Date.now() },
  ];

  beforeEach(() => {
    service = new RadarDataService();
  });

  describe('getConfig', () => {
    it('should create config for solo mode', () => {
      const config = service.getConfig('solo', 'p1', mockMetrics, mockPlayers);
      
      expect(config.metrics).toEqual(mockMetrics);
      expect(config.datasets).toHaveLength(1);
      expect(config.datasets[0].label).toBe('Faker');
      expect(config.datasets[0].playerId).toBe('p1');
    });

    it('should create config for compare mode with second player', () => {
      const config = service.getConfig('compare', 'p1', mockMetrics, mockPlayers, 'p2');
      
      expect(config.datasets).toHaveLength(2);
      expect(config.datasets[0].label).toBe('Faker');
      expect(config.datasets[1].label).toBe('Chovy');
    });

    it('should create config for compare mode without second player (solo fallback)', () => {
      const config = service.getConfig('compare', 'p1', mockMetrics, mockPlayers);
      
      expect(config.datasets).toHaveLength(1);
    });

    it('should create config for benchmark mode with average dataset', () => {
      const config = service.getConfig('benchmark', 'p1', mockMetrics, mockPlayers);
      
      expect(config.datasets).toHaveLength(2);
      expect(config.datasets[0].label).toBe('Faker');
      expect(config.datasets[1].label).toContain('Moyenne');
      expect(config.datasets[1].label).toContain('MID');
    });

    it('should use custom normalization function when provided', () => {
      const mockNormalize = (player: Player, metric: MetricConfig) => {
        return player.stats[metric.id] * 10; // Simple mock
      };
      
      const config = service.getConfig('solo', 'p1', mockMetrics, mockPlayers, undefined, mockNormalize);
      
      expect(config.datasets[0].data[0]).toBe(45); // 4.5 * 10
      expect(config.datasets[0].data[1]).toBe(85); // 8.5 * 10
    });

    it('should cache config and return cached version on subsequent calls', () => {
      const config1 = service.getConfig('solo', 'p1', mockMetrics, mockPlayers);
      const config2 = service.getConfig('solo', 'p1', mockMetrics, mockPlayers);
      
      expect(config1).toBe(config2); // Same reference
    });

    it('should create different cache keys for different modes', () => {
      const soloConfig = service.getConfig('solo', 'p1', mockMetrics, mockPlayers);
      const benchmarkConfig = service.getConfig('benchmark', 'p1', mockMetrics, mockPlayers);
      
      expect(soloConfig).not.toBe(benchmarkConfig);
    });

    it('should throw error for non-existent player', () => {
      expect(() => {
        service.getConfig('solo', 'nonexistent', mockMetrics, mockPlayers);
      }).toThrow('Player nonexistent not found');
    });
  });

  describe('createPlayerDataset', () => {
    it('should include raw data alongside normalized data', () => {
      const config = service.getConfig('solo', 'p1', mockMetrics, mockPlayers);
      
      expect(config.datasets[0].rawData[0]).toBe(4.5); // Raw KDA
      expect(config.datasets[0].rawData[1]).toBe(8.5); // Raw CSPM
    });

    it('should use provided color for dataset', () => {
      const config = service.getConfig('solo', 'p1', mockMetrics, mockPlayers);
      
      expect(config.datasets[0].borderColor).toBeDefined();
      expect(config.datasets[0].backgroundColor).toBeDefined();
    });
  });

  describe('createAverageDataset', () => {
    it('should calculate average from players of same role', () => {
      const config = service.getConfig('benchmark', 'p1', mockMetrics, mockPlayers);
      const avgDataset = config.datasets[1];
      
      // MID players: Faker (kda: 4.5), Chovy (kda: 5.2)
      // Average KDA: (4.5 + 5.2) / 2 = 4.85
      expect(avgDataset.data[0]).toBeCloseTo(4.85, 1);
    });

    it('should handle case with no players of same role', () => {
      const singleRolePlayers = mockPlayers.filter(p => p.role === 'TOP');
      const config = service.getConfig('benchmark', 'p3', mockMetrics, singleRolePlayers);
      
      // Should still work with single player
      expect(config.datasets).toHaveLength(2);
    });

    it('should include borderDash for average dataset', () => {
      const config = service.getConfig('benchmark', 'p1', mockMetrics, mockPlayers);
      const avgDataset = config.datasets[1];
      
      expect(avgDataset.borderDash).toEqual([5, 5]);
    });
  });

  describe('clearCache', () => {
    it('should clear cached configs', () => {
      const config1 = service.getConfig('solo', 'p1', mockMetrics, mockPlayers);
      service.clearCache();
      const config2 = service.getConfig('solo', 'p1', mockMetrics, mockPlayers);
      
      expect(config1).not.toBe(config2); // Different references after clear
    });
  });
});
