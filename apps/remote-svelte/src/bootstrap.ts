import { mount, unmount as svelteUnmount } from "svelte";
import App from "./App.svelte";

let instance: Record<string, any> | null = null;

export function mountApp(el: HTMLElement) {
  instance = mount(App, { target: el });
}

export function unmount() {
  if (instance) {
    svelteUnmount(instance);
    instance = null;
  }
}

export { mountApp as mount };
