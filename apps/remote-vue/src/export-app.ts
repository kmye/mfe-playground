import { createBridgeComponent } from "@module-federation/bridge-vue3";
import App from "./App.vue";
import { createAppRouter } from "./router";

export default createBridgeComponent({
  rootComponent: App,
  appOptions: ({ basename }) => {
    const router = createAppRouter(basename ?? "/");
    return { router };
  },
});
