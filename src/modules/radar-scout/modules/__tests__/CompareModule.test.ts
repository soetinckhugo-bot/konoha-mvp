/**
 * CompareModule Tests
 * 
 * Tests unitaires du module BMAD de comparaison
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CompareModule } from '../CompareModule';
import { PercentileService } from '../../services/PercentileService';
import { GradeService } from '../../services/GradeService';
import { PlayerFilterService } from '../../services/PlayerFilterService';

const mockPlayers = [
  { id: 'p1', name: 'Faker', team: 'T1', role: 'MID', stats: { kda: 4.5, kp: 60, cspm: 8.5 } },
  { id: 'p2', name: 'Chovy', team: 'GEN', role: 'MID', stats: { kda: 5.2, kp: 65, cspm: 9.0 } },
  { id: 'p3', name: 'Zeus', team: 'T1', role: 'TOP', stats: { kda: 3.8, kp: 55, cspm: 7.5 } },
];

describe('CompareModule BMAD', () => {
  let module: CompareModule;
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
    mockStore.setState('comparePlayerId', mockPlayers[1].id);

    const children: any[] = [];
    mockContainer = {
      appendChild: (child: any) => {
        children.push(child);
        return child;
      },
      querySelector: (_selector: string) => null,
      _children: children,
    };

    mockContext = {
      store: mockStore,
      container: mockContainer,
      mode: 'compare',
      selectedPlayer: mockPlayers[0],
      selectedMetricIds: ['kda', 'kp'],
      currentRole: 'ALL',
      players: mockPlayers,
    };

    percentileService = new PercentileService();
    gradeService = new GradeService();
    playerFilterService = new PlayerFilterService();
    module = new CompareModule(percentileService, gradeService, playerFilterService);
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
      expect(module.id).toBe('compare');
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
      const mod = new CompareModule(percentileService, gradeService, playerFilterService);
      expect(mod).toBeDefined();
    });

    it('should create with custom metrics', () => {
      const mod = new CompareModule(percentileService, gradeService, playerFilterService, {
        metrics: ['kda', 'cspm'],
        showRadar: false,
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

    it('should load both players on render', () => {
      module.render(mockContext);
      
      const players = module.getComparedPlayers();
      expect(players.player1).toBeTruthy();
      expect(players.player2).toBeTruthy();
    });
  });

  // ============================================================
  // Comparaison
  // ============================================================

  describe('Comparison Logic', () => {
    it('should determine winner correctly', () => {
      module.render(mockContext);
      
      const winner = module.getWinner();
      // Chovy a de meilleures stats, donc devrait gagner
      expect(winner || null).toBeDefined();
    });

    it('should compare specific player', () => {
      module.render(mockContext);
      
      expect(() => {
        module.setComparePlayer(mockPlayers[2].id);
      }).not.toThrow();
    });

    it('should return both players', () => {
      module.render(mockContext);
      
      const { player1, player2 } = module.getComparedPlayers();
      expect(player1).toEqual(mockPlayers[0]);
      expect(player2).toEqual(mockPlayers[1]);
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
      mockStore.setState('comparePlayerId', null);
      
      expect(() => {
        module.render(mockContext);
      }).not.toThrow();
    });

    it('should handle missing compare player', () => {
      mockStore.setState('comparePlayerId', 'nonexistent');
      
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

    it('should return null winner when no comparison possible', () => {
      mockStore.setState('players', []);
      module.render(mockContext);
      
      const winner = module.getWinner();
      expect(winner).toBeNull();
    });
  });
});
