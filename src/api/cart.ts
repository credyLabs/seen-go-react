import { queryOptions } from "@tanstack/react-query"

import { endpoints } from "@/api/endpoints"
import { request } from "@/api/http"
import type { ApiProductCard } from "@/api/product-page"

// Cart API on VITE_CART_API_URL — FIGMA_FRONTEND_API_SPEC.md API 17.33–17.36.
// Bearer required.

// A cart line plus its product's card details (same shape as search results)
export interface ApiCartItem extends Partial<Omit<ApiProductCard, "product">> {
  // Cart line id, for PATCH/DELETE /cart/items/{itemId}
  id: string
  listingId: string
  variantId: string
  sellerId: string
  productName: string
  variantName: string | null
  quantity: number
  unitPrice: number
  compareAtPrice: number | null
  lineTotal: number
  addedAt?: string
  // Product UUID
  productId?: string
  product?: ApiProductCard["product"] & { maxPurchaseQuantity?: number | null }
  brandName?: string | null
  categoryName?: string | null
  // false when the product was removed or deactivated
  productAvailable?: boolean
  bestListing?: { listingId: string; price: number; inStock?: boolean; available?: number } | null
}

export interface ApiCart {
  cartId: string | null
  items: ApiCartItem[]
  subtotal: number
  discount: number
  total: number
  couponCode: string | null
  itemCount?: number
  updatedAt?: string
}

// GET /cart
export function fetchCart(token: string) {
  return request<ApiCart>(endpoints.cart.view, { token })
}

export const cartQueryOptions = (token: string | null) =>
  queryOptions({
    queryKey: ["cart", token],
    queryFn: () => fetchCart(token!),
    enabled: !!token,
    staleTime: 30 * 1000,
  })

// POST /cart/items — only listingId and quantity are accepted. 400 carries a
// specific reason (unavailable listing, insufficient stock, quantity limits).
export function addCartItem(token: string, listingId: string, quantity: number) {
  return request<{ message: string }>(endpoints.cart.items, {
    method: "POST",
    token,
    body: { listingId, quantity },
  })
}

// PATCH /cart/items/{itemId} — sets the line's quantity; 0 removes the line
export function updateCartItem(token: string, itemId: string, quantity: number) {
  return request<{ message: string }>(endpoints.cart.item(itemId), {
    method: "PATCH",
    token,
    body: { quantity },
  })
}

// DELETE /cart/items/{itemId}
export function deleteCartItem(token: string, itemId: string) {
  return request<{ message: string; itemId: string }>(endpoints.cart.item(itemId), { method: "DELETE", token })
}
