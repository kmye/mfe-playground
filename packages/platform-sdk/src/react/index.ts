import { useEffect, useState } from "react";
import { eventBus } from "../event-bus/bus";
import type { EventMap, RequestMap } from "../event-bus/types";

export function useSubscribe<K extends keyof EventMap>(
  event: K,
  handler: (payload: EventMap[K]) => void
): void {
  useEffect(() => eventBus.subscribe(event, handler), [event]);
}

export function useRequest<K extends keyof RequestMap>(
  type: K,
  payload?: RequestMap[K] extends { request: infer R } ? R : never
): (RequestMap[K] extends { response: infer R } ? R : never) | null {
  const [data, setData] = useState<
    (RequestMap[K] extends { response: infer R } ? R : never) | null
  >(null);
  useEffect(() => {
    eventBus.request(type, payload).then(setData);
  }, [type]);
  return data;
}
