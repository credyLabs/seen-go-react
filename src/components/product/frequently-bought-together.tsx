import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Check, Loader2, Plus, ShoppingBag } from "lucide-react"
import { Fragment, useState } from "react"
import { useTranslation } from "react-i18next"

import { addCartItem } from "@/api/cart"
import { ApiError } from "@/api/http"
import { frequentlyBoughtTogetherQueryOptions } from "@/api/product-page"
import type { ProductDetail } from "@/api/products"
import { Button } from "@/components/ui/button"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useAuth } from "@/lib/auth"
import { formatPrice } from "@/lib/format"
import { useCartStore } from "@/stores/cart-store"

// How long "Added" stays before the label resets
const ADDED_RESET_MS = 2000

// "Frequently bought together" from the order service's purchase history.
// Hidden while loading, when nobody has bought a bundle yet, or on error.
export function FrequentlyBoughtTogether({ product }: { product: ProductDetail }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { data: others = [] } = useQuery(frequentlyBoughtTogetherQueryOptions(product.uuid, lang))
  const addToCart = useCartStore((state) => state.addItem)
  const requireAuth = useRequireAuth()
  const [state, setState] = useState<{ status: "idle" | "adding" | "added" | "error"; message?: string }>({ status: "idle" })
  const { token } = useAuth()

  if (others.length === 0) return null

  const bundle = [product, ...others]
  const priced = bundle.filter((item) => item.price > 0)
  const total = priced.reduce((sum, item) => sum + item.price, 0)

  // POST /cart/items for each product's seller listing, one after another;
  // stops at the first failure and shows its reason
  const addAll = () =>
    requireAuth(async () => {
      if (!token) return
      setState({ status: "adding" })
      for (const item of priced) {
        const listingId = item.variants.find((v) => v.listingId)?.listingId
        try {
          if (!listingId) throw new Error(t("cart.errors.notSold"))
          await addCartItem(token, listingId, 1)
          addToCart({
            productId: item.id,
            slug: item.id,
            productUuid: item.uuid,
            name: item.name,
            brand: item.brand,
            image: item.image,
            price: item.price,
            originalPrice: item.originalPrice,
          })
        } catch (err) {
          const reason = err instanceof ApiError && err.status === 0 ? t("cart.errors.network") : err instanceof Error && err.message ? err.message : t("cart.errors.add")
          setState({ status: "error", message: `${item.name}: ${reason}` })
          return
        }
      }
      setState({ status: "added" })
      setTimeout(() => setState({ status: "idle" }), ADDED_RESET_MS)
    })

  return (
    <section aria-labelledby="bought-together" className="flex flex-col gap-4">
      <h2 id="bought-together" className="text-xl font-bold tracking-tight">
        {t("productPage.boughtTogether.title")}
      </h2>
      <div className="flex flex-col gap-5 rounded-2xl border bg-card p-5 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap items-center gap-3">
          {bundle.map((item, index) => (
            <Fragment key={item.id}>
              {index > 0 && (
                <li aria-hidden className="text-muted-foreground">
                  <Plus className="size-4" />
                </li>
              )}
              <li>
                <Link
                  to="/products/$productId"
                  params={{ productId: item.id }}
                  title={item.name}
                  className="block size-20 overflow-hidden rounded-xl border bg-muted transition-opacity hover:opacity-80"
                >
                  {item.image && <img src={item.image} alt={item.name} className="size-full object-cover" />}
                </Link>
              </li>
            </Fragment>
          ))}
        </ul>

        {total > 0 && (
          <div className="flex flex-col gap-3 md:min-w-64">
            <p className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                {t("productPage.boughtTogether.total", { count: priced.length })}
              </span>
              <span className="text-2xl font-bold tracking-tight">{formatPrice(total, lang)}</span>
            </p>
            <Button
              onClick={addAll}
              disabled={state.status === "adding"}
              className="h-10 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {state.status === "adding" ? <Loader2 className="animate-spin" /> : state.status === "added" ? <Check /> : <ShoppingBag />}
              {t(state.status === "added" ? "productPage.addedToCart" : "productPage.boughtTogether.addAll")}
            </Button>
            {state.status === "error" && (
              <p role="alert" className="text-xs text-destructive">
                {state.message}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
