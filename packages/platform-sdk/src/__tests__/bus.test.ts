import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEventBus } from "../event-bus/bus";
import type { EventBus } from "../event-bus/types";

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = createEventBus();
  });

  describe("publish/subscribe", () => {
    it("delivers payload to subscriber", () => {
      const handler = vi.fn();
      bus.subscribe("breadcrumbs", handler);
      bus.publish("breadcrumbs", [{ label: "Home" }]);
      expect(handler).toHaveBeenCalledWith([{ label: "Home" }]);
    });

    it("delivers to multiple subscribers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.subscribe("breadcrumbs", handler1);
      bus.subscribe("breadcrumbs", handler2);
      bus.publish("breadcrumbs", [{ label: "Test" }]);
      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();
    });

    it("does not deliver after unsubscribe", () => {
      const handler = vi.fn();
      const unsub = bus.subscribe("breadcrumbs", handler);
      unsub();
      bus.publish("breadcrumbs", [{ label: "Ignored" }]);
      expect(handler).not.toHaveBeenCalled();
    });

    it("does nothing when publishing with no subscribers", () => {
      expect(() =>
        bus.publish("breadcrumbs", [{ label: "Noop" }])
      ).not.toThrow();
    });
  });

  describe("request/handle", () => {
    it("resolves with handler response", async () => {
      bus.handle("get-test" as any, (payload: any) => ({ value: payload.key }));
      const result = await bus.request("get-test" as any, { key: "hello" });
      expect(result).toEqual({ value: "hello" });
    });

    it("resolves with async handler response", async () => {
      bus.handle("get-test" as any, async (payload: any) => {
        return { value: "async-" + payload.key };
      });
      const result = await bus.request("get-test" as any, { key: "data" });
      expect(result).toEqual({ value: "async-data" });
    });

    it("throws when no handler is registered", async () => {
      await expect(bus.request("unknown" as any)).rejects.toThrow(
        'No handler registered for "unknown"'
      );
    });

    it("rejects on timeout", async () => {
      bus.handle("slow" as any, () => new Promise(() => {}));
      await expect(bus.request("slow" as any, undefined, 50)).rejects.toThrow(
        'Request "slow" timed out'
      );
    });

    it("unregisters handler on cleanup", async () => {
      const cleanup = bus.handle("temp" as any, () => "ok");
      cleanup();
      await expect(bus.request("temp" as any)).rejects.toThrow(
        'No handler registered for "temp"'
      );
    });

    it("last handler wins when registered twice", async () => {
      bus.handle("dup" as any, () => "first");
      bus.handle("dup" as any, () => "second");
      const result = await bus.request("dup" as any);
      expect(result).toBe("second");
    });
  });
});
