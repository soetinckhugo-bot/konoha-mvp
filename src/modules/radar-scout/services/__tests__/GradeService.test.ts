/**
 * @fileoverview Tests for GradeService
 * BMAD Phase 2 - Semaine 4
 */

import { describe, it, expect } from 'vitest';
import { GradeService } from '../GradeService';
import type { Player } from '../../../../core/types';

const createMockPlayers = (): Player[] => [
  { id: 'p1', name: 'Elite', role: 'MID', team: 'T1', gamesPlayed: 10, stats: { kda: 6.0, kp: 80 }, _source: 'csv', _importedAt: Date.now() },
  { id: 'p2', name: 'Good', role: 'MID', team: 'GEN', gamesPlayed: 10, stats: { kda: 4.0, kp: 70 }, _source: 'csv', _importedAt: Date.now() },
  { id: 'p3', name: 'Average', role: 'MID', team: 'DK', gamesPlayed: 10, stats: { kda: 2.5, kp: 55 }, _source: 'csv', _importedAt: Date.now() },
  { id: 'p4', name: 'Weak', role: 'MID', team: 'G2', gamesPlayed: 10, stats: { kda: 1.0, kp: 40 }, _source: 'csv', _importedAt: Date.now() },
];

describe('GradeService', () => {
  const service = new GradeService();

  describe('getGrade (Stats)', () => {
    it('should return S for percentile 90+', () => {
      expect(service.getGrade(90)).toBe('S');
      expect(service.getGrade(95)).toBe('S');
      expect(service.getGrade(100)).toBe('S');
    });

    it('should return A for percentile 75-89', () => {
      expect(service.getGrade(75)).toBe('A');
      expect(service.getGrade(80)).toBe('A');
      expect(service.getGrade(89)).toBe('A');
    });

    it('should return B for percentile 55-74', () => {
      expect(service.getGrade(55)).toBe('B');
      expect(service.getGrade(65)).toBe('B');
      expect(service.getGrade(74)).toBe('B');
    });

    it('should return C for percentile 35-54', () => {
      expect(service.getGrade(35)).toBe('C');
      expect(service.getGrade(45)).toBe('C');
      expect(service.getGrade(54)).toBe('C');
    });

    it('should return D for percentile <35', () => {
      expect(service.getGrade(0)).toBe('D');
      expect(service.getGrade(20)).toBe('D');
      expect(service.getGrade(34)).toBe('D');
    });
  });

  describe('getPlayerGradeFromAverage', () => {
    it('should return S for average 75+', () => {
      expect(service.getPlayerGradeFromAverage(75)).toBe('S');
      expect(service.getPlayerGradeFromAverage(90)).toBe('S');
    });

    it('should return A for average 60-74', () => {
      expect(service.getPlayerGradeFromAverage(60)).toBe('A');
      expect(service.getPlayerGradeFromAverage(70)).toBe('A');
    });

    it('should return B for average 50-59', () => {
      expect(service.getPlayerGradeFromAverage(50)).toBe('B');
      expect(service.getPlayerGradeFromAverage(55)).toBe('B');
    });

    it('should return C for average <50', () => {
      expect(service.getPlayerGradeFromAverage(0)).toBe('C');
      expect(service.getPlayerGradeFromAverage(49)).toBe('C');
    });
  });

  describe('getColor', () => {
    it('should return correct colors', () => {
      expect(service.getColor('S')).toBe('#00D9C0');
      expect(service.getColor('A')).toBe('#22C55E');
      expect(service.getColor('B')).toBe('#FACC15');
      expect(service.getColor('C')).toBe('#F59E0B');
      expect(service.getColor('D')).toBe('#EF4444');
    });
  });

  describe('getLabel', () => {
    it('should return correct labels', () => {
      expect(service.getLabel('S')).toBe('Elite');
      expect(service.getLabel('A')).toBe('Excellent');
    });
  });

  describe('getPlayerGrade', () => {
    it('should calculate player grade from stats', () => {
      const players = createMockPlayers();
      const grade = service.getPlayerGrade(players[0], players);
      
      expect(['S', 'A', 'B', 'C']).toContain(grade);
    });
  });

  describe('formatGradeBadge', () => {
    it('should generate HTML badge', () => {
      const html = service.formatGradeBadge('A');
      expect(html).toContain('A');
      expect(html).toContain('#22C55E');
    });
  });
});
