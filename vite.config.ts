import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import Unfonts from "unplugin-fonts/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    Unfonts({
      custom: {
        families: [
          {
            name: "Infra",
            local: "Infra",
            src: [
              "./src/assets/fonts/Infra*woff2",
              "./src/assets/fonts/Infra*woff",
            ],
          },
        ],
        preload: true,
        prefetch: false,
        display: "auto",
        injectTo: "head-prepend",
      },
    }),
  ],
});
