import { defineConfig } from "@rsbuild/core";
import { pluginSvelte } from "@rsbuild/plugin-svelte";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

export default defineConfig({
  plugins: [
    pluginSvelte(),
    pluginModuleFederation({
      name: "remote_svelte",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/bootstrap.ts",
      },
      shared: {
        "svelte-spa-router": { singleton: true, requiredVersion: "^5.1.0" },
      },
    }),
  ],
  server: {
    port: 3004,
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
