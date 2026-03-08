import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { inspectAttr } from "kimi-plugin-inspect-react";
// @ts-ignore
import { cssVariablesPlugin } from "./vite-plugin-css-variables.js";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [inspectAttr(), react(), cssVariablesPlugin()],
  css: {
    devSourcemap: true,
  },
  build: {
    minify: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
