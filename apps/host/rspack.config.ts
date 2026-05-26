import { defineConfig } from "@rspack/cli";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";

export default defineConfig({
  entry: "./src/index.ts",
  output: {
    publicPath: "auto",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: { syntax: "typescript", tsx: true },
              transform: { react: { runtime: "automatic" } },
            },
          },
        },
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "host",
      remotes: {
        remote_one: "remote_one@http://localhost:3001/mf-manifest.json",
        remote_two: "remote_two@http://localhost:3002/mf-manifest.json",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.3.1" },
        "react-dom": { singleton: true, requiredVersion: "^18.3.1" },
        "react-router-dom": { singleton: true, requiredVersion: "^6.28.0" },
      },
    }),
  ],
  devServer: {
    port: 3000,
    historyApiFallback: true,
  },
  devtool: false,
});
