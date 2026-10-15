import { Link } from "@tanstack/react-router"
import { ImageOff, Loader2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { ProductCardData } from "@/api/products"
import {
  BADGE_CLASS,
  discountPercent,
} from "@/components/product/product-badge"
import { StarRating } from "@/components/product/star-rating"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card"
import { useCartCounter } from "@/hooks/use-cart-counter"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ProductCard({
  product,
  onRemove,
}: {
  product: ProductCardData
  // Wishlist only: shows a trash button beside the cart button
  onRemove?: () => void
}) {
  const { t, i18n } = useTranslation()
  const discount =
    product.price != null
      ? discountPercent({
          price: product.price,
          originalPrice: product.originalPrice,
        })
      : 0
  const hasPrice = product.price != null
  const cart = useCartCounter(
    {
      productId: product.id,
      slug: product.id,
      productUuid: product.uuid,
      name: product.name,
      brand: product.brand,
      image: product.image,
      price: product.price ?? 0,
      originalPrice: product.originalPrice,
    },
    product.listingId
  )

  return (
    <Card
      size="sm"
      className="relative h-full gap-0 py-0 transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-4/3 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            draggable={false}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 select-none group-hover/card:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
        <div className="absolute start-3 top-3 flex flex-col items-start gap-1.5">
          {product.badge && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
                BADGE_CLASS[product.badge]
              )}
            >
              {t(`landing.product.badges.${product.badge}`)}
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success backdrop-blur-sm">
              -{discount}%
            </span>
          )}
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-1.5 pt-3">
        {product.brand && (
          <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            {product.brand}
          </span>
        )}
        <CardTitle className="line-clamp-2 text-sm font-semibold text-bidi-plain">
          <Link
            to="/products/$productId"
            params={{ productId: product.id }}
            draggable={false}
            className="after:absolute after:inset-0"
          >
            {product.name}
          </Link>
        </CardTitle>
        {product.description && (
          <CardDescription className="line-clamp-2 text-xs text-bidi-plain">
            {product.description}
          </CardDescription>
        )}
        {product.rating != null && !!product.reviewCount && (
          <StarRating
            rating={product.rating}
            reviewCount={product.reviewCount}
          />
        )}
      </CardContent>

      <CardFooter className="mt-auto items-end justify-between gap-2 pt-2.5 pb-3">
        <div className="flex flex-col">
          {product.price != null ? (
            <span className="text-sm font-semibold">
              {formatPrice(product.price, i18n.language)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {t("landing.product.priceUnavailable")}
            </span>
          )}
          {hasPrice && product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice, i18n.language)}
            </span>
          )}
        </div>
        {/* The buttons sit above the card-wide link so they stay clickable */}
        <div className="relative z-10 flex shrink-0 items-center gap-2">
          {onRemove && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                aria-label={t("wishlist.removeItem", { name: product.name })}
                className="size-9 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 />
              </Button>
              <span aria-hidden className="h-6 w-px bg-border" />
            </>
          )}
          {/* Not in the cart: the cart icon (guests sign in first). In the cart: a
              − quantity + counter. Both talk to the cart API (useCartCounter) */}
          {cart.quantity > 0 ? (
            <div
              role="group"
              aria-label={t("landing.product.inCart", { name: product.name })}
              className="flex h-9 items-center rounded-full bg-brand-navy text-white dark:bg-white dark:text-brand-navy"
            >
              <button
                type="button"
                onClick={cart.decrement}
                disabled={cart.pending}
                aria-label={t(cart.quantity === 1 ? "landing.product.removeFromCart" : "productPage.decrease")}
                className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-60 dark:hover:bg-black/10"
              >
                {cart.quantity === 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}
              </button>
              <output aria-live="polite" aria-label={t("productPage.quantity")} className="min-w-5 text-center text-sm font-semibold">
                {cart.pending ? <Loader2 className="mx-auto size-3.5 animate-spin" /> : cart.quantity}
              </output>
              <button
                type="button"
                onClick={cart.increment}
                disabled={cart.pending || !cart.canIncrement}
                aria-label={t("productPage.increase")}
                className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-40 dark:hover:bg-black/10"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          ) : (
            <Button
              size="icon"
              // No price or sold out means it can't be bought now
              disabled={!hasPrice || product.inStock === false || cart.pending}
              onClick={cart.add}
              className={cn(
                "size-9 shrink-0 rounded-full bg-brand-navy text-white hover:bg-brand-navy/90 dark:bg-white dark:text-brand-navy dark:hover:bg-white/90",
                cart.error && "bg-destructive hover:bg-destructive dark:bg-destructive dark:text-white"
              )}
              aria-label={t("landing.product.addToCart", { name: product.name })}
              // The reason shows on hover; screen readers get it from the live region below
              title={cart.error ?? undefined}
            >
              {cart.pending ? <Loader2 className="animate-spin" /> : cart.error ? <X /> : <ShoppingBag />}
            </Button>
          )}
          <span aria-live="polite" className="sr-only">
            {cart.error ?? ""}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
