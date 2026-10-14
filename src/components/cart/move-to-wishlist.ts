import { useRemoveCartLine } from "@/components/cart/use-remove-cart-line"
import { useAuth } from "@/lib/auth"
import type { CartLine } from "@/stores/cart-store"
import { useWishlistStore } from "@/stores/wishlist-store"

// Moving needs a product page to link to and the product UUID for the wishlist API
export function canMoveToWishlist(line: CartLine) {
  return !!line.slug && !!line.productUuid
}

// Saves the line's product to the wishlist (POST /wishlist/items) and removes
// it from the cart (DELETE /cart/items/{itemId}). Resolves false if the cart refused.
export function useMoveToWishlist() {
  const removeLine = useRemoveCartLine()
  const add = useWishlistStore((state) => state.add)
  const { token } = useAuth()
  return async (line: CartLine) => {
    if (!line.slug || !line.productUuid || !token) return false
    // add() skips products already saved
    void add(token, {
      id: line.slug,
      productId: line.productUuid,
      name: line.name,
      brand: line.brand,
      image: line.image,
      price: line.price,
      originalPrice: line.originalPrice,
    })
    return removeLine(line)
  }
}
