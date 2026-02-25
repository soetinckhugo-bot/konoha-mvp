/**
 * @fileoverview Test setup and utilities
 * BMAD Phase 4: Testing
 */

import { vi } from 'vitest';

// Mock getComputedStyle for tests
global.getComputedStyle = vi.fn((_element: Element) => {
  return {
    getPropertyValue: (prop: string) => {
      const cssVars: Record<string, string> = {
        '--kono-primary': '#60A5FA',
        '--kono-danger': '#EF4444',
        '--kono-tier-s': '#00D9C0',
        '--kono-tier-a': '#4ADE80',
        '--kono-tier-b': '#FACC15',
        '--kono-tier-c': '#EF4444',
      };
      return cssVars[prop] || '';
    },
  } as CSSStyleDeclaration;
});

// Mock document
global.document = {
  createElement: vi.fn(() => ({
    style: {},
    setAttribute: vi.fn(),
    getContext: vi.fn(() => ({
      fillStyle: '',
      fillRect: vi.fn(),
    })),
  })),
} as unknown as Document;
