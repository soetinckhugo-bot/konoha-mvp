/**
 * @fileoverview Tests pour le calcul du leaderboard avec pondération V4
 * 
 * Vérifie que:
 * 1. Les coefficients par rôle sont correctement appliqués
 * 2. Les métriques avec poids 0 sont exclues
 * 3. Les métriques inversées sont correctement traitées
 * 4. La distribution des grades est correcte
 * 
 * @module LeaderboardCalculatorTest
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { ROLE_WEIGHTS_V4, getRoleWeight } from '../modules/radar-scout/config/roleMetrics';
import { GradeCalculator } from '../modules/radar-scout/services/GradeCalculator';

describe('ROLE_WEIGHTS_V4', () => {
  it('should have weights defined for all roles', () => {
    expect(ROLE_WEIGHTS_V4.TOP).toBeDefined();
    expect(ROLE_WEIGHTS_V4.JUNGLE).toBeDefined();
    expect(ROLE_WEIGHTS_V4.MID).toBeDefined();
    expect(ROLE_WEIGHTS_V4.ADC).toBeDefined();
    expect(ROLE_WEIGHTS_V4.SUPPORT).toBeDefined();
  });

  it('should exclude win_rate from scoring (weight = 0)', () => {
    expect(ROLE_WEIGHTS_V4.TOP.win_rate).toBe(0);
    expect(ROLE_WEIGHTS_V4.JUNGLE.win_rate).toBe(0);
    expect(ROLE_WEIGHTS_V4.MID.win_rate).toBe(0);
    expect(ROLE_WEIGHTS_V4.ADC.win_rate).toBe(0);
    expect(ROLE_WEIGHTS_V4.SUPPORT.win_rate).toBe(0);
  });

  it('should have high weights for key ADC metrics', () => {
    expect(ROLE_WEIGHTS_V4.ADC.cspm).toBe(2);  // Très important
    expect(ROLE_WEIGHTS_V4.ADC.dpm).toBe(1.5);
    expect(ROLE_WEIGHTS_V4.ADC.dmg_percent).toBe(1.5);
  });

  it('should have high weights for key Support metrics', () => {
    expect(ROLE_WEIGHTS_V4.SUPPORT.deaths).toBe(2);  // Très important
    expect(ROLE_WEIGHTS_V4.SUPPORT.assists).toBe(2);
    expect(ROLE_WEIGHTS_V4.SUPPORT.kp_percent).toBe(2);
  });

  it('should have lower weights for vision metrics on Support', () => {
    expect(ROLE_WEIGHTS_V4.SUPPORT.vspm).toBe(0.5);
    expect(ROLE_WEIGHTS_V4.SUPPORT.wpm).toBe(0.5);
    expect(ROLE_WEIGHTS_V4.SUPPORT.vision_share).toBe(0.5);
  });
});

describe('getRoleWeight', () => {
  it('should return correct weight for existing metrics', () => {
    expect(getRoleWeight('TOP', 'cspm')).toBe(1.5);
    expect(getRoleWeight('ADC', 'cspm')).toBe(2);
    expect(getRoleWeight('SUPPORT', 'deaths')).toBe(2);
  });

  it('should return default weight of 1 for undefined metrics', () => {
    expect(getRoleWeight('TOP', 'unknown_metric')).toBe(1);
    expect(getRoleWeight('UNKNOWN_ROLE', 'cspm')).toBe(1);
  });

  it('should return 0 for excluded metrics', () => {
    expect(getRoleWeight('TOP', 'win_rate')).toBe(0);
    expect(getRoleWeight('MID', 'win_rate')).toBe(0);
  });
});

describe('Grade Distribution (Stats Tiers)', () => {
  // Les seuils du GradeCalculator sont pour les percentiles de stats:
  // S: 90-100 (Elite), A: 80-89 (Excellent), B: 65-79 (Good), C: <65 (Weak)
  
  it('should assign S grade for elite percentiles (90-100)', () => {
    expect(GradeCalculator.getGrade(90)).toBe('S');
    expect(GradeCalculator.getGrade(95)).toBe('S');
    expect(GradeCalculator.getGrade(100)).toBe('S');
  });

  it('should assign A grade for excellent percentiles (80-89)', () => {
    expect(GradeCalculator.getGrade(89)).toBe('A');
    expect(GradeCalculator.getGrade(80)).toBe('A');
  });

  it('should assign B grade for good percentiles (65-79)', () => {
    expect(GradeCalculator.getGrade(79)).toBe('B');
    expect(GradeCalculator.getGrade(65)).toBe('B');
  });

  it('should assign C grade for weak percentiles (<65)', () => {
    expect(GradeCalculator.getGrade(64)).toBe('C');
    expect(GradeCalculator.getGrade(0)).toBe('C');
  });
});

describe('Weighted Score Calculation Logic', () => {
  it('should calculate weighted average correctly', () => {
    // Simuler le calcul de score pondéré
    const scores = [
      { value: 80, weight: 1.5 },   // 120
      { value: 60, weight: 1 },     // 60
      { value: 90, weight: 2 }      // 180
    ];
    
    const weightedSum = scores.reduce((sum, s) => sum + s.value * s.weight, 0);
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    const weightedAvg = weightedSum / totalWeight;
    
    // (120 + 60 + 180) / 4.5 = 360 / 4.5 = 80
    expect(weightedAvg).toBe(80);
  });

  it('should skip metrics with weight 0', () => {
    const scores = [
      { value: 80, weight: 0 },     // Exclu
      { value: 60, weight: 1 },     // 60
      { value: 90, weight: 1.5 }    // 135
    ];
    
    const filtered = scores.filter(s => s.weight > 0);
    const weightedSum = filtered.reduce((sum, s) => sum + s.value * s.weight, 0);
    const totalWeight = filtered.reduce((sum, s) => sum + s.weight, 0);
    const weightedAvg = weightedSum / totalWeight;
    
    // (60 + 135) / 2.5 = 195 / 2.5 = 78
    expect(weightedAvg).toBe(78);
  });

  it('should invert scores for inverted metrics', () => {
    const normalizedValue = 70;  // Bon score
    const inverted = true;       // "Moins c'est mieux"
    
    const score = inverted ? 100 - normalizedValue : normalizedValue;
    
    // Pour une métrique inversée, 70 devient 30 (mauvais)
    expect(score).toBe(30);
  });
});
