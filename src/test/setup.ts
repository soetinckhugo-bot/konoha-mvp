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

// Store all created elements for querySelector to work
const allElements: MockElement[] = [];

interface MockElement {
  tagName: string;
  id: string;
  className: string;
  _classes: Set<string>;
  attributes: Map<string, string>;
  style: Record<string, string>;
  innerHTML: string;
  textContent: string;
  children: MockElement[];
  parentNode: MockElement | null;
  _eventListeners: Map<string, Function[]>;
  
  // Methods
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  classList: {
    add: (c: string) => void;
    remove: (c: string) => void;
    contains: (c: string) => boolean;
    toggle: (c: string) => void;
  };
  appendChild(child: MockElement): MockElement;
  removeChild(child: MockElement): void;
  querySelector(selector: string): MockElement | null;
  querySelectorAll(selector: string): MockElement[];
  addEventListener(event: string, handler: Function): void;
  removeEventListener(event: string, handler: Function): void;
  dispatchEvent(event: Event): boolean;
  click(): void;
  updateInnerHTML(): void;
}

function createMockElement(tag: string): MockElement {
  const element: MockElement = {
    tagName: tag.toUpperCase(),
    id: '',
    className: '',
    _classes: new Set(),
    attributes: new Map(),
    style: {},
    innerHTML: '',
    textContent: '',
    children: [],
    parentNode: null,
    _eventListeners: new Map(),
    
    setAttribute(name: string, value: string) {
      this.attributes.set(name, value);
      if (name === 'id') this.id = value;
      if (name === 'class') {
        this.className = value;
        this._classes = new Set(value.split(' ').filter(c => c));
      }
      if (name === 'data-role') {
        // Store as property too for easy access
        (this as any)['data-role'] = value;
      }
    },
    
    getAttribute(name: string): string | null {
      return this.attributes.get(name) || null;
    },
    
    classList: {
      add: (c: string) => {
        element._classes.add(c);
        element.className = Array.from(element._classes).join(' ');
      },
      remove: (c: string) => {
        element._classes.delete(c);
        element.className = Array.from(element._classes).join(' ');
      },
      contains: (c: string) => element._classes.has(c),
      toggle: (c: string) => {
        if (element._classes.has(c)) {
          element._classes.delete(c);
        } else {
          element._classes.add(c);
        }
        element.className = Array.from(element._classes).join(' ');
      }
    },
    
    appendChild(child: MockElement): MockElement {
      child.parentNode = element;
      element.children.push(child);
      // Update innerHTML representation
      element.updateInnerHTML();
      return child;
    },
    
    removeChild(child: MockElement): void {
      const index = element.children.indexOf(child);
      if (index > -1) {
        element.children.splice(index, 1);
        child.parentNode = null;
      }
      element.updateInnerHTML();
    },
    
    querySelector(selector: string): MockElement | null {
      // Simple selector matching
      if (selector.startsWith('#')) {
        const id = selector.slice(1);
        // Search in children recursively
        return findById(element, id);
      }
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        return findByClass(element, className);
      }
      if (selector.includes('[') && selector.includes(']')) {
        // Attribute selector like [data-role="MID"]
        const match = selector.match(/\[([^=\]]+)(?:="([^"]+)")?\]/);
        if (match) {
          const attrName = match[1];
          const attrValue = match[2];
          return findByAttribute(element, attrName, attrValue);
        }
      }
      // Tag selector
      return findByTag(element, selector.toUpperCase());
    },
    
    querySelectorAll(selector: string): MockElement[] {
      const results: MockElement[] = [];
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        findAllByClass(element, className, results);
      } else if (selector.startsWith('#')) {
        const found = this.querySelector(selector);
        if (found) results.push(found);
      } else {
        findAllByTag(element, selector.toUpperCase(), results);
      }
      return results;
    },
    
    addEventListener(event: string, handler: Function): void {
      if (!element._eventListeners.has(event)) {
        element._eventListeners.set(event, []);
      }
      element._eventListeners.get(event)!.push(handler);
    },
    
    removeEventListener(event: string, handler: Function): void {
      const handlers = element._eventListeners.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    },
    
    dispatchEvent(event: Event): boolean {
      const handlers = element._eventListeners.get(event.type);
      if (handlers) {
        handlers.forEach(h => h(event));
        return true;
      }
      return false;
    },
    
    click(): void {
      this.dispatchEvent({ type: 'click' } as Event);
    },
    
    updateInnerHTML(): void {
      // Simple HTML serialization
      element.innerHTML = element.children.map(child => serializeElement(child)).join('');
    }
  };
  
  allElements.push(element);
  return element;
}

// Helper functions for DOM traversal
function findById(root: MockElement, id: string): MockElement | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findById(child, id);
    if (found) return found;
  }
  return null;
}

function findByClass(root: MockElement, className: string): MockElement | null {
  if (root._classes.has(className)) return root;
  for (const child of root.children) {
    const found = findByClass(child, className);
    if (found) return found;
  }
  return null;
}

function findAllByClass(root: MockElement, className: string, results: MockElement[]): void {
  if (root._classes.has(className)) results.push(root);
  for (const child of root.children) {
    findAllByClass(child, className, results);
  }
}

function findByTag(root: MockElement, tag: string): MockElement | null {
  if (root.tagName === tag) return root;
  for (const child of root.children) {
    const found = findByTag(child, tag);
    if (found) return found;
  }
  return null;
}

function findAllByTag(root: MockElement, tag: string, results: MockElement[]): void {
  if (root.tagName === tag) results.push(root);
  for (const child of root.children) {
    findAllByTag(child, tag, results);
  }
}

function findByAttribute(root: MockElement, name: string, value?: string): MockElement | null {
  const attrValue = root.attributes.get(name);
  if (value === undefined) {
    if (attrValue !== undefined) return root;
  } else {
    if (attrValue === value) return root;
  }
  for (const child of root.children) {
    const found = findByAttribute(child, name, value);
    if (found) return found;
  }
  return null;
}

function serializeElement(el: MockElement): string {
  const attrs: string[] = [];
  if (el.id) attrs.push(`id="${el.id}"`);
  if (el.className) attrs.push(`class="${el.className}"`);
  el.attributes.forEach((value, key) => {
    if (key !== 'id' && key !== 'class') {
      attrs.push(`${key}="${value}"`);
    }
  });
  
  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  
  if (el.children.length === 0) {
    // Self-closing for some tags
    if (['INPUT', 'IMG', 'BR', 'HR', 'META', 'LINK'].includes(el.tagName)) {
      return `<${el.tagName.toLowerCase()}${attrStr}>`;
    }
    return `<${el.tagName.toLowerCase()}${attrStr}>${el.innerHTML}</${el.tagName.toLowerCase()}>`;
  }
  
  return `<${el.tagName.toLowerCase()}${attrStr}>${el.innerHTML}</${el.tagName.toLowerCase()}>`;
}

// Create root body element
const bodyElement = createMockElement('body');

// Setup global document
global.document = {
  createElement: vi.fn((tag: string) => createMockElement(tag)),
  body: bodyElement as any,
  querySelector: vi.fn((selector: string) => {
    if (selector === 'body') return bodyElement as any;
    return bodyElement.querySelector(selector) as any;
  }),
  querySelectorAll: vi.fn((selector: string) => {
    return bodyElement.querySelectorAll(selector) as any;
  }),
  getElementById: vi.fn((id: string) => bodyElement.querySelector(`#${id}`) as any),
  getElementsByClassName: vi.fn((className: string) => {
    const results: MockElement[] = [];
    findAllByClass(bodyElement, className, results);
    return results as any;
  }),
  getElementsByTagName: vi.fn((tag: string) => {
    const results: MockElement[] = [];
    findAllByTag(bodyElement, tag.toUpperCase(), results);
    return results as any;
  }),
} as unknown as Document;

// Clear elements between tests
export function clearMockDOM(): void {
  allElements.length = 0;
  bodyElement.children.length = 0;
  bodyElement.innerHTML = '';
}
