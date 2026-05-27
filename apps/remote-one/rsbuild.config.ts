import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: "remote_one",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/App.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^19.2.6" },
        "react-dom": { singleton: true, requiredVersion: "^19.2.6" },
        "react-router-dom": { singleton: true, requiredVersion: "^7.15.1" },
        "@mfe-poc/platform-sdk": { singleton: true, requiredVersion: "*" },
      },
    }),
  ],
  server: {
    port: 3001,
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
