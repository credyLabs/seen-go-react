import { Check, Loader2, Minus, Plus, Share2, ShoppingBag } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { ProductDetail } from "@/api/products"
import { discountPercent } from "@/components/product/product-badge"
import { Button } from "@/components/ui/button"
import { useAddToCart } from "@/hooks/use-add-to-cart"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

// Fallback when the product has no quantity limit of its own
const MAX_QUANTITY = 10
// How long "Link copied" / "Added to cart" stay before the label resets
const COPIED_RESET_MS = 2000

export function ProductPurchase({ product }: { product: ProductDetail }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const minQuantity = Math.max(1, product.minQuantity ?? 1)
  const maxQuantity = product.maxQuantity ?? MAX_QUANTITY
  const [variantId, setVariantId] = useState(product.variants[0]?.id)
  const [quantity, setQuantity] = useState(minQuantity)
  const [copied, setCopied] = useState(false)
  // Separate states so each button shows its own progress
  const cart = useAddToCart()
  const buyNow = useAddToCart()
  const navigate = useNavigate()
  const variant = product.variants.find((v) => v.id === variantId)
  // A seller's price for the chosen variant wins over the product's list price
  const price = variant?.price ?? product.price
  const originalPrice =
    product.originalPrice && product.originalPrice > price ? product.originalPrice : undefined
  // The API's percentage when the price is the advertised one; otherwise worked out from the seller's price
  const discount =
    variant?.price == null && product.discountPercent != null
      ? Math.round(product.discountPercent)
      : discountPercent({ price, originalPrice })
  const hasPrice = price > 0
  const canBuy = hasPrice && (variant?.inStock ?? product.inStock) !== false
  // "Edition" — the option names the variants are chosen by
  const optionLabel = [...new Set(product.variants.flatMap((v) => v.options.map((o) => o.name)))].join(" / ")
  const variantLabel = (v: (typeof product.variants)[number]) =>
    v.options.length ? v.options.map((o) => o.value).join(" / ") : v.name

  // The chosen variant's cheapest in-stock seller listing is what POST /cart/items adds
  const line = {
    productId: product.id,
    slug: product.id,
    productUuid: product.uuid,
    name: product.name,
    brand: product.brand,
    image: product.image,
    variant: variant ? variantLabel(variant) : undefined,
    price,
    originalPrice,
  }
  const listingId = variant?.listingId

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
            {formatPrice(price, lang)}
          </span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(originalPrice, lang)}
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
              {t("productPage.save", { percent: discount })}
            </span>
          )}
        </div>
      )}

      {/* Variants from the API, e.g. Edition: Standard */}
      {variant && optionLabel && (
        <div className="flex flex-col gap-2">
          <span className="text-bidi-plain text-[11px] tracking-wide text-muted-foreground uppercase rtl:text-right">
            {optionLabel} · <span className="font-semibold text-foreground">{variantLabel(variant)}</span>
          </span>
          <div role="radiogroup" aria-label={optionLabel} className="flex flex-wrap gap-2">
            {product.variants.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={option.id === variant.id}
                onClick={() => setVariantId(option.id)}
                className={cn(
                  "text-bidi-plain h-8 rounded-full border px-3.5 text-xs font-medium transition-colors",
                  option.id === variant.id
                    ? "border-foreground bg-foreground text-background"
                    : "hover:border-foreground/40",
                  option.inStock === false && "text-muted-foreground line-through"
                )}
              >
                {variantLabel(option)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 items-center rounded-full border">
          <button
            type="button"
            aria-label={t("productPage.decrease")}
            disabled={quantity <= minQuantity}
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
            disabled={quantity >= maxQuantity}
            onClick={() => setQuantity((q) => q + 1)}
            className="flex size-10 items-center justify-center rounded-full disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {/* Disabled when the API says it's out of stock or has no price. Guests sign
            in first; then POST /cart/items. Buy now opens the cart once it's added */}
        <Button
          variant="outline"
          disabled={!canBuy || cart.adding || buyNow.adding}
          onClick={() => cart.add(line, listingId, quantity)}
          className="h-10 min-w-36 flex-1 rounded-full"
        >
          {cart.adding ? <Loader2 className="animate-spin" /> : cart.status === "added" ? <Check /> : <ShoppingBag />}
          {t(cart.status === "added" ? "productPage.addedToCart" : "productPage.addToCart")}
        </Button>
        <Button
          disabled={!canBuy || cart.adding || buyNow.adding}
          onClick={() => buyNow.add(line, listingId, quantity, () => void navigate({ to: "/cart" }))}
          className="h-10 min-w-36 flex-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          {buyNow.adding && <Loader2 className="animate-spin" />}
          {t("productPage.buyNow")}
        </Button>
      </div>
      {(cart.error ?? buyNow.error) && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {cart.error ?? buyNow.error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="h-7 rounded-full text-xs" onClick={share}>
          {copied ? <Check /> : <Share2 />}
          {t(copied ? "productPage.linkCopied" : "productPage.share")}
        </Button>
      </div>
    </div>
  )
}
