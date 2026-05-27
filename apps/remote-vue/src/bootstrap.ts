import { createApp, type App as VueApp } from "vue";
import App from "./App.vue";
import { createAppRouter } from "./router";

let app: VueApp | null = null;

export function mount(el: HTMLElement, opts?: { basePath?: string }) {
  app = createApp(App);
  const router = createAppRouter(opts?.basePath ?? "/");
  app.use(router);
  app.mount(el);
}

export function unmount() {
  if (app) {
    app.unmount();
    app = null;
  }
}
