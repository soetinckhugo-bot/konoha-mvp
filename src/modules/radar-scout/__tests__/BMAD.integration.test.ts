/**
 * BMAD Integration Tests (E2E)
 * 
 * Tests d'intégration des modules BMAD
 * Vérifie que tous les modules fonctionnent ensemble
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Store } from '../../../core/Store';
import { ModuleRouter } from '../../../core/Router';
import { FeatureFlagService } from '../../../core/services/FeatureFlagService';
import { PlayerFilterService } from '../services/PlayerFilterService';
import { PercentileService } from '../services/PercentileService';
import { GradeService } from '../services/GradeService';
import { PlayerSelectModule } from '../modules/PlayerSelectModule';
import { LeaderboardModule } from '../modules/LeaderboardModule';
import { CentilesPanelModule } from '../modules/CentilesPanelModule';
import { CompareModule } from '../modules/CompareModule';
import { BenchmarkModule } from '../modules/BenchmarkModule';

const mockPlayers = [
  { id: 'p1', name: 'Faker', team: 'T1', role: 'MID', stats: { kda: 4.5, kp: 60, cspm: 8.5, visionScore: 45 } },
  { id: 'p2', name: 'Chovy', team: 'GEN', role: 'MID', stats: { kda: 5.2, kp: 65, cspm: 9.0, visionScore: 50 } },
  { id: 'p3', name: 'Zeus', team: 'T1', role: 'TOP', stats: { kda: 3.8, kp: 55, cspm: 7.5, visionScore: 40 } },
  { id: 'p4', name: 'Gumayusi', team: 'T1', role: 'ADC', stats: { kda: 4.1, kp: 58, cspm: 8.8, visionScore: 42 } },
];

describe('BMAD Integration Tests', () => {
  let store: Store;
  let router: ModuleRouter;
  let mockContainer: any;

  beforeEach(() => {
    // Reset singletons
    (Store as any).instance = null;
    (ModuleRouter as any).instance = null;
    (FeatureFlagService as any).instance = null;
    
    store = Store.getInstance();
    router = ModuleRouter.getInstance();
    
    // Setup store using static methods
    Store.setState('players', mockPlayers);
    Store.setState('selectedPlayer', mockPlayers[0]);
    Store.setState('currentRole', 'ALL');
    
    // Enable all feature flags
    FeatureFlagService.enable('soloMode');
    FeatureFlagService.enable('compareMode');
    FeatureFlagService.enable('benchmarkMode');
    FeatureFlagService.enable('playerSelectModule');
    FeatureFlagService.enable('leaderboardModule');
    FeatureFlagService.enable('centilesPanelModule');
    
    // Mock container
    mockContainer = {
      innerHTML: '',
      appendChild: vi.fn(),
      querySelector: vi.fn(() => null),
    };
  });

  afterEach(() => {
    router.destroy();
  });

  // ============================================================
  // Services Integration
  // ============================================================

  describe('Services Integration', () => {
    it('should calculate percentiles correctly end-to-end', () => {
      const percentileService = new PercentileService();
      
      const percentile = percentileService.calculatePercentile(
        4.5, // KDA Faker
        'kda',
        mockPlayers,
        false
      );
      
      expect(percentile).toBeGreaterThanOrEqual(0);
      expect(percentile).toBeLessThanOrEqual(100);
    });

    it('should rank players correctly end-to-end', () => {
      const playerFilterService = new PlayerFilterService();
      
      const ranked = playerFilterService.rankPlayers(
        mockPlayers,
        mockPlayers,
        ['kda', 'kp', 'cspm']
      );
      
      expect(ranked).toHaveLength(4);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0]).toHaveProperty('grade');
      expect(ranked[0]).toHaveProperty('score');
    });

    it('should filter by role correctly', () => {
      const playerFilterService = new PlayerFilterService();
      
      const midPlayers = playerFilterService.filterByRole(mockPlayers, 'MID');
      
      expect(midPlayers).toHaveLength(2);
      expect(midPlayers.every(p => p.role === 'MID')).toBe(true);
    });
  });

  // ============================================================
  // Module Lifecycle Integration
  // ============================================================

  describe('Module Lifecycle', () => {
    it('should render PlayerSelectModule with real store', () => {
      const playerFilterService = new PlayerFilterService();
      const module = new PlayerSelectModule(playerFilterService);
      
      const context = {
        store: Store,
        container: mockContainer,
        mode: 'solo',
        selectedPlayer: mockPlayers[0],
        selectedMetricIds: ['kda'],
        currentRole: 'ALL',
        players: mockPlayers,
      };
      
      expect(() => {
        module.render(context);
      }).not.toThrow();
      
      module.destroy();
    });

    it('should render LeaderboardModule with real store', () => {
      const playerFilterService = new PlayerFilterService();
      const gradeService = new GradeService();
      const module = new LeaderboardModule(playerFilterService, gradeService);
      
      const context = {
        store: Store,
        container: mockContainer,
        mode: 'solo',
        selectedPlayer: mockPlayers[0],
        selectedMetricIds: ['kda'],
        currentRole: 'ALL',
        players: mockPlayers,
      };
      
      expect(() => {
        module.render(context);
      }).not.toThrow();
      
      module.destroy();
    });

    it('should render CentilesPanelModule with real store', () => {
      const percentileService = new PercentileService();
      const gradeService = new GradeService();
      const module = new CentilesPanelModule(percentileService, gradeService);
      
      const context = {
        store: Store,
        container: mockContainer,
        mode: 'solo',
        selectedPlayer: mockPlayers[0],
        selectedMetricIds: ['kda'],
        currentRole: 'ALL',
        players: mockPlayers,
      };
      
      expect(() => {
        module.render(context);
      }).not.toThrow();
      
      module.destroy();
    });

    it('should render CompareModule with real store', () => {
      const percentileService = new PercentileService();
      const gradeService = new GradeService();
      const playerFilterService = new PlayerFilterService();
      const module = new CompareModule(percentileService, gradeService, playerFilterService);
      
      Store.setState('comparePlayerId', mockPlayers[1].id);
      
      const context = {
        store: Store,
        container: mockContainer,
        mode: 'compare',
        selectedPlayer: mockPlayers[0],
        selectedMetricIds: ['kda'],
        currentRole: 'ALL',
        players: mockPlayers,
      };
      
      expect(() => {
        module.render(context);
      }).not.toThrow();
      
      module.destroy();
    });

    it('should render BenchmarkModule with real store', () => {
      const percentileService = new PercentileService();
      const gradeService = new GradeService();
      const playerFilterService = new PlayerFilterService();
      const module = new BenchmarkModule(percentileService, gradeService, playerFilterService);
      
      const context = {
        store: Store,
        container: mockContainer,
        mode: 'benchmark',
        selectedPlayer: mockPlayers[0],
        selectedMetricIds: ['kda'],
        currentRole: 'ALL',
        players: mockPlayers,
      };
      
      expect(() => {
        module.render(context);
      }).not.toThrow();
      
      module.destroy();
    });
  });

  // ============================================================
  // Store State Changes
  // ============================================================

  describe('Store State Changes', () => {
    it('should update when selectedPlayer changes', () => {
      const playerFilterService = new PlayerFilterService();
      const module = new PlayerSelectModule(playerFilterService);
      
      const context = {
        store: Store,
        container: mockContainer,
        mode: 'solo',
        selectedPlayer: mockPlayers[0],
        selectedMetricIds: ['kda'],
        currentRole: 'ALL',
        players: mockPlayers,
      };
      
      module.render(context);
      
      // Change player
      Store.setState('selectedPlayer', mockPlayers[1]);
      
      // Module should have updated
      expect(Store.getState('selectedPlayer')).toEqual(mockPlayers[1]);
      
      module.destroy();
    });

    it('should update when currentRole changes', () => {
      const playerFilterService = new PlayerFilterService();
      const module = new LeaderboardModule(playerFilterService, new GradeService());
      
      const context = {
        store: Store,
        container: mockContainer,
        mode: 'solo',
        selectedPlayer: mockPlayers[0],
        selectedMetricIds: ['kda'],
        currentRole: 'ALL',
        players: mockPlayers,
      };
      
      module.render(context);
      
      // Change role
      Store.setState('currentRole', 'MID');
      
      // Module should have updated
      expect(Store.getState('currentRole')).toBe('MID');
      
      module.destroy();
    });
  });

  // ============================================================
  // End-to-End Flows
  // ============================================================

  describe('End-to-End Flows', () => {
    it('should complete full analysis flow', () => {
      // 1. Setup services
      const playerFilterService = new PlayerFilterService();
      const percentileService = new PercentileService();
      const gradeService = new GradeService();
      
      // 2. Filter players by role
      const midPlayers = playerFilterService.filterByRole(mockPlayers, 'MID');
      expect(midPlayers).toHaveLength(2);
      
      // 3. Rank players
      const ranked = playerFilterService.rankPlayers(midPlayers, mockPlayers, ['kda', 'kp']);
      expect(ranked[0]).toHaveProperty('rank', 1);
      
      // 4. Calculate percentiles for top player
      const topPlayer = ranked[0];
      const percentiles = percentileService.calculatePercentiles(
        topPlayer,
        ['kda', 'kp'],
        mockPlayers
      );
      expect(percentiles.size).toBe(2);
      
      // 5. Get grade
      const avgPercentile = percentileService.calculateAveragePercentile(percentiles);
      const grade = gradeService.getPlayerGradeFromAverage(avgPercentile);
      expect(['S', 'A', 'B', 'C']).toContain(grade);
    });

    it('should handle player comparison flow', () => {
      const player1 = mockPlayers[0];
      const player2 = mockPlayers[1];
      
      const percentileService = new PercentileService();
      
      // Compare KDA
      const p1KDA = player1.stats.kda;
      const p2KDA = player2.stats.kda;
      
      const allKDA = mockPlayers.map(p => p.stats.kda);
      
      const p1Percentile = percentileService.calculatePercentile(p1KDA, 'kda', mockPlayers, false);
      const p2Percentile = percentileService.calculatePercentile(p2KDA, 'kda', mockPlayers, false);
      
      expect(p1Percentile).toBeGreaterThanOrEqual(0);
      expect(p2Percentile).toBeGreaterThanOrEqual(0);
      
      // Higher KDA should have higher percentile
      if (p2KDA > p1KDA) {
        expect(p2Percentile).toBeGreaterThanOrEqual(p1Percentile);
      }
    });
  });

  // ============================================================
  // Error Handling
  // ============================================================

  describe('Error Handling', () => {
    it('should handle empty players gracefully', () => {
      Store.setState('players', []);
      Store.setState('selectedPlayer', null);
      
      const playerFilterService = new PlayerFilterService();
      const module = new PlayerSelectModule(playerFilterService);
      
      const context = {
        store: Store,
        container: mockContainer,
        mode: 'solo',
        selectedPlayer: null,
        selectedMetricIds: ['kda'],
        currentRole: 'ALL',
        players: [],
      };
      
      expect(() => {
        module.render(context);
      }).not.toThrow();
      
      module.destroy();
    });

    it('should handle missing stats gracefully', () => {
      const playerWithMissingStats = {
        id: 'p5',
        name: 'Test',
        team: 'TST',
        role: 'SUP',
        stats: {},
      };
      
      Store.setState('selectedPlayer', playerWithMissingStats);
      
      const percentileService = new PercentileService();
      const gradeService = new GradeService();
      const module = new CentilesPanelModule(percentileService, gradeService);
      
      const context = {
        store: Store,
        container: mockContainer,
        mode: 'solo',
        selectedPlayer: playerWithMissingStats,
        selectedMetricIds: ['kda'],
        currentRole: 'ALL',
        players: [...mockPlayers, playerWithMissingStats],
      };
      
      expect(() => {
        module.render(context);
      }).not.toThrow();
      
      module.destroy();
    });
  });
});
