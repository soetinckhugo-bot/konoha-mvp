/**
 * RadarChartModule Tests - Version simplifiée
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RadarChartModule } from '../RadarChartModule';
import { PercentileService } from '../../services/PercentileService';
import { GradeService } from '../../services/GradeService';

describe('RadarChartModule BMAD', () => {
  let module: RadarChartModule;
  let percentileService: PercentileService;
  let gradeService: GradeService;

  beforeEach(() => {
    percentileService = new PercentileService();
    gradeService = new GradeService();
    module = new RadarChartModule(percentileService, gradeService);
  });

  afterEach(() => {
    if (module) {
      try {
        module.destroy();
      } catch (e) {
        // Ignore
      }
    }
  });

  describe('Interface BMAD', () => {
    it('should have correct module id', () => {
      expect(module.id).toBe('radar-chart');
    });

    it('should implement render method', () => {
      expect(typeof module.render).toBe('function');
    });

    it('should implement update method', () => {
      expect(typeof module.update).toBe('function');
    });

    it('should implement destroy method', () => {
      expect(typeof module.destroy).toBe('function');
    });
  });

  describe('Configuration', () => {
    it('should create with default config', () => {
      const mod = new RadarChartModule(percentileService, gradeService);
      expect(mod).toBeDefined();
    });

    it('should create with custom config', () => {
      const mod = new RadarChartModule(percentileService, gradeService, {
        showExport: false,
        animation: false,
        metrics: ['kda', 'kp'],
      });
      expect(mod).toBeDefined();
    });
  });

  describe('API', () => {
    it('should be instantiable', () => {
      expect(module).toBeInstanceOf(RadarChartModule);
    });
  });
});
