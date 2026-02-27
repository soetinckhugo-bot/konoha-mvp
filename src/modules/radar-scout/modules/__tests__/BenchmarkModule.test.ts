/**
 * BenchmarkModule Tests
 * 
 * Tests unitaires du module BMAD de benchmark
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BenchmarkModule } from '../BenchmarkModule';
import { PercentileService } from '../../services/PercentileService';
import { GradeService } from '../../services/GradeService';
import { PlayerFilterService } from '../../services/PlayerFilterService';

const mockPlayers = [
  { id: 'p1', name: 'Faker', team: 'T1', role: 'MID', stats: { kda: 4.5, kp: 60, cspm: 8.5 } },
  { id: 'p2', name: 'Chovy', team: 'GEN', role: 'MID', stats: { kda: 5.2, kp: 65, cspm: 9.0 } },
  { id: 'p3', name: 'Zeus', team: 'T1', role: 'TOP', stats: { kda: 3.8, kp: 55, cspm: 7.5 } },
];

describe('BenchmarkModule BMAD', () => {
  let module: BenchmarkModule;
  let percentileService: PercentileService;
  let gradeService: GradeService;
  let playerFilterService: PlayerFilterService;
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
    mockStore.setState('currentRole', 'ALL');

    const children: any[] = [];
    mockContainer = {
      appendChild: (child: any) => {
        children.push(child);
        return child;
      },
      querySelector: (selector: string) => null,
      _children: children,
    };

    mockContext = {
      store: mockStore,
      container: mockContainer,
      mode: 'benchmark',
      selectedPlayer: mockPlayers[0],
      selectedMetricIds: ['kda', 'kp'],
      currentRole: 'ALL',
      players: mockPlayers,
    };

    percentileService = new PercentileService();
    gradeService = new GradeService();
    playerFilterService = new PlayerFilterService();
    module = new BenchmarkModule(percentileService, gradeService, playerFilterService);
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
      expect(module.id).toBe('benchmark');
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
      expect(mockStore.subscribe).toHaveBeenCalledWith('currentRole', expect.any(Function));
    });

    it('should render with selected player', () => {
      module.render(mockContext);
      
      expect(mockContainer._children.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // API Publique
  // ============================================================

  describe('Public API', () => {
    it('should calculate differential for metric', () => {
      module.render(mockContext);
      
      const diff = module.getDifferential(mockPlayers[0], 'kda');
      expect(diff).toHaveProperty('value');
      expect(diff).toHaveProperty('percent');
    });

    it('should get player score', () => {
      module.render(mockContext);
      
      const score = module.getPlayerScore(mockPlayers[0]);
      expect(score).toHaveProperty('percentile');
      expect(score).toHaveProperty('grade');
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

    it('should handle single player', () => {
      mockStore.setState('players', [mockPlayers[0]]);
      
      expect(() => {
        module.render(mockContext);
      }).not.toThrow();
    });
  });
});
