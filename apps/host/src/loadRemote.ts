import { lazy } from "react";
import { loadRemote as mfLoadRemote } from "@module-federation/enhanced/runtime";

export function createRemoteComponent(remoteName: string, exposedModule: string) {
  return lazy(async () => {
    const module = await mfLoadRemote(`${remoteName}/${exposedModule}`);
    return { default: (module as any).default };
  });
}
