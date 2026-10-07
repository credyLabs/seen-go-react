import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// Service base-URL variables from .env; keep in sync with src/lib/env.ts
const SERVICE_VARS = {
  auth: "VITE_AUTH_API_URL",
  seller: "VITE_SELLER_API_URL",
  catalogue: "VITE_CATALOGUE_API_URL",
  cart: "VITE_CART_API_URL",
  order: "VITE_ORDER_API_URL",
  shipment: "VITE_SHIPMENT_API_URL",
  notification: "VITE_NOTIFICATION_API_URL",
  wishlist: "VITE_WISHLIST_API_URL",
};

// In dev the app calls /api-proxy/<service>/... on its own origin and Vite
// forwards it to that service. The browser never talks to the backend directly,
// so the backend needs no CORS setup for localhost, and ngrok's browser warning
// page is skipped server-side. Opt in with VITE_DEV_PROXY=true; by default the
// browser calls the service URLs directly.
function serviceProxies(env: Record<string, string>) {
  const proxies: Record<string, ProxyOptions> = {};
  for (const [service, name] of Object.entries(SERVICE_VARS)) {
    const target = env[name];
    if (!target) continue;
    const prefix = `/api-proxy/${service}`;
    proxies[prefix] = {
      target,
      changeOrigin: true,
      rewrite: (p) => p.slice(prefix.length),
      headers: { "ngrok-skip-browser-warning": "true" },
    };
  }
  return proxies;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      proxy: env.VITE_DEV_PROXY === "true" ? serviceProxies(env) : undefined,
    },
  };
});
