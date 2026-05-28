import { mount, unmount as svelteUnmount } from "svelte";
import App from "./App.svelte";

export interface PlatformUser {
  name: string;
  email: string;
}

let instance: Record<string, any> | null = null;

export function mountApp(el: HTMLElement, opts?: { basePath?: string; user?: PlatformUser }) {
  instance = mount(App, { target: el, props: { user: opts?.user } });
}

export function unmount() {
  if (instance) {
    svelteUnmount(instance);
    instance = null;
  }
}

export { mountApp as mount };
