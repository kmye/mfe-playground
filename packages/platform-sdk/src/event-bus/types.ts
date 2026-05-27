import type { BreadcrumbItem } from "../types";

export interface EventMap {
  breadcrumbs: BreadcrumbItem[];
}

export interface RequestMap {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Listener<T = any> = (payload: T) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Handler<Req = any, Res = any> = (
  payload: Req
) => Res | Promise<Res>;

export interface EventBus {
  publish<K extends keyof EventMap>(event: K, payload: EventMap[K]): void;
  subscribe<K extends keyof EventMap>(
    event: K,
    handler: Listener<EventMap[K]>
  ): () => void;
  request<K extends keyof RequestMap>(
    type: K,
    payload?: RequestMap[K] extends { request: infer R } ? R : never,
    timeoutMs?: number
  ): Promise<RequestMap[K] extends { response: infer R } ? R : never>;
  handle<K extends keyof RequestMap>(
    type: K,
    handler: Handler<
      RequestMap[K] extends { request: infer Req } ? Req : never,
      RequestMap[K] extends { response: infer Res } ? Res : never
    >
  ): () => void;
}
