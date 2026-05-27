import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: "host",
      remotes: {
        remote_one: "remote_one@http://localhost:3001/mf-manifest.json",
        remote_two: "remote_two@http://localhost:3002/mf-manifest.json",
        remote_vue: "remote_vue@http://localhost:3003/mf-manifest.json",
        remote_svelte: "remote_svelte@http://localhost:3004/mf-manifest.json",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^19.2.6" },
        "react-dom": { singleton: true, requiredVersion: "^19.2.6" },
        "react-router-dom": { singleton: true, requiredVersion: "^7.15.1" },
      },
    }),
  ],
  server: {
    port: 3000,
    historyApiFallback: true,
  },
  html: {
    template: "./public/index.html",
  },
  output: {
    assetPrefix: "auto",
  },
});
