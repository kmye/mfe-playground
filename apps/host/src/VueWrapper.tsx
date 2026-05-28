import { useEffect, useRef } from "react";
import { loadRemote } from "@module-federation/runtime";
import type { PlatformUser } from "@mfe-poc/platform-types";

interface VueRemoteModule {
  mount: (el: HTMLElement, opts?: { basePath?: string; user?: PlatformUser }) => void;
  unmount: () => void;
}

interface VueWrapperProps {
  user?: PlatformUser;
}

export default function VueWrapper({ user }: VueWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const moduleRef = useRef<VueRemoteModule | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadRemote("remote_vue/App").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const vueModule = mod as VueRemoteModule;
      moduleRef.current = vueModule;
      vueModule.mount(containerRef.current, { basePath: "/vue", user });
    });

    return () => {
      cancelled = true;
      moduleRef.current?.unmount();
      moduleRef.current = null;
    };
  }, []);

  return <div ref={containerRef} />;
}
