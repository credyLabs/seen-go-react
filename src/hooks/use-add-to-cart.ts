import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { addCartItem } from "@/api/cart"
import { ApiError } from "@/api/http"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useAuth } from "@/lib/auth"
import { useCartStore, type NewCartLine } from "@/stores/cart-store"

// How long "Added" / an error stays on the button before it resets
const RESET_MS = 2500

export type AddToCartStatus = "idle" | "adding" | "added" | "error"

// Add to cart for one button: guests go to sign-in first (and come back);
// signed-in users POST /cart/items with the seller listing, and on success the
// line is added to the local cart so the header count and cart page follow.
export function useAddToCart() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const requireAuth = useRequireAuth()
  const addLocal = useCartStore((state) => state.addItem)
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AddToCartStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const settle = (next: AddToCartStatus, message: string | null = null) => {
    setStatus(next)
    setError(message)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setStatus("idle")
      setError(null)
    }, RESET_MS)
  }

  const add = useCallback(
    // onSuccess runs once the API has added it (e.g. Buy now then opens the cart)
    (line: NewCartLine, listingId: string | undefined, quantity = 1, onSuccess?: () => void) =>
      requireAuth(() => {
        // No seller listing means nobody sells it yet
        if (!listingId || !token) {
          settle("error", t("cart.errors.notSold"))
          return
        }
        setStatus("adding")
        setError(null)
        addCartItem(token, listingId, quantity)
          .then(() => {
            addLocal({ ...line, listingId }, quantity)
            // Card counters and the header count read GET /cart
            void queryClient.invalidateQueries({ queryKey: ["cart"] })
            settle("added")
            onSuccess?.()
          })
          .catch((err: unknown) => {
            const message =
              err instanceof ApiError && err.status === 0
                ? t("cart.errors.network")
                : // The API's own reason, e.g. "Insufficient stock. Available: 0, Requested: 1"
                  err instanceof ApiError && err.status === 400 && err.message
                  ? err.message
                  : t("cart.errors.add")
            settle("error", message)
          })
      }),
    [requireAuth, token, addLocal, queryClient, t]
  )

  return { add, status, error, adding: status === "adding" }
}
