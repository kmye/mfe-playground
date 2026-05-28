import { lazy } from "react";
import { loadRemote as mfLoadRemote } from "@module-federation/runtime";

export function createRemoteComponent<P extends object = Record<string, unknown>>(
  remoteName: string,
  exposedModule: string,
) {
  return lazy(async () => {
    const module = await mfLoadRemote(`${remoteName}/${exposedModule}`);
    return { default: (module as { default: React.ComponentType<P> }).default };
  });
}
