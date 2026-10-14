// Backend base URLs, one per service, validated once at startup so a missing or
// malformed variable fails loudly instead of producing "undefined/catalogue/..."
// requests. Set them in .env (see .env.example).

const SERVICE_VARS = {
  auth: "VITE_AUTH_API_URL",
  seller: "VITE_SELLER_API_URL",
  catalogue: "VITE_CATALOGUE_API_URL",
  cart: "VITE_CART_API_URL",
  order: "VITE_ORDER_API_URL",
  shipment: "VITE_SHIPMENT_API_URL",
  notification: "VITE_NOTIFICATION_API_URL",
  wishlist: "VITE_WISHLIST_API_URL",
} as const satisfies Record<string, keyof ImportMetaEnv>

export type Service = keyof typeof SERVICE_VARS

function readBaseUrl(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env (see .env.example).`)
  }
  try {
    new URL(value)
  } catch {
    throw new Error(`${name} must be an absolute URL, got "${value}".`)
  }
  // Endpoint paths start with "/", so drop any trailing slash here
  return value.replace(/\/+$/, "")
}

// Requests go straight to the VITE_*_API_URL above. VITE_DEV_PROXY=true routes
// them through the Vite dev server instead (see vite.config.ts)
const useDevProxy = import.meta.env.DEV && import.meta.env.VITE_DEV_PROXY === "true"

export const env = {
  apiUrl: Object.fromEntries(
    Object.entries(SERVICE_VARS).map(([service, name]) => {
      // Still validate the real URL so a typo fails here, not inside the proxy
      const baseUrl = readBaseUrl(name)
      return [service, useDevProxy ? `${window.location.origin}/api-proxy/${service}` : baseUrl]
    })
  ) as Record<Service, string>,
}
