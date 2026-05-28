import path from "node:path";
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
        "./export-app": "./src/export-app.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^19.2.6" },
        "react-dom": { singleton: true, requiredVersion: "^19.2.6" },
        "react-router-dom": { singleton: true, requiredVersion: "^7.15.1" },
      },
    }),
  ],
  source: {
    alias: {
      "react-router-dom$": path.resolve(
        __dirname,
        "node_modules/@module-federation/bridge-react/dist/router-v7.es.js",
      ),
    },
  },
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
