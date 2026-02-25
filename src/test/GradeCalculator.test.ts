/**
 * @fileoverview Tests for GradeCalculator
 * BMAD Phase 4: Testing
 */

import { describe, it, expect } from 'vitest';
import { GradeCalculator } from '../modules/radar-scout/services/GradeCalculator';

describe('GradeCalculator', () => {
  describe('getGrade', () => {
    it('should return S for percentile 90-100', () => {
      expect(GradeCalculator.getGrade(90)).toBe('S');
      expect(GradeCalculator.getGrade(95)).toBe('S');
      expect(GradeCalculator.getGrade(99)).toBe('S');
      expect(GradeCalculator.getGrade(100)).toBe('S');
    });

    it('should return A for percentile 80-89', () => {
      expect(GradeCalculator.getGrade(80)).toBe('A');
      expect(GradeCalculator.getGrade(85)).toBe('A');
      expect(GradeCalculator.getGrade(89)).toBe('A');
    });

    it('should return B for percentile 65-79', () => {
      expect(GradeCalculator.getGrade(65)).toBe('B');
      expect(GradeCalculator.getGrade(70)).toBe('B');
      expect(GradeCalculator.getGrade(79)).toBe('B');
    });

    it('should return C for percentile 50-64', () => {
      expect(GradeCalculator.getGrade(64)).toBe('C');
      expect(GradeCalculator.getGrade(50)).toBe('C');
    });

    it('should handle edge cases at boundaries', () => {
      // At exact boundaries
      expect(GradeCalculator.getGrade(90)).toBe('S'); // S threshold
      expect(GradeCalculator.getGrade(80)).toBe('A'); // A threshold
      expect(GradeCalculator.getGrade(65)).toBe('B'); // B threshold
    });
  });

  describe('getGradeColor', () => {
    it('should return correct color for S grade', () => {
      expect(GradeCalculator.getGradeColor('S')).toBe('#00D9C0');
    });

    it('should return correct color for A grade', () => {
      expect(GradeCalculator.getGradeColor('A')).toBe('#4ADE80');
    });

    it('should return correct color for B grade', () => {
      expect(GradeCalculator.getGradeColor('B')).toBe('#FACC15');
    });

    it('should return correct color for C grade', () => {
      expect(GradeCalculator.getGradeColor('C')).toBe('#FB923C');
    });
  });

  describe('getGradeLabel', () => {
    it('should return "Elite" for S grade', () => {
      expect(GradeCalculator.getGradeLabel('S')).toBe('Elite');
    });

    it('should return "Excellent" for A grade', () => {
      expect(GradeCalculator.getGradeLabel('A')).toBe('Excellent');
    });

    it('should return "Good" for B grade', () => {
      expect(GradeCalculator.getGradeLabel('B')).toBe('Good');
    });

    it('should return "Average" for C grade', () => {
      expect(GradeCalculator.getGradeLabel('C')).toBe('Average');
    });
  });

  describe('grade boundaries consistency', () => {
    it('should have no gaps between grades', () => {
      // Every percentile should map to exactly one grade
      for (let p = 0; p <= 100; p++) {
        const grade = GradeCalculator.getGrade(p);
        expect(['S', 'A', 'B', 'C']).toContain(grade);
      }
    });

    it('should have consistent total coverage', () => {
      const grades = [];
      for (let p = 0; p <= 100; p++) {
        grades.push(GradeCalculator.getGrade(p));
      }
      
      // S: 90-100 (11 values)
      // A: 80-89 (10 values)
      // B: 65-79 (15 values)
      // C: 0-64 (65 values, includes D which is mapped to C by getGrade)
      expect(grades.filter(g => g === 'S').length).toBe(11);
      expect(grades.filter(g => g === 'A').length).toBe(10);
      expect(grades.filter(g => g === 'B').length).toBe(15);
      expect(grades.filter(g => g === 'C').length).toBe(65);
    });
  });
});
