import { Link } from "@tanstack/react-router"
import { ShoppingBag } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Product } from "@/api/products"
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
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ProductCard({ product }: { product: Product }) {
  const { t, i18n } = useTranslation()
  const discount = discountPercent(product)

  return (
    <Card size="sm" className="relative h-full gap-0 py-0 transition-shadow hover:shadow-lg">
      <div className="relative aspect-4/3 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          draggable={false}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 select-none group-hover/card:scale-105"
        />
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
        <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          {product.brand}
        </span>
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
        <CardDescription className="text-bidi-plain line-clamp-2 text-xs">
          {product.description}
        </CardDescription>
        <StarRating rating={product.rating} reviewCount={product.reviewCount} />
      </CardContent>

      <CardFooter className="mt-auto items-end justify-between gap-2 pt-2.5 pb-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            {formatPrice(product.price, i18n.language)}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice, i18n.language)}
            </span>
          )}
        </div>
        {/* Sits above the card-wide link so it stays clickable */}
        <Button
          size="icon"
          className="relative z-10 size-9 shrink-0 rounded-full bg-brand-navy text-white hover:bg-brand-navy/90 dark:bg-white dark:text-brand-navy dark:hover:bg-white/90"
          aria-label={t("landing.product.addToCart", { name: product.name })}
        >
          <ShoppingBag />
        </Button>
      </CardFooter>
    </Card>
  )
}
