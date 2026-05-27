import { createRouter, createWebHistory } from "vue-router";
import Home from "./pages/Home.vue";
import About from "./pages/About.vue";

export function createAppRouter(basePath = "/") {
  return createRouter({
    history: createWebHistory(basePath),
    routes: [
      { path: "/", component: Home },
      { path: "/about", component: About },
    ],
  });
}
