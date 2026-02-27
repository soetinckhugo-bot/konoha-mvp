/**
 * @fileoverview Tests for PercentileService
 * BMAD Phase 2 - Semaine 3
 * 
 * Objectif: 100% coverage des calculs de percentile
 * Validation: Mêmes résultats que les characterization tests V4
 */

import { describe, it, expect } from 'vitest';
import { PercentileService } from '../PercentileService';
import type { Player } from '../../../../core/types';

// ============================================================================
// Fixtures
// ============================================================================

const createMockPlayers = (): Player[] => [
  {
    id: 'p1',
    name: 'Faker',
    role: 'MID',
    team: 'T1',
    gamesPlayed: 10,
    stats: { kda: 5.2, kp: 70, cspm: 9.0, dpm: 720, visionScore: 85 },
    _source: 'csv' as const,
    _importedAt: Date.now(),
  },
  {
    id: 'p2',
    name: 'Chovy',
    role: 'MID',
    team: 'GEN',
    gamesPlayed: 10,
    stats: { kda: 4.8, kp: 68, cspm: 8.8, dpm: 700, visionScore: 82 },
    _source: 'csv' as const,
    _importedAt: Date.now(),
  },
  {
    id: 'p3',
    name: 'ShowMaker',
    role: 'MID',
    team: 'DK',
    gamesPlayed: 10,
    stats: { kda: 4.0, kp: 62, cspm: 8.0, dpm: 650, visionScore: 75 },
    _source: 'csv' as const,
    _importedAt: Date.now(),
  },
  {
    id: 'p4',
    name: 'Caps',
    role: 'MID',
    team: 'G2',
    gamesPlayed: 10,
    stats: { kda: 3.5, kp: 58, cspm: 7.5, dpm: 600, visionScore: 70 },
    _source: 'csv' as const,
    _importedAt: Date.now(),
  },
  {
    id: 'p5',
    name: 'Knight',
    role: 'MID',
    team: 'BLG',
    gamesPlayed: 10,
    stats: { kda: 3.0, kp: 55, cspm: 7.0, dpm: 550, visionScore: 65 },
    _source: 'csv' as const,
    _importedAt: Date.now(),
  },
  {
    id: 'p6',
    name: 'Scout',
    role: 'MID',
    team: 'JDG',
    gamesPlayed: 10,
    stats: { kda: 2.5, kp: 50, cspm: 6.5, dpm: 500, visionScore: 60 },
    _source: 'csv' as const,
    _importedAt: Date.now(),
  },
  {
    id: 'p7',
    name: 'Bdd',
    role: 'MID',
    team: 'KT',
    gamesPlayed: 10,
    stats: { kda: 2.0, kp: 45, cspm: 6.0, dpm: 450, visionScore: 55 },
    _source: 'csv' as const,
    _importedAt: Date.now(),
  },
  {
    id: 'p8',
    name: 'Zeka',
    role: 'MID',
    team: 'HLE',
    gamesPlayed: 10,
    stats: { kda: 1.5, kp: 40, cspm: 5.5, dpm: 400, visionScore: 50 },
    _source: 'csv' as const,
    _importedAt: Date.now(),
  },
  {
    id: 'p9',
    name: 'Kuro',
    role: 'MID',
    team: 'FOX',
    gamesPlayed: 10,
    stats: { kda: 1.0, kp: 35, cspm: 5.0, dpm: 350, visionScore: 45 },
    _source: 'csv' as const,
    _importedAt: Date.now(),
  },
  {
    id: 'p10',
    name: 'Fly',
    role: 'MID',
    team: 'KDF',
    stats: { kda: 0.5, kp: 30, cspm: 4.5, dpm: 300, visionScore: 40 },
  },
];

// ============================================================================
// Test Suite
// ============================================================================

describe('PercentileService', () => {
  const service = new PercentileService();
  const players = createMockPlayers();

  describe('calculatePercentile', () => {
    it('should return 90 for maximum value', () => {
      const maxKDA = 5.2;
      const result = service.calculatePercentile(maxKDA, 'kda', players, false);
      expect(result).toBe(90);
    });

    it('should return 0 for minimum value', () => {
      const minKDA = 0.5;
      const result = service.calculatePercentile(minKDA, 'kda', players, false);
      expect(result).toBe(0);
    });

    it('should return 50 for median value', () => {
      const medianKDA = 2.8;
      const result = service.calculatePercentile(medianKDA, 'kda', players, false);
      expect(result).toBe(50);
    });

    it('should handle inverted metrics', () => {
      const deaths = 2;
      const normalResult = service.calculatePercentile(deaths, 'dth', players, false);
      const invertedResult = service.calculatePercentile(deaths, 'dth', players, true);
      expect(invertedResult).toBe(100 - normalResult);
    });

    it('should return 50 for empty player list', () => {
      const result = service.calculatePercentile(5.0, 'kda', [], false);
      expect(result).toBe(50);
    });

    it('should return 50 for single player', () => {
      const singlePlayer = [players[0]];
      const result = service.calculatePercentile(5.0, 'kda', singlePlayer, false);
      expect(result).toBe(50);
    });
  });

  describe('calculatePercentiles', () => {
    it('should calculate percentiles for multiple metrics', () => {
      const player = players[0];
      const metrics = ['kda', 'kp', 'cspm'];
      const percentiles = service.calculatePercentiles(player, metrics, players);
      
      expect(percentiles.has('kda')).toBe(true);
      expect(percentiles.has('kp')).toBe(true);
      expect(percentiles.has('cspm')).toBe(true);
    });

    it('should return 50 for undefined metrics', () => {
      const player = players[0];
      const metrics = ['unknownMetric'];
      const percentiles = service.calculatePercentiles(player, metrics, players);
      expect(percentiles.get('unknownMetric')).toBe(50);
    });
  });

  describe('isInvertedMetric', () => {
    it('should identify inverted metrics', () => {
      expect(service.isInvertedMetric('dth')).toBe(true);
      expect(service.isInvertedMetric('dth%')).toBe(true);
      expect(service.isInvertedMetric('fbvictim')).toBe(true);
    });

    it('should identify normal metrics', () => {
      expect(service.isInvertedMetric('kda')).toBe(false);
      expect(service.isInvertedMetric('kp')).toBe(false);
      expect(service.isInvertedMetric('cspm')).toBe(false);
    });
  });
});
