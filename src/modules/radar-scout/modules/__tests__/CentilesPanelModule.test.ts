/**
 * CentilesPanelModule Tests
 * 
 * Tests unitaires du module BMAD d'affichage des centiles
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CentilesPanelModule } from '../CentilesPanelModule';
import { PercentileService } from '../../services/PercentileService';
import { GradeService } from '../../services/GradeService';

const mockPlayers = [
  { id: 'p1', name: 'Faker', team: 'T1', role: 'MID', stats: { kda: 4.5, kp: 60, cspm: 8.5, visionScore: 45 } },
  { id: 'p2', name: 'Chovy', team: 'GEN', role: 'MID', stats: { kda: 5.2, kp: 65, cspm: 9.0, visionScore: 50 } },
];

describe('CentilesPanelModule BMAD', () => {
  let module: CentilesPanelModule;
  let percentileService: PercentileService;
  let gradeService: GradeService;
  let mockContainer: any;
  let mockStore: any;
  let mockContext: any;

  beforeEach(() => {
    const state = new Map();
    mockStore = {
      getState: vi.fn((key: string) => state.get(key)),
      setState: vi.fn((key: string, value: any) => state.set(key, value)),
      subscribe: vi.fn(() => vi.fn()),
    };
    
    mockStore.setState('players', mockPlayers);
    mockStore.setState('selectedPlayer', mockPlayers[0]);

    const children: any[] = [];
    mockContainer = {
      appendChild: (child: any) => {
        children.push(child);
        return child;
      },
      querySelector: (_selector: string) => null,
      querySelectorAll: (_selector: string) => [],
      _children: children,
    };

    mockContext = {
      store: mockStore,
      container: mockContainer,
      mode: 'solo',
      selectedPlayer: mockPlayers[0],
      selectedMetricIds: ['kda', 'kp'],
      currentRole: 'ALL',
      players: mockPlayers,
    };

    percentileService = new PercentileService();
    gradeService = new GradeService();
    module = new CentilesPanelModule(percentileService, gradeService);
  });

  afterEach(() => {
    if (module) {
      module.destroy();
    }
  });

  // ============================================================
  // Interface BMAD
  // ============================================================

  describe('Interface BMAD', () => {
    it('should have correct module id', () => {
      expect(module.id).toBe('centiles-panel');
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

  // ============================================================
  // Configuration
  // ============================================================

  describe('Configuration', () => {
    it('should create with default config', () => {
      const mod = new CentilesPanelModule(percentileService, gradeService);
      expect(mod).toBeDefined();
    });

    it('should create with custom categories', () => {
      const mod = new CentilesPanelModule(percentileService, gradeService, {
        categories: ['fight', 'vision'],
        showGrade: false,
      });
      expect(mod).toBeDefined();
    });
  });

  // ============================================================
  // Render
  // ============================================================

  describe('render()', () => {
    it('should create module container', () => {
      module.render(mockContext);
      
      expect(mockContainer._children.length).toBeGreaterThan(0);
    });

    it('should subscribe to store changes', () => {
      module.render(mockContext);
      
      expect(mockStore.subscribe).toHaveBeenCalledWith('selectedPlayer', expect.any(Function));
      expect(mockStore.subscribe).toHaveBeenCalledWith('players', expect.any(Function));
    });

    it('should create panels for each category', () => {
      module = new CentilesPanelModule(percentileService, gradeService, {
        categories: ['fight', 'vision'],
      });
      module.render(mockContext);
      
      // Container créé
      expect(mockContainer._children.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // API Publique
  // ============================================================

  describe('Public API', () => {
    it('should change categories', () => {
      module.render(mockContext);
      
      expect(() => {
        module.setCategories(['fight']);
      }).not.toThrow();
    });

    it('should get metrics by category', () => {
      module.render(mockContext);
      
      const fightMetrics = module.getMetricsByCategory('fight');
      expect(fightMetrics.length).toBeGreaterThan(0);
      expect(fightMetrics.every(m => m.category === 'fight')).toBe(true);
    });
  });

  // ============================================================
  // Destroy
  // ============================================================

  describe('destroy()', () => {
    it('should cleanup without error', () => {
      module.render(mockContext);
      
      expect(() => {
        module.destroy();
      }).not.toThrow();
    });

    it('should be callable multiple times safely', () => {
      module.render(mockContext);
      
      expect(() => {
        module.destroy();
        module.destroy();
      }).not.toThrow();
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('Edge Cases', () => {
    it('should handle no selected player', () => {
      mockStore.setState('selectedPlayer', null);
      
      expect(() => {
        module.render(mockContext);
      }).not.toThrow();
    });

    it('should handle empty player list', () => {
      mockStore.setState('players', []);
      
      expect(() => {
        module.render(mockContext);
      }).not.toThrow();
    });

    it('should handle player with missing stats', () => {
      mockStore.setState('selectedPlayer', {
        id: 'p3',
        name: 'Test',
        stats: {},
      });
      
      expect(() => {
        module.render(mockContext);
      }).not.toThrow();
    });
  });
});
