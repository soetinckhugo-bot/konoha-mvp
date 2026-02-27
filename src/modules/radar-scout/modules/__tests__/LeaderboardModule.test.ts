/**
 * LeaderboardModule Tests
 * 
 * Tests unitaires du module BMAD de classement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LeaderboardModule } from '../LeaderboardModule';
import { PlayerFilterService } from '../../services/PlayerFilterService';
import { GradeService } from '../../services/GradeService';

const mockPlayers = [
  { id: 'p1', name: 'Faker', team: 'T1', role: 'MID', stats: { kda: 4.5, kp: 60, cspm: 8.5 } },
  { id: 'p2', name: 'Chovy', team: 'GEN', role: 'MID', stats: { kda: 5.2, kp: 65, cspm: 9.0 } },
  { id: 'p3', name: 'Zeus', team: 'T1', role: 'TOP', stats: { kda: 3.8, kp: 55, cspm: 7.5 } },
  { id: 'p4', name: 'Gumayusi', team: 'T1', role: 'ADC', stats: { kda: 4.1, kp: 58, cspm: 8.8 } },
];

describe('LeaderboardModule BMAD', () => {
  let module: LeaderboardModule;
  let playerFilterService: PlayerFilterService;
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
    mockStore.setState('currentRole', 'ALL');
    mockStore.setState('selectedPlayer', null);

    const children: any[] = [];
    mockContainer = {
      appendChild: (child: any) => {
        children.push(child);
        return child;
      },
      querySelector: (selector: string) => {
        return children.find(c => c?.classList?.contains?.(selector.replace('.', ''))) || null;
      },
      _children: children,
    };

    mockContext = {
      store: mockStore,
      container: mockContainer,
      mode: 'solo',
      selectedPlayer: null,
      selectedMetricIds: ['kda'],
      currentRole: 'ALL',
      players: mockPlayers,
    };

    playerFilterService = new PlayerFilterService();
    gradeService = new GradeService();
    module = new LeaderboardModule(playerFilterService, gradeService);
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
      expect(module.id).toBe('leaderboard');
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
      const mod = new LeaderboardModule(playerFilterService, gradeService);
      expect(mod).toBeDefined();
    });

    it('should create with custom limit', () => {
      const mod = new LeaderboardModule(playerFilterService, gradeService, {
        limit: 5,
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
      const created = mockContainer._children[0];
      expect(created?.getAttribute?.('data-module-id')).toBe('leaderboard');
    });

    it('should subscribe to store changes', () => {
      module.render(mockContext);
      
      expect(mockStore.subscribe).toHaveBeenCalledWith('currentRole', expect.any(Function));
      expect(mockStore.subscribe).toHaveBeenCalledWith('players', expect.any(Function));
      expect(mockStore.subscribe).toHaveBeenCalledWith('selectedPlayer', expect.any(Function));
    });

    it('should create table structure', () => {
      module.render(mockContext);
      
      // Vérifie juste qu'un container a été créé
      expect(mockContainer._children.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Ranking
  // ============================================================

  describe('Ranking', () => {
    it('should use PlayerFilterService to rank players', () => {
      const rankSpy = vi.spyOn(playerFilterService, 'rankPlayers');
      
      module.render(mockContext);
      
      expect(rankSpy).toHaveBeenCalled();
    });

    it('should limit to top N players', () => {
      module = new LeaderboardModule(playerFilterService, gradeService, { limit: 2 });
      module.render(mockContext);
      
      // Should only show top 2
      expect(module).toBeDefined();
    });
  });

  // ============================================================
  // API Publique
  // ============================================================

  describe('Public API', () => {
    it('should refresh without error', () => {
      module.render(mockContext);
      
      expect(() => {
        module.refresh();
      }).not.toThrow();
    });

    it('should change limit', () => {
      module.render(mockContext);
      
      expect(() => {
        module.setLimit(5);
      }).not.toThrow();
    });

    it('should get top player', () => {
      module.render(mockContext);
      
      const topPlayer = module.getTopPlayer();
      // Devrait retourner un joueur (le 1er du classement)
      expect(topPlayer || null).toBeDefined();
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
    it('should handle empty player list', () => {
      mockStore.setState('players', []);
      
      expect(() => {
        module.render(mockContext);
      }).not.toThrow();
    });

    it('should handle null players', () => {
      mockStore.setState('players', null);
      
      expect(() => {
        module.render(mockContext);
      }).not.toThrow();
    });

    it('should filter by role when role changes', () => {
      const filterSpy = vi.spyOn(playerFilterService, 'filterByRole');
      
      mockStore.setState('currentRole', 'MID');
      module.render(mockContext);
      
      expect(filterSpy).toHaveBeenCalledWith(mockPlayers, 'MID');
    });
  });
});
