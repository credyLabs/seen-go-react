import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { addCartItem, cartQueryOptions, updateCartItem, type ApiCart } from "@/api/cart"
import { ApiError } from "@/api/http"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useAuth } from "@/lib/auth"
import { MAX_LINE_QUANTITY, useCartStore, type NewCartLine } from "@/stores/cart-store"

// How many of a seller listing are in the cart, with + / − that talk to the
// cart API: the first add is POST /cart/items; after that PATCH
// /cart/items/{itemId} sets the quantity (0 removes the line). Quantities come
// from GET /cart (shared, cached) and change on screen straight away; a failed
// call reloads the cart so the number is right again.
export function useCartCounter(line: NewCartLine, listingId: string | undefined, maxQuantity = MAX_LINE_QUANTITY) {
  const { t } = useTranslation()
  const { token } = useAuth()
  const requireAuth = useRequireAuth()
  const queryClient = useQueryClient()
  const options = cartQueryOptions(token)
  const { data: cart } = useQuery(options)
  const local = useCartStore()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const item = listingId ? cart?.items.find((i) => i.listingId === listingId) : undefined
  const quantity = item?.quantity ?? 0
  const localLineId = `${line.productId}:${line.variant ?? ""}`

  // Show the new quantity at once (also in this browser's cart)
  const setShown = (next: number) => {
    queryClient.setQueryData<ApiCart>(options.queryKey, (current) =>
      current
        ? {
            ...current,
            items: next
              ? current.items.map((i) => (i.listingId === listingId ? { ...i, quantity: next } : i))
              : current.items.filter((i) => i.listingId !== listingId),
          }
        : current
    )
    if (next === 0) local.removeItem(localLineId)
    else local.setQuantity(localLineId, next)
  }

  const fail = (err: unknown) => {
    setError(
      err instanceof ApiError && err.status === 0
        ? t("cart.errors.network")
        : err instanceof ApiError && err.status === 400 && err.message
          ? err.message
          : t("cart.errors.add")
    )
  }

  const run = async (call: () => Promise<unknown>) => {
    setPending(true)
    setError(null)
    try {
      await call()
    } catch (err) {
      fail(err)
    } finally {
      setPending(false)
      // The server's cart is the truth: line ids, quantities, the header count
      void queryClient.invalidateQueries({ queryKey: ["cart"] })
    }
  }

  // First tap: guests sign in first
  const add = () =>
    requireAuth(() => {
      if (!listingId || !token) {
        setError(t("cart.errors.notSold"))
        return
      }
      void run(async () => {
        await addCartItem(token, listingId, 1)
        local.addItem({ ...line, listingId }, 1)
      })
    })

  const change = (next: number) => {
    if (!item || !token || next < 0 || next > maxQuantity) return
    const previous = quantity
    setShown(next)
    void run(async () => {
      try {
        await updateCartItem(token, item.id, next)
      } catch (err) {
        setShown(previous)
        throw err
      }
    })
  }

  return {
    quantity,
    pending,
    error,
    add,
    increment: () => change(quantity + 1),
    decrement: () => change(quantity - 1),
    canIncrement: quantity < maxQuantity,
  }
}
