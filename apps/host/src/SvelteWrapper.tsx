import { useEffect, useRef } from "react";
import { loadRemote } from "@module-federation/runtime";
import type { PlatformUser } from "@mfe-poc/platform-types";

interface SvelteRemoteModule {
  mount: (el: HTMLElement, opts?: { basePath?: string; user?: PlatformUser }) => void;
  unmount: () => void;
}

interface SvelteWrapperProps {
  user?: PlatformUser;
}

export default function SvelteWrapper({ user }: SvelteWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const moduleRef = useRef<SvelteRemoteModule | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadRemote("remote_svelte/App").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const svelteModule = mod as SvelteRemoteModule;
      moduleRef.current = svelteModule;
      svelteModule.mount(containerRef.current, { basePath: "/svelte", user });
    });

    return () => {
      cancelled = true;
      moduleRef.current?.unmount();
      moduleRef.current = null;
    };
  }, []);

  return <div ref={containerRef} />;
}
