/**
 * @fileoverview Tests for FeatureFlagService
 * BMAD Phase 1 - Feature Flags System
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FeatureFlagService, FeatureFlags } from '../FeatureFlagService';

describe('FeatureFlagService', () => {
  beforeEach(() => {
    // Reset singleton before each test
    (FeatureFlagService as any).instance = null;
    
    // Clear localStorage mock
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
    
    // Mock URLSearchParams
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '' }
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Singleton Pattern
  // ============================================================================
  describe('Singleton', () => {
    it('should return the same instance', () => {
      const instance1 = FeatureFlagService.getInstance();
      const instance2 = FeatureFlagService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  // ============================================================================
  // Default Values
  // ============================================================================
  describe('Default Values', () => {
    it('should have correct default values', () => {
      const defaults = FeatureFlagService.getDefaults();
      
      // Core modes should be enabled
      expect(defaults.soloMode).toBe(true);
      expect(defaults.compareMode).toBe(true);
      expect(defaults.benchmarkMode).toBe(true);
      
      // UI features should be enabled
      expect(defaults.centilesPanel).toBe(true);
      expect(defaults.leaderboard).toBe(true);
      expect(defaults.exportPNG).toBe(true);
      expect(defaults.overlayChart).toBe(true);
      
      // Experimental should be disabled
      expect(defaults.teamMode).toBe(false);
      expect(defaults.quadMode).toBe(false);
      expect(defaults.duelMode).toBe(false);
    });
  });

  // ============================================================================
  // Enable/Disable/Toggle
  // ============================================================================
  describe('Enable/Disable/Toggle', () => {
    it('should enable a flag', () => {
      FeatureFlagService.disable('compareMode');
      FeatureFlagService.enable('compareMode');
      expect(FeatureFlagService.isEnabled('compareMode')).toBe(true);
    });

    it('should disable a flag', () => {
      FeatureFlagService.enable('compareMode');
      FeatureFlagService.disable('compareMode');
      expect(FeatureFlagService.isEnabled('compareMode')).toBe(false);
    });

    it('should toggle a flag', () => {
      const initial = FeatureFlagService.isEnabled('compareMode');
      const result = FeatureFlagService.toggle('compareMode');
      expect(result).toBe(!initial);
      expect(FeatureFlagService.isEnabled('compareMode')).toBe(!initial);
    });

    it('should persist changes to localStorage', () => {
      FeatureFlagService.disable('compareMode');
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Reset
  // ============================================================================
  describe('Reset', () => {
    it('should reset a single flag to default', () => {
      FeatureFlagService.disable('compareMode');
      FeatureFlagService.reset('compareMode');
      expect(FeatureFlagService.isEnabled('compareMode')).toBe(true);
    });

    it('should reset all flags to defaults', () => {
      FeatureFlagService.disable('compareMode');
      FeatureFlagService.disable('soloMode');
      FeatureFlagService.resetAll();
      
      expect(FeatureFlagService.isEnabled('compareMode')).toBe(true);
      expect(FeatureFlagService.isEnabled('soloMode')).toBe(true);
    });
  });

  // ============================================================================
  // Getters
  // ============================================================================
  describe('Getters', () => {
    it('should get all flags', () => {
      const all = FeatureFlagService.getAll();
      expect(all.soloMode).toBeDefined();
      expect(all.compareMode).toBeDefined();
      expect(all.benchmarkMode).toBeDefined();
    });

    it('should check if flag is enabled', () => {
      expect(FeatureFlagService.isEnabled('soloMode')).toBe(true);
      FeatureFlagService.disable('soloMode');
      expect(FeatureFlagService.isEnabled('soloMode')).toBe(false);
    });
  });

  // ============================================================================
  // Mode Helpers
  // ============================================================================
  describe('Mode Helpers', () => {
    it('should check if any analysis mode is enabled', () => {
      expect(FeatureFlagService.hasAnyAnalysisMode()).toBe(true);
    });

    it('should return active modes', () => {
      const modes = FeatureFlagService.getActiveModes();
      expect(modes).toContain('solo');
      expect(modes).toContain('compare');
      expect(modes).toContain('benchmark');
    });

    it('should return fallback mode', () => {
      const fallback = FeatureFlagService.getFallbackMode();
      expect(['solo', 'compare', 'benchmark']).toContain(fallback);
    });

    it('should return correct fallback when modes disabled', () => {
      FeatureFlagService.disable('soloMode');
      FeatureFlagService.disable('benchmarkMode');
      expect(FeatureFlagService.getFallbackMode()).toBe('compare');
    });
  });

  // ============================================================================
  // Event System
  // ============================================================================
  describe('Event System', () => {
    it('should notify listeners on change', () => {
      const listener = vi.fn();
      FeatureFlagService.onChange(listener);
      
      FeatureFlagService.toggle('compareMode');
      
      expect(listener).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = FeatureFlagService.onChange(listener);
      
      unsubscribe();
      FeatureFlagService.toggle('compareMode');
      
      // Listener should not be called after unsubscribe
      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // localStorage Integration
  // ============================================================================
  describe('localStorage Integration', () => {
    it('should load flags from localStorage', () => {
      const storedFlags = JSON.stringify({ compareMode: false, soloMode: true });
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(storedFlags);
      
      // Reset singleton to trigger reload
      (FeatureFlagService as any).instance = null;
      
      expect(FeatureFlagService.isEnabled('compareMode')).toBe(false);
      expect(FeatureFlagService.isEnabled('soloMode')).toBe(true);
    });

    it('should handle localStorage errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Should not throw
      expect(() => FeatureFlagService.getInstance()).not.toThrow();
      expect(FeatureFlagService.isEnabled('soloMode')).toBe(true);
    });
  });

  // ============================================================================
  // URL Parameter Override
  // ============================================================================
  describe('URL Parameter Override', () => {
    it('should override flag from URL param', () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { search: '?ff_compareMode=false' }
      });
      
      // Reset singleton to trigger reload with new URL
      (FeatureFlagService as any).instance = null;
      
      expect(FeatureFlagService.isEnabled('compareMode')).toBe(false);
    });

    it('should detect URL override', () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { search: '?ff_compareMode=false' }
      });
      
      // Reset singleton to trigger reload with new URL
      (FeatureFlagService as any).instance = null;
      
      expect(FeatureFlagService.isOverriddenByURL('compareMode')).toBe(true);
      expect(FeatureFlagService.isOverriddenByURL('soloMode')).toBe(false);
    });

    it('should handle multiple URL params', () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { search: '?ff_compareMode=false&ff_teamMode=true' }
      });
      
      // Reset singleton to trigger reload with new URL
      (FeatureFlagService as any).instance = null;
      
      expect(FeatureFlagService.isEnabled('compareMode')).toBe(false);
      expect(FeatureFlagService.isEnabled('teamMode')).toBe(true);
    });

    it('should prioritize URL over localStorage', () => {
      // localStorage says compareMode = true
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(
        JSON.stringify({ compareMode: true })
      );
      
      // URL says compareMode = false
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { search: '?ff_compareMode=false' }
      });
      
      // Reset singleton to trigger reload
      (FeatureFlagService as any).instance = null;
      
      // URL should win
      expect(FeatureFlagService.isEnabled('compareMode')).toBe(false);
    });
  });
});
