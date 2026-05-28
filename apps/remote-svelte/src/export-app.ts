import { mount, unmount as svelteUnmount } from "svelte";
import App from "./App.svelte";

let instance: Record<string, any> | null = null;

export default {
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
