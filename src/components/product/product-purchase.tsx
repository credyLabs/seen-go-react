import { Check, Minus, Plus, Share2, ShoppingBag } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { ProductDetail } from "@/api/products"
import { discountPercent } from "@/components/product/product-badge"
import { Button } from "@/components/ui/button"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useCartStore } from "@/stores/cart-store"

// Fallback when the product has no quantity limit of its own
const MAX_QUANTITY = 10
// How long "Link copied" / "Added to cart" stay before the label resets
const COPIED_RESET_MS = 2000

export function ProductPurchase({ product }: { product: ProductDetail }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [colorIndex, setColorIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [copied, setCopied] = useState(false)
  const [added, setAdded] = useState(false)
  const requireAuth = useRequireAuth()
  const navigate = useNavigate()
  const addToCart = useCartStore((state) => state.addItem)
  const discount = discountPercent(product)
  const hasPrice = product.price > 0
  const canBuy = hasPrice && product.inStock !== false
  const color = product.colors[colorIndex]

  // TODO: POST /cart/items with the chosen listing once the cart API is wired
  const addSelection = () =>
    addToCart(
      {
        productId: product.id,
        slug: product.id,
        name: product.name,
        brand: product.brand,
        image: product.image,
        variant: color?.name,
        price: product.price,
        originalPrice: product.originalPrice,
      },
      quantity
    )

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      // Rejects when the user closes the share sheet; nothing to do then
      await navigator.share({ title: product.name, url }).catch(() => {})
      return
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), COPIED_RESET_MS)
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-xs">
      {/* No price from the API means there's nothing to sell yet */}
      {hasPrice && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-3xl font-bold tracking-tight">
            {formatPrice(product.price, lang)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice, lang)}
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
              {t("productPage.save", { percent: discount })}
            </span>
          )}
        </div>
      )}

      {color && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
            {t("productPage.color")} ·{" "}
            <span className="font-semibold text-foreground">{color.name}</span>
          </span>
          <div role="radiogroup" aria-label={t("productPage.color")} className="flex gap-2.5">
            {product.colors.map((option, index) => (
              <button
                key={option.name}
                type="button"
                role="radio"
                aria-checked={index === colorIndex}
                aria-label={option.name}
                onClick={() => setColorIndex(index)}
                className={cn(
                  "size-8 rounded-full border ring-offset-2 ring-offset-card transition-shadow",
                  index === colorIndex ? "ring-2 ring-foreground" : "hover:ring-2 hover:ring-border"
                )}
                style={{ backgroundColor: option.hex }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 items-center rounded-full border">
          <button
            type="button"
            aria-label={t("productPage.decrease")}
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => q - 1)}
            className="flex size-10 items-center justify-center rounded-full disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <output aria-label={t("productPage.quantity")} className="w-6 text-center text-sm font-medium">
            {quantity}
          </output>
          <button
            type="button"
            aria-label={t("productPage.increase")}
            disabled={quantity >= (product.maxQuantity ?? MAX_QUANTITY)}
            onClick={() => setQuantity((q) => q + 1)}
            className="flex size-10 items-center justify-center rounded-full disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {/* Disabled only when the API says it's out of stock or has no price.
            TODO: call the cart API / go to checkout once they exist; guests sign in first */}
        <Button
          variant="outline"
          disabled={!canBuy}
          onClick={() =>
            requireAuth(() => {
              addSelection()
              setAdded(true)
              setTimeout(() => setAdded(false), COPIED_RESET_MS)
            })
          }
          className="h-10 min-w-36 flex-1 rounded-full"
        >
          {added ? <Check /> : <ShoppingBag />}
          {t(added ? "productPage.addedToCart" : "productPage.addToCart")}
        </Button>
        <Button
          disabled={!canBuy}
          onClick={() =>
            requireAuth(() => {
              addSelection()
              void navigate({ to: "/cart" })
            })
          }
          className="h-10 min-w-36 flex-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          {t("productPage.buyNow")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="h-7 rounded-full text-xs" onClick={share}>
          {copied ? <Check /> : <Share2 />}
          {t(copied ? "productPage.linkCopied" : "productPage.share")}
        </Button>
      </div>
    </div>
  )
}
