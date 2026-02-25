/**
 * @fileoverview Tests for NormalizationService
 * BMAD Phase 4: Testing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NormalizationService } from '../core/NormalizationService';
import type { MetricConfig, Player } from '../core/types';

describe('NormalizationService', () => {
  let service: NormalizationService;

  beforeEach(() => {
    service = new NormalizationService();
  });

  describe('normalize', () => {
    const mockMetric: MetricConfig = {
      id: 'kda',
      name: 'KDA',
      category: 'combat',
      type: 'ratio',
      direction: 'higher-is-better',
      normalize: { min: 0, max: 10 },
      format: 'decimal',
      decimals: 2,
    };

    it('should normalize value within range to 0-100 scale', () => {
      const result = service.normalize(5, mockMetric);
      expect(result).toBe(50);
    });

    it('should return 0 for minimum value', () => {
      const result = service.normalize(0, mockMetric);
      expect(result).toBe(0);
    });

    it('should return 100 for maximum value', () => {
      const result = service.normalize(10, mockMetric);
      expect(result).toBe(100);
    });

    it('should clamp values below range to 0', () => {
      const result = service.normalize(-5, mockMetric);
      expect(result).toBe(0);
    });

    it('should clamp values above range to 100', () => {
      const result = service.normalize(15, mockMetric);
      expect(result).toBe(100);
    });

    it('should invert normalization for lower-is-better metrics', () => {
      const invertedMetric: MetricConfig = {
        ...mockMetric,
        direction: 'lower-is-better',
      };
      const result = service.normalize(5, invertedMetric);
      expect(result).toBe(50); // 100 - 50 = 50
    });

    it('should return 100 for minimum value when inverted', () => {
      const invertedMetric: MetricConfig = {
        ...mockMetric,
        direction: 'lower-is-better',
      };
      const result = service.normalize(0, invertedMetric);
      expect(result).toBe(100);
    });

    it('should return 0 for maximum value when inverted', () => {
      const invertedMetric: MetricConfig = {
        ...mockMetric,
        direction: 'lower-is-better',
      };
      const result = service.normalize(10, invertedMetric);
      expect(result).toBe(0);
    });
  });

  describe('getGrade', () => {
    it('should return S for percentile >= 90', () => {
      expect(service.getGrade(90)).toBe('S');
      expect(service.getGrade(95)).toBe('S');
      expect(service.getGrade(100)).toBe('S');
    });

    it('should return A for percentile 80-89', () => {
      expect(service.getGrade(80)).toBe('A');
      expect(service.getGrade(85)).toBe('A');
      expect(service.getGrade(89)).toBe('A');
    });

    it('should return B for percentile 65-79', () => {
      expect(service.getGrade(65)).toBe('B');
      expect(service.getGrade(70)).toBe('B');
      expect(service.getGrade(79)).toBe('B');
    });

    it('should return C for percentile < 60', () => {
      expect(service.getGrade(59)).toBe('C');
      expect(service.getGrade(50)).toBe('C');
      expect(service.getGrade(0)).toBe('C');
    });
  });

  describe('calculatePercentile', () => {
    beforeEach(() => {
      const centiles = {
        kda: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      };
      service.setCentiles(centiles);
    });

    it('should calculate correct percentile for median value', () => {
      const result = service.calculatePercentile(5.5, 'kda');
      expect(result).toBe(50);
    });

    it('should return 0 for minimum value', () => {
      const result = service.calculatePercentile(1, 'kda');
      expect(result).toBe(0);
    });

    it('should return ~90 for maximum value', () => {
      const result = service.calculatePercentile(10, 'kda');
      expect(result).toBe(90);
    });

    it('should return 50 for unknown metric', () => {
      const result = service.calculatePercentile(5, 'unknown');
      expect(result).toBe(50);
    });
  });

  describe('calculateRanges', () => {
    const mockPlayers: Player[] = [
      { id: '1', name: 'P1', team: 'T1', role: 'MID', gamesPlayed: 10, stats: { kda: 2.5, kills: 10 }, _source: 'csv', _importedAt: Date.now() },
      { id: '2', name: 'P2', team: 'T2', role: 'MID', gamesPlayed: 10, stats: { kda: 3.5, kills: 15 }, _source: 'csv', _importedAt: Date.now() },
      { id: '3', name: 'P3', team: 'T3', role: 'MID', gamesPlayed: 10, stats: { kda: 4.5, kills: 20 }, _source: 'csv', _importedAt: Date.now() },
    ];

    it('should calculate correct min and max for each metric', () => {
      const ranges = service.calculateRanges(mockPlayers);
      
      expect(ranges.kda).toEqual({ min: 2.5, max: 4.5 });
      expect(ranges.kills).toEqual({ min: 10, max: 20 });
    });

    it('should handle players with missing stats', () => {
      const playersWithMissing: Player[] = [
        ...mockPlayers,
        { id: '4', name: 'P4', team: 'T4', role: 'MID', gamesPlayed: 10, stats: {}, _source: 'csv', _importedAt: Date.now() },
      ];
      
      const ranges = service.calculateRanges(playersWithMissing);
      expect(ranges.kda).toEqual({ min: 2.5, max: 4.5 });
    });

    it('should return empty object for empty player array', () => {
      const ranges = service.calculateRanges([]);
      expect(ranges).toEqual({});
    });

    it('should handle equal min and max by expanding range', () => {
      const sameValuePlayers: Player[] = [
        { id: '1', name: 'P1', team: 'T1', role: 'MID', gamesPlayed: 10, stats: { same: 5 }, _source: 'csv', _importedAt: Date.now() },
        { id: '2', name: 'P2', team: 'T2', role: 'MID', gamesPlayed: 10, stats: { same: 5 }, _source: 'csv', _importedAt: Date.now() },
      ];
      
      const ranges = service.calculateRanges(sameValuePlayers);
      expect(ranges.same).toEqual({ min: 4, max: 6 });
    });
  });

  describe('calculateCentiles', () => {
    const mockPlayers: Player[] = [
      { id: '1', name: 'P1', team: 'T1', role: 'MID', gamesPlayed: 10, stats: { kda: 2 }, _source: 'csv', _importedAt: Date.now() },
      { id: '2', name: 'P2', team: 'T2', role: 'MID', gamesPlayed: 10, stats: { kda: 4 }, _source: 'csv', _importedAt: Date.now() },
      { id: '3', name: 'P3', team: 'T3', role: 'MID', gamesPlayed: 10, stats: { kda: 6 }, _source: 'csv', _importedAt: Date.now() },
    ];

    it('should calculate sorted centiles for each metric', () => {
      const centiles = service.calculateCentiles(mockPlayers);
      
      expect(centiles.kda).toEqual([2, 4, 6]);
    });

    it('should handle players with missing stats', () => {
      const playersWithMissing: Player[] = [
        ...mockPlayers,
        { id: '4', name: 'P4', team: 'T4', role: 'MID', gamesPlayed: 10, stats: {}, _source: 'csv', _importedAt: Date.now() },
      ];
      
      const centiles = service.calculateCentiles(playersWithMissing);
      expect(centiles.kda).toEqual([2, 4, 6]);
    });

    it('should return empty object for empty player array', () => {
      const centiles = service.calculateCentiles([]);
      expect(centiles).toEqual({});
    });
  });
});
