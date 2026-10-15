import { Link } from "@tanstack/react-router"
import { Check, ImageOff, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { ListingProduct } from "@/api/listing"
import { StarRating } from "@/components/product/star-rating"
import { Button } from "@/components/ui/button"
import { useAddToCart } from "@/hooks/use-add-to-cart"
import { formatPrice } from "@/lib/format"

// One product in the listing's list view: photo, brand, name, description,
// rating and stock on the start side; price and Add to Cart on the end side
export function ListingRow({ product }: { product: ListingProduct }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const cart = useAddToCart()
  const canBuy = product.price != null && product.inStock !== false

  return (
    <article className="relative flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-md sm:flex-row sm:items-center">
      <div className="aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-28">
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-6" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {product.brand && (
          <span className="text-[11px] font-semibold tracking-wider text-brand-copper uppercase">{product.brand}</span>
        )}
        <h2 className="text-bidi-plain line-clamp-2 font-semibold text-primary rtl:text-right dark:text-foreground">
          {/* The whole row opens the product */}
          <Link
            to="/products/$productId"
            params={{ productId: product.id }}
            className="after:absolute after:inset-0 after:rounded-2xl"
          >
            {product.name}
          </Link>
        </h2>
        {product.description && (
          <p className="text-bidi-plain line-clamp-2 text-xs text-muted-foreground rtl:text-right">
            {product.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {product.rating != null && !!product.reviewCount && (
            <StarRating rating={product.rating} reviewCount={product.reviewCount} />
          )}
          {product.inStock !== undefined && (
            <>
              {product.rating != null && !!product.reviewCount && (
                <span aria-hidden className="text-muted-foreground">·</span>
              )}
              {product.inStock ? (
                <span className="flex items-center gap-1 text-success">
                  <Check className="size-3.5" />
                  {t("listing.inStock")}
                </span>
              ) : (
                <span className="text-destructive">{t("listing.outOfStock")}</span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-end justify-between gap-3 sm:w-40 sm:flex-col sm:items-end">
        <div className="flex flex-col sm:items-end">
          {product.price != null ? (
            <span className="text-xl font-bold tracking-tight">{formatPrice(product.price, lang)}</span>
          ) : (
            <span className="text-xs text-muted-foreground">{t("landing.product.priceUnavailable")}</span>
          )}
          {product.price != null && product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice, lang)}
            </span>
          )}
        </div>
        {/* Above the row-wide link so it stays clickable. Guests sign in first; then
            POST /cart/items with the seller listing */}
        <Button
          disabled={!canBuy || cart.adding}
          onClick={() =>
            cart.add(
              {
                productId: product.id,
                slug: product.id,
                productUuid: product.uuid,
                name: product.name,
                brand: product.brand,
                image: product.image,
                price: product.price!,
                originalPrice: product.originalPrice,
              },
              product.listingId
            )
          }
          className="relative z-10 h-9 rounded-full bg-secondary px-5 text-secondary-foreground hover:bg-secondary/90 sm:w-full"
        >
          {cart.adding && <Loader2 className="animate-spin" />}
          {cart.status === "added" && <Check />}
          {t(cart.adding ? "listing.adding" : cart.status === "added" ? "listing.added" : "listing.addToCart")}
        </Button>
        {cart.error && (
          <p role="alert" className="relative z-10 text-end text-xs text-destructive sm:max-w-40">
            {cart.error}
          </p>
        )}
      </div>
    </article>
  )
}

// One product in the listing's grid view, as in the design: photo, brand,
// name, rating, price and a full-width Add to Cart button
export function ListingCard({ product }: { product: ListingProduct }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const cart = useAddToCart()
  const canBuy = product.price != null && product.inStock !== false

  return (
    <article className="relative flex h-full flex-col gap-3 rounded-2xl border bg-card p-3 shadow-xs transition-shadow hover:shadow-md">
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-muted">
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-6" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-1">
        {product.brand && (
          <span className="text-[11px] font-semibold tracking-wider text-brand-copper uppercase">{product.brand}</span>
        )}
        <h2 className="text-bidi-plain line-clamp-2 text-sm font-semibold text-primary rtl:text-right dark:text-foreground">
          {/* The whole card opens the product */}
          <Link to="/products/$productId" params={{ productId: product.id }} className="after:absolute after:inset-0 after:rounded-2xl">
            {product.name}
          </Link>
        </h2>
        {product.rating != null && !!product.reviewCount && (
          <StarRating rating={product.rating} reviewCount={product.reviewCount} />
        )}
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          {product.price != null ? (
            <span className="text-base font-bold tracking-tight">{formatPrice(product.price, lang)}</span>
          ) : (
            <span className="text-xs text-muted-foreground">{t("landing.product.priceUnavailable")}</span>
          )}
          {product.price != null && product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice, lang)}</span>
          )}
        </div>
      </div>

      {/* Above the card-wide link so it stays clickable. Guests sign in first; then
          POST /cart/items with the seller listing */}
      <Button
        disabled={!canBuy || cart.adding}
        onClick={() =>
          cart.add(
            {
              productId: product.id,
              slug: product.id,
              productUuid: product.uuid,
              name: product.name,
              brand: product.brand,
              image: product.image,
              price: product.price!,
              originalPrice: product.originalPrice,
            },
            product.listingId
          )
        }
        className="relative z-10 h-9 w-full rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
      >
        {cart.adding && <Loader2 className="animate-spin" />}
        {cart.status === "added" && <Check />}
        {t(cart.adding ? "listing.adding" : cart.status === "added" ? "listing.added" : "listing.addToCart")}
      </Button>
      {cart.error && (
        <p role="alert" className="relative z-10 text-center text-xs text-destructive">
          {cart.error}
        </p>
      )}
    </article>
  )
}
