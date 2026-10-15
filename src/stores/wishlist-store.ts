import { create } from "zustand"
import { persist } from "zustand/middleware"

import { cardFromApi } from "@/api/product-page"
import type { ProductCardData } from "@/api/products"
import { addWishlistItem, fetchWishlist, removeWishlistItem, type WishlistApiItem } from "@/api/wishlist"

// The wishlist, backed by the wishlist API (GET/POST/DELETE /wishlist…), which
// also sends each product's card details. Updates show instantly and roll back
// if the server refuses. Saved to localStorage so the header count and cards
// show at once; reloaded from the server after sign-in.

export interface WishlistEntry extends ProductCardData {
  // Product UUID, the API's productId
  productId: string
  addedAt: string
  // From the API's offers; undefined when no seller lists it yet
  inStock?: boolean
  // The API sent no product details for it (e.g. the product was removed)
  unavailable?: boolean
}

// What a card needs to be saved: its details plus the product UUID
export type WishlistProduct = ProductCardData & { productId: string }

type Status = "idle" | "loading" | "ready" | "error"

interface WishlistState {
  items: WishlistEntry[]
  status: Status
  // Card details of products saved on this device, by product UUID. Not
  // personal, so kept across sign-outs; used while the API sends ids only
  details: Record<string, WishlistProduct>
  // Reload from GET /wishlist (after sign-in / on app start)
  load: (token: string) => Promise<void>
  add: (token: string, product: WishlistProduct) => Promise<void>
  // DELETE /wishlist/items/{productId}; resolves false (and restores the item) if it failed
  remove: (token: string, productId: string) => Promise<boolean>
  toggle: (token: string, product: WishlistProduct) => Promise<void>
  clear: () => void
}

// A wishlist row as a card, using the same mapping as search results so prices,
// badges and ratings match everywhere. The brand name comes with the row.
function entryFromApi(item: WishlistApiItem): WishlistEntry {
  if (!item.product || item.productAvailable === false) {
    return { id: "", name: "", image: null, productId: item.productId, addedAt: item.addedAt, unavailable: true }
  }
  const brands = new Map(item.product.brandId && item.brandName ? [[item.product.brandId, item.brandName]] : [])
  return {
    ...cardFromApi(item, brands),
    productId: item.productId,
    addedAt: item.addedAt,
    // Someone has stock / every offer is sold out / no offers yet
    inStock: item.bestListing ? true : item.offers?.length ? false : undefined,
  }
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      status: "idle",
      details: {},

      load: async (token) => {
        set({ status: "loading" })
        try {
          const saved = await fetchWishlist(token)
          const { details } = get()
          // Newest first. The API's details win; until it sends them, keep this device's card
          const items = [...saved]
            .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
            .map((row) => {
              const entry = entryFromApi(row)
              const kept = details[row.productId]
              return entry.unavailable && kept ? { ...kept, addedAt: row.addedAt } : entry
            })
          set({ items, status: "ready" })
        } catch {
          // Keep what's shown; the page offers a retry
          set({ status: "error" })
        }
      },

      add: async (token, product) => {
        if (get().items.some((item) => item.productId === product.productId)) return
        const entry: WishlistEntry = { ...product, addedAt: new Date().toISOString() }
        set((state) => ({
          items: [entry, ...state.items],
          details: { ...state.details, [product.productId]: product },
        }))
        try {
          await addWishlistItem(token, product.productId)
        } catch {
          set((state) => ({ items: state.items.filter((item) => item.productId !== product.productId) }))
        }
      },

      remove: async (token, productId) => {
        const before = get().items
        set({ items: before.filter((item) => item.productId !== productId) })
        try {
          await removeWishlistItem(token, productId)
          return true
        } catch {
          // Put it back where it was
          set({ items: before })
          return false
        }
      },

      toggle: async (token, product) => {
        if (get().items.some((item) => item.productId === product.productId)) await get().remove(token, product.productId)
        else await get().add(token, product)
      },

      // Sign-out: forget which products were saved, keep the card details
      clear: () => set({ items: [], status: "idle" }),
    }),
    {
      name: "seengo-wishlist",
      version: 2,
      // Older entries (keyed by slug, no product UUID) can't be synced; start fresh
      migrate: () => ({ items: [], details: {} }),
      partialize: (state) => ({ items: state.items, details: state.details }),
    }
  )
)

export const useIsWishlisted = (productId: string | undefined) =>
  useWishlistStore((state) => !!productId && state.items.some((item) => item.productId === productId))
