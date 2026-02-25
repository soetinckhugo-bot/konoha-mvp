/**
 * Tests unitaires Core
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginRegistry } from '../src/core/PluginRegistry';
import { AppStateManager } from '../src/core/AppStateManager';
import { MetricRegistry } from '../src/core/MetricRegistry';
import { EventBus } from '../src/core/EventBus';
import { NormalizationService } from '../src/core/NormalizationService';
import { GradeCalculator } from '../src/modules/radar-scout/services/GradeCalculator';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  it('should register a manifest', () => {
    registry.register({
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'Test',
      entryPoint: './test.ts'
    });

    expect(registry.list()).toHaveLength(1);
  });

  it('should not register duplicate manifests', () => {
    const manifest = {
      id: 'test-plugin',
      name: 'Test',
      version: '1.0.0',
      description: 'Test',
      entryPoint: './test.ts'
    };

    registry.register(manifest);
    registry.register(manifest);

    expect(registry.list()).toHaveLength(1);
  });
});

describe('AppStateManager', () => {
  let stateManager: AppStateManager;

  beforeEach(() => {
    stateManager = new AppStateManager();
  });

  it('should get and set state', () => {
    stateManager.setState('currentView', 'compare');
    expect(stateManager.getState('currentView')).toBe('compare');
  });

  it('should notify subscribers', () => {
    const callback = vi.fn();
    stateManager.subscribe('currentView', callback);
    
    stateManager.setState('currentView', 'benchmark');
    
    expect(callback).toHaveBeenCalledWith('benchmark', 'solo');
  });
});

describe('MetricRegistry', () => {
  let registry: MetricRegistry;

  beforeEach(() => {
    registry = new MetricRegistry();
  });

  it('should register a metric', () => {
    registry.register({
      id: 'kda',
      name: 'KDA',
      category: 'combat',
      type: 'ratio',
      direction: 'higher-is-better',
      normalize: { min: 0, max: 10 },
      format: 'decimal'
    });

    expect(registry.list()).toHaveLength(1);
    expect(registry.get('kda')?.name).toBe('KDA');
  });

  it('should throw on invalid config', () => {
    expect(() => registry.register({
      id: '',
      name: 'Test',
      category: 'combat',
      type: 'number',
      direction: 'higher-is-better',
      normalize: { min: 0, max: 100 },
      format: 'decimal'
    })).toThrow();
  });
});

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  it('should emit and receive events', () => {
    const callback = vi.fn();
    eventBus.on('test', callback);
    
    eventBus.emit('test', { data: 'value' });
    
    expect(callback).toHaveBeenCalledWith({ data: 'value' });
  });

  it('should unsubscribe', () => {
    const callback = vi.fn();
    const unsubscribe = eventBus.on('test', callback);
    
    unsubscribe();
    eventBus.emit('test', {});
    
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('NormalizationService', () => {
  let service: NormalizationService;

  beforeEach(() => {
    service = new NormalizationService();
  });

  it('should normalize values correctly', () => {
    const metric = {
      id: 'kda',
      name: 'KDA',
      category: 'combat',
      type: 'ratio',
      direction: 'higher-is-better',
      normalize: { min: 0, max: 10 },
      format: 'decimal'
    };

    expect(service.normalize(5, metric)).toBe(50);
    expect(service.normalize(0, metric)).toBe(0);
    expect(service.normalize(10, metric)).toBe(100);
  });

  it('should invert for lower-is-better', () => {
    const metric = {
      id: 'deaths',
      name: 'Deaths',
      category: 'combat',
      type: 'number',
      direction: 'lower-is-better',
      normalize: { min: 0, max: 10 },
      format: 'decimal'
    };

    expect(service.normalize(0, metric)).toBe(100);
    expect(service.normalize(10, metric)).toBe(0);
  });

  it('should clamp values', () => {
    const metric = {
      id: 'kda',
      name: 'KDA',
      category: 'combat',
      type: 'ratio',
      direction: 'higher-is-better',
      normalize: { min: 0, max: 10 },
      format: 'decimal'
    };

    expect(service.normalize(-5, metric)).toBe(0);
    expect(service.normalize(15, metric)).toBe(100);
  });
});

describe('GradeCalculator', () => {
  it('should calculate grades correctly', () => {
    expect(GradeCalculator.getGrade(95)).toBe('S');
    expect(GradeCalculator.getGrade(85)).toBe('A');
    expect(GradeCalculator.getGrade(70)).toBe('B');
    expect(GradeCalculator.getGrade(55)).toBe('C');
    expect(GradeCalculator.getGrade(30)).toBe('C');
  });

  it('should return correct colors', () => {
    expect(GradeCalculator.getGradeColor('S')).toBe('#00D9C0');
    expect(GradeCalculator.getGradeColor('A')).toBe('#4ADE80');
    expect(GradeCalculator.getGradeColor('B')).toBe('#FACC15');
    expect(GradeCalculator.getGradeColor('C')).toBe('#FB923C');
  });
});
