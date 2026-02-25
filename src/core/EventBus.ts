/**
 * EventBus - Système de communication pub/sub
 * Story 1.4
 */

type Handler<T = unknown> = (payload: T) => void;
type Unsubscribe = () => void;

export class EventBus {
  private handlers = new Map<string, Set<Handler<unknown>>>();

  /**
   * Émet un événement
   */
  emit<T>(event: string, payload?: T): void {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers) return;

    eventHandlers.forEach(handler => {
      try {
        handler(payload);
      } catch (err) {
        console.error(`Error in event handler for ${event}:`, err);
      }
    });
  }

  /**
   * Écoute un événement
   */
  on<T>(event: string, handler: Handler<T>): Unsubscribe {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as Handler<unknown>);

    return () => {
      this.handlers.get(event)?.delete(handler as Handler<unknown>);
    };
  }

  /**
   * Écoute un événement une seule fois
   */
  once<T>(event: string, handler: Handler<T>): void {
    const unsubscribe = this.on<T>(event, (payload) => {
      unsubscribe();
      handler(payload);
    });
  }

  /**
   * Supprime tous les handlers d'un événement
   */
  off(event: string): void {
    this.handlers.delete(event);
  }
}
