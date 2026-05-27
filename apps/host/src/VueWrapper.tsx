import { useEffect, useRef } from "react";
import { loadRemote } from "@module-federation/runtime";

interface VueRemoteModule {
  mount: (el: HTMLElement, opts?: { basePath?: string }) => void;
  unmount: () => void;
}

export default function VueWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const moduleRef = useRef<VueRemoteModule | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadRemote("remote_vue/App").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const vueModule = mod as VueRemoteModule;
      moduleRef.current = vueModule;
      vueModule.mount(containerRef.current, { basePath: "/vue" });
    });

    return () => {
      cancelled = true;
      moduleRef.current?.unmount();
      moduleRef.current = null;
    };
  }, []);

  return <div ref={containerRef} />;
}
