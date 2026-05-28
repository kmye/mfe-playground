import { defineConfig } from "@rsbuild/core";
import { pluginVue } from "@rsbuild/plugin-vue";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

export default defineConfig({
  plugins: [
    pluginVue(),
    pluginModuleFederation({
      name: "remote_vue",
      filename: "remoteEntry.js",
      exposes: {
        "./export-app": "./src/export-app.ts",
      },
      shared: {
        vue: { singleton: true, requiredVersion: "^3.5.13" },
        "vue-router": { singleton: true, requiredVersion: "^4.5.1" },
      },
    }),
  ],
  server: {
    port: 3003,
    headers: { "Access-Control-Allow-Origin": "*" },
    historyApiFallback: true,
  },
  html: {
    template: "./public/index.html",
  },
  output: {
    assetPrefix: "auto",
  },
});
