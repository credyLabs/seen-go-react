import { useQueryClient } from "@tanstack/react-query"

import { deleteCartItem } from "@/api/cart"
import { useAuth } from "@/lib/auth"
import { useCartStore, type CartLine } from "@/stores/cart-store"

// Removes a cart line: DELETE /cart/items/{itemId} for lines from GET /cart,
// then this browser's copy. Resolves false when the API refused.
export function useRemoveCartLine() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const removeItem = useCartStore((state) => state.removeItem)
  const removeListing = useCartStore((state) => state.removeListing)

  return async (line: CartLine) => {
    if (line.itemId) {
      if (!token) return false
      try {
        await deleteCartItem(token, line.itemId)
      } catch {
        return false
      } finally {
        await queryClient.invalidateQueries({ queryKey: ["cart"] })
      }
    }
    removeItem(line.lineId)
    if (line.listingId) removeListing(line.listingId)
    return true
  }
}
