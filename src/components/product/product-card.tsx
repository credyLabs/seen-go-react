import { Link } from "@tanstack/react-router"
import { ImageOff, ShoppingBag } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { ProductCardData } from "@/api/products"
import { BADGE_CLASS, discountPercent } from "@/components/product/product-badge"
import { StarRating } from "@/components/product/star-rating"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useCartStore } from "@/stores/cart-store"

export function ProductCard({ product }: { product: ProductCardData }) {
  const { t, i18n } = useTranslation()
  const discount =
    product.price != null
      ? discountPercent({ price: product.price, originalPrice: product.originalPrice })
      : 0
  const hasPrice = product.price != null
  const requireAuth = useRequireAuth()
  const addToCart = useCartStore((state) => state.addItem)

  return (
    <Card size="sm" className="relative h-full gap-0 py-0 transition-shadow hover:shadow-lg">
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
        <CardTitle className="text-bidi-plain line-clamp-2 text-sm font-semibold">
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
          <CardDescription className="text-bidi-plain line-clamp-2 text-xs">
            {product.description}
          </CardDescription>
        )}
        {product.rating != null && !!product.reviewCount && (
          <StarRating rating={product.rating} reviewCount={product.reviewCount} />
        )}
      </CardContent>

      <CardFooter className="mt-auto items-end justify-between gap-2 pt-2.5 pb-3">
        <div className="flex flex-col">
          {product.price != null ? (
            <span className="text-sm font-semibold">
              {formatPrice(product.price, i18n.language)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{t("landing.product.priceUnavailable")}</span>
          )}
          {hasPrice && product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice, i18n.language)}
            </span>
          )}
        </div>
        {/* Sits above the card-wide link so it stays clickable */}
        {/* Guests sign in first. TODO: send bestListing.listingId to POST /cart/items once the cart API is wired */}
        <Button
          size="icon"
          // No price means it can't be bought yet
          disabled={!hasPrice}
          onClick={() =>
            requireAuth(() =>
              addToCart({
                productId: product.id,
                slug: product.id,
                name: product.name,
                brand: product.brand,
                image: product.image,
                price: product.price!,
                originalPrice: product.originalPrice,
              })
            )
          }
          className="relative z-10 size-9 shrink-0 rounded-full bg-brand-navy text-white hover:bg-brand-navy/90 dark:bg-white dark:text-brand-navy dark:hover:bg-white/90"
          aria-label={t("landing.product.addToCart", { name: product.name })}
        >
          <ShoppingBag />
        </Button>
      </CardFooter>
    </Card>
  )
}
