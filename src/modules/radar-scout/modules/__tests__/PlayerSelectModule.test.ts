/**
 * PlayerSelectModule Tests
 */

import { describe, it, expect } from 'vitest';
import { PlayerSelectModule } from '../PlayerSelectModule';
import { PlayerFilterService } from '../../services/PlayerFilterService';

describe('PlayerSelectModule', () => {
  it('should create module', () => {
    const service = new PlayerFilterService();
    const module = new PlayerSelectModule(service);
    expect(module.id).toBe('player-select');
  });
});
