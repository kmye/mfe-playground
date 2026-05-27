import type { EventBus, EventMap, RequestMap, Listener, Handler } from "./types";

class EventBusImpl implements EventBus {
  private listeners = new Map<string, Set<Listener>>();
  private handlers = new Map<string, Handler>();

  publish<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const set = this.listeners.get(event as string);
    if (set) set.forEach((fn) => fn(payload));
  }

  subscribe<K extends keyof EventMap>(
    event: K,
    handler: Listener<EventMap[K]>
  ): () => void {
    const key = event as string;
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(handler);
    return () => {
      this.listeners.get(key)?.delete(handler);
    };
  }

  async request<K extends keyof RequestMap>(
    type: K,
    payload?: RequestMap[K] extends { request: infer R } ? R : never,
    timeoutMs = 5000
  ): Promise<RequestMap[K] extends { response: infer R } ? R : never> {
    const handler = this.handlers.get(type as string);
    if (!handler)
      throw new Error(`No handler registered for "${String(type)}"`);
    return Promise.race([
      Promise.resolve(handler(payload)),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request "${String(type)}" timed out`)),
          timeoutMs
        )
      ),
    ]);
  }

  handle<K extends keyof RequestMap>(
    type: K,
    handler: Handler<
      RequestMap[K] extends { request: infer Req } ? Req : never,
      RequestMap[K] extends { response: infer Res } ? Res : never
    >
  ): () => void {
    this.handlers.set(type as string, handler);
    return () => {
      this.handlers.delete(type as string);
    };
  }
}

export function createEventBus(): EventBus {
  return new EventBusImpl();
}

export const eventBus: EventBus = createEventBus();
