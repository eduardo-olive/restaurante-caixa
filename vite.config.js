import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Em dev, /auth /users /orders etc. vão para o backend local
      "/auth":      "http://localhost:3001",
      "/users":     "http://localhost:3001",
      "/accounts":  "http://localhost:3001",
      "/products":  "http://localhost:3001",
      "/orders":    "http://localhost:3001",
      "/stock":     "http://localhost:3001",
      "/purchases": "http://localhost:3001",
      "/shopping":  "http://localhost:3001",
      "/health":    "http://localhost:3001",
    },
  },
});
