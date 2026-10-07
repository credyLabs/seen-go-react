import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { ProductCardData } from "@/api/products"

// Client-side wishlist until the wishlist API is wired in (/wishlist…).
// Keeps enough of each product to render its card; cleared on sign-out.

export type WishlistEntry = ProductCardData & { addedAt: string }

interface WishlistState {
  items: WishlistEntry[]
  toggle: (product: ProductCardData) => void
  remove: (productId: string) => void
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      toggle: (product) =>
        set((state) =>
          state.items.some((item) => item.id === product.id)
            ? { items: state.items.filter((item) => item.id !== product.id) }
            : { items: [{ ...product, addedAt: new Date().toISOString() }, ...state.items] }
        ),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: "seengo-wishlist" }
  )
)

export const useIsWishlisted = (productId: string) =>
  useWishlistStore((state) => state.items.some((item) => item.id === productId))
