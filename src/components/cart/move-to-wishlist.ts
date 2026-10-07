import { useCartStore, type CartLine } from "@/stores/cart-store"
import { useWishlistStore } from "@/stores/wishlist-store"

// Moving needs a product page to link the wishlist card to
export function canMoveToWishlist(line: CartLine) {
  return !!line.slug
}

// Puts the line's product on the wishlist (if it isn't there already) and drops it from the cart
export function useMoveToWishlist() {
  const removeItem = useCartStore((state) => state.removeItem)
  return (line: CartLine) => {
    if (!line.slug) return
    const wishlist = useWishlistStore.getState()
    if (!wishlist.items.some((item) => item.id === line.slug)) {
      wishlist.toggle({
        id: line.slug,
        name: line.name,
        brand: line.brand,
        image: line.image,
        price: line.price,
        originalPrice: line.originalPrice,
      })
    }
    removeItem(line.lineId)
  }
}
