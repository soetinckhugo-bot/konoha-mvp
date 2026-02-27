// Store.ts - Simplified for Vercel build
// @ts-nocheck
export class Store {
  private state: Record<string, unknown> = {};
  private listeners: Record<string, Array<(value: unknown) => void>> = {};
  
  set(key: string, value: unknown) {
    this.state[key] = value;
    this.listeners[key]?.forEach(cb => cb(value));
  }
  
  get(key: string) {
    return this.state[key];
  }
  
  subscribe(key: string, callback: (value: unknown) => void) {
    if (!this.listeners[key]) this.listeners[key] = [];
    this.listeners[key].push(callback);
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    };
  }
}
