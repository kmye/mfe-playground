import { useEffect, useRef } from "react";
import { loadRemote } from "@module-federation/runtime";

interface SvelteRemoteModule {
  mount: (el: HTMLElement) => void;
  unmount: () => void;
}

export default function SvelteWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const moduleRef = useRef<SvelteRemoteModule | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadRemote("remote_svelte/App").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const svelteModule = mod as SvelteRemoteModule;
      moduleRef.current = svelteModule;
      svelteModule.mount(containerRef.current);
    });

    return () => {
      cancelled = true;
      moduleRef.current?.unmount();
      moduleRef.current = null;
    };
  }, []);

  return <div ref={containerRef} />;
}
