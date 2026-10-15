import { endpoints } from "@/api/endpoints"
import { request } from "@/api/http"
import { isMocked } from "@/api/mock"
import type { ApiProductCard } from "@/api/product-page"

// Wishlist API on VITE_WISHLIST_API_URL — FIGMA_FRONTEND_API_SPEC.md API 17.13–17.17.
// Bearer token required. Each item carries the product's card details, so no
// other API is called. VITE_MOCK_APIS=wishlist keeps it in the browser.

// Each item is a full product card (same shape as /catalogue/products/search)
// plus the wishlist row's fields
export interface WishlistApiItem extends ApiProductCard {
  // Product UUID
  productId: string
  wishlistItemId: string
  addedAt: string
  brandName?: string | null
  categoryName?: string | null
  // false when the product was removed or deactivated
  productAvailable?: boolean
  offers?: { inStock: boolean }[]
}

// GET /wishlist
export async function fetchWishlist(token: string): Promise<WishlistApiItem[]> {
  if (isMocked("wishlist")) return []
  const data = await request<{ items: WishlistApiItem[] }>(endpoints.wishlist.list, { token })
  return data.items
}

// POST /wishlist/items — idempotent, so adding twice is fine
export async function addWishlistItem(token: string, productId: string) {
  if (isMocked("wishlist")) return { productId, wishlisted: true }
  return request<{ productId: string; wishlisted: boolean }>(endpoints.wishlist.items, {
    method: "POST",
    token,
    body: { productId },
  })
}

// DELETE /wishlist/items/{productId}
export async function removeWishlistItem(token: string, productId: string) {
  if (isMocked("wishlist")) return { productId, wishlisted: false }
  return request<{ productId: string; wishlisted: boolean }>(endpoints.wishlist.item(productId), {
    method: "DELETE",
    token,
  })
}
