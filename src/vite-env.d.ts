/// <reference types="vite/client" />

// Variables documented in .env.example; read them through `env` in src/lib/env.ts
interface ImportMetaEnv {
  readonly VITE_AUTH_API_URL: string
  readonly VITE_SELLER_API_URL: string
  readonly VITE_CATALOGUE_API_URL: string
  readonly VITE_CART_API_URL: string
  readonly VITE_ORDER_API_URL: string
  readonly VITE_SHIPMENT_API_URL: string
  readonly VITE_NOTIFICATION_API_URL: string
  readonly VITE_WISHLIST_API_URL: string
  // "true" routes API calls through the dev-server proxy (see vite.config.ts)
  readonly VITE_DEV_PROXY?: string
  // Comma-separated features served by dummy APIs, e.g. "auth,notifications" (see src/api/mock.ts)
  readonly VITE_MOCK_APIS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
