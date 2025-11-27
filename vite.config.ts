import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import viteCompression from "vite-plugin-compression"
import * as createHtmlPlugin from "vite-plugin-html"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),
  viteCompression({
    algorithm: "brotliCompress"
  }),
  createHtmlPlugin.createHtmlPlugin({
    minify: true
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: true
  },
  build: {
    target: "esnext",
    rollupOptions: {
      treeshake: true
    },
    modulePreload: {
      polyfill: false
    },
    sourcemap: false,
    minify: "terser",
    cssMinify: true,
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    cssCodeSplit: true,
  },
})
