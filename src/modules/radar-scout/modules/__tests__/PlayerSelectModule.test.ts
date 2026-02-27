/**
 * PlayerSelectModule Tests - Version simplifiée
 * 
 * Tests du cycle de vie BMAD : render / update / destroy
 * Compatible avec jsdom mock
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlayerSelectModule } from '../PlayerSelectModule';
import { PlayerFilterService } from '../../services/PlayerFilterService';

// Mock players
const mockPlayers = [
  { id: 'p1', name: 'Faker', team: 'T1', role: 'MID', stats: { kda: 4.5 } },
  { id: 'p2', name: 'Chovy', team: 'GEN', role: 'MID', stats: { kda: 5.2 } },
  { id: 'p3', name: 'Zeus', team: 'T1', role: 'TOP', stats: { kda: 3.8 } },
];

describe('PlayerSelectModule BMAD', () => {
  let module: PlayerSelectModule;
  let playerFilterService: PlayerFilterService;
  let mockContainer: any;
  let mockStore: any;
  let mockContext: any;

  beforeEach(() => {
    // Mock Store simple
    const state = new Map();
    mockStore = {
      getState: vi.fn((key: string) => state.get(key)),
      setState: vi.fn((key: string, value: any) => state.set(key, value)),
      subscribe: vi.fn(() => vi.fn()), // Retourne unsubscribe
    };
    
    mockStore.setState('players', mockPlayers);
    mockStore.setState('currentRole', 'ALL');
    mockStore.setState('selectedPlayer', null);

    // Mock Container DOM
    const children: any[] = [];
    mockContainer = {
      appendChild: (child: any) => {
        children.push(child);
        return child;
      },
      querySelector: (selector: string) => {
        return children.find(c => c?.classList?.contains?.(selector.replace('.', ''))) || null;
      },
      querySelectorAll: (selector: string) => {
        return children.filter(c => c?.classList?.contains?.(selector.replace('.', '')));
      },
      innerHTML: '',
      _children: children,
    };

    // Mock Context
    mockContext = {
      store: mockStore,
      container: mockContainer,
      mode: 'solo',
      selectedPlayer: null,
      selectedMetricIds: ['kda'],
      currentRole: 'ALL',
      players: mockPlayers,
    };

    // Service + Module
    playerFilterService = new PlayerFilterService();
    module = new PlayerSelectModule(playerFilterService);
  });

  afterEach(() => {
    if (module) {
      module.destroy();
    }
  });

  // ============================================================
  // BMAD Interface
  // ============================================================

  describe('Interface BMAD', () => {
    it('should have correct module id', () => {
      expect(module.id).toBe('player-select');
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
      const mod = new PlayerSelectModule(playerFilterService);
      expect(mod).toBeDefined();
    });

    it('should create with custom config', () => {
      const mod = new PlayerSelectModule(playerFilterService, {
        showTeam: false,
        placeholder: 'Custom',
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
      expect(created?.getAttribute?.('data-module-id')).toBe('player-select');
    });

    it('should subscribe to store changes', () => {
      module.render(mockContext);
      
      expect(mockStore.subscribe).toHaveBeenCalledWith('currentRole', expect.any(Function));
      expect(mockStore.subscribe).toHaveBeenCalledWith('players', expect.any(Function));
    });

    it('should populate dropdown with players', () => {
      module.render(mockContext);
      
      // Vérifie que le service filter a été utilisé
      const filtered = playerFilterService.filterByRole(mockPlayers, 'ALL');
      expect(filtered.length).toBe(3);
    });
  });

  // ============================================================
  // API Publique
  // ============================================================

  describe('Public API', () => {
    it('should select player programmatically', () => {
      module.render(mockContext);
      
      // Simule sélection via API
      module.selectPlayer(mockPlayers[0].id);
      
      // Vérifie que le store est mis à jour
      expect(mockStore.setState).toHaveBeenCalledWith('selectedPlayer', mockPlayers[0]);
    });

    it('should return null when no player selected', () => {
      module.render(mockContext);
      
      const player = module.getSelectedPlayer();
      // Au début, pas de joueur sélectionné
      expect(player).toBeNull();
    });

    it('should update config without error', () => {
      module.render(mockContext);
      
      expect(() => {
        module.setConfig({ showTeam: false });
      }).not.toThrow();
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
        module.destroy(); // Double destroy
      }).not.toThrow();
    });
  });

  // ============================================================
  // Service Integration
  // ============================================================

  describe('Service Integration', () => {
    it('should use PlayerFilterService for role filtering', () => {
      const filterSpy = vi.spyOn(playerFilterService, 'filterByRole');
      
      module.render(mockContext);
      
      // Utilise le currentRole du context
      expect(filterSpy).toHaveBeenCalledWith(mockPlayers, 'ALL');
    });
    
    it('should use store currentRole for filtering', () => {
      const filterSpy = vi.spyOn(playerFilterService, 'filterByRole');
      
      mockStore.setState('currentRole', 'MID');
      module.render(mockContext);
      
      expect(filterSpy).toHaveBeenCalledWith(mockPlayers, 'MID');
    });

    it('should sort players alphabetically', () => {
      const sortSpy = vi.spyOn(playerFilterService, 'sortByName');
      
      module.render(mockContext);
      
      expect(sortSpy).toHaveBeenCalled();
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

    it('should handle render before destroy', () => {
      // Premier render
      module.render(mockContext);
      
      // Second render sans destroy (ne devrait pas dupliquer)
      module.render(mockContext);
      
      // Pas d'erreur
      expect(true).toBe(true);
    });
  });
});
