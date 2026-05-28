import { mount, unmount as svelteUnmount } from "svelte";
import App from "./App.svelte";

export default function provider() {
  let instance: Record<string, any> | null = null;

  return {
    render(info: { dom: HTMLElement; basename?: string }) {
      instance = mount(App, {
        target: info.dom,
        props: { basename: info.basename ?? "/" },
      });
    },
    destroy(_info: { dom: HTMLElement }) {
      if (instance) {
        svelteUnmount(instance);
        instance = null;
      }
    },
  };
}
