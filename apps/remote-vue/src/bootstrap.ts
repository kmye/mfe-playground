import { createApp, type App as VueApp } from "vue";
import App from "./App.vue";
import { createAppRouter } from "./router";

export interface PlatformUser {
  name: string;
  email: string;
}

let app: VueApp | null = null;

export function mount(el: HTMLElement, opts?: { basePath?: string; user?: PlatformUser }) {
  app = createApp(App, { user: opts?.user });
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
