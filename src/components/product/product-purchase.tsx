import { ArrowLeftRight, Check, Minus, Plus, Share2, ShoppingBag } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { ProductDetail } from "@/api/products"
import { discountPercent } from "@/components/product/product-badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

const INSTALLMENT_MONTHS = 12
const MAX_QUANTITY = 10
const COPIED_RESET_MS = 2000

export function ProductPurchase({ product }: { product: ProductDetail }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [colorIndex, setColorIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [copied, setCopied] = useState(false)
  const discount = discountPercent(product)
  const color = product.colors[colorIndex]

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
      <div>
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
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t("productPage.vatNote", {
            amount: formatPrice(Math.round(product.price / INSTALLMENT_MONTHS), lang),
          })}
        </p>
      </div>

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
            disabled={quantity >= MAX_QUANTITY}
            onClick={() => setQuantity((q) => q + 1)}
            className="flex size-10 items-center justify-center rounded-full disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {/* TODO: wire to the cart and checkout once they exist */}
        <Button
          variant="outline"
          disabled={!product.inStock}
          className="h-10 min-w-36 flex-1 rounded-full"
        >
          <ShoppingBag />
          {t("productPage.addToCart")}
        </Button>
        <Button
          disabled={!product.inStock}
          className="h-10 min-w-36 flex-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          {t("productPage.buyNow")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* TODO: wire to product comparison once it exists */}
        <Button variant="outline" size="sm" className="h-7 rounded-full text-xs">
          <ArrowLeftRight />
          {t("productPage.addToCompare")}
        </Button>
        <Button variant="outline" size="sm" className="h-7 rounded-full text-xs" onClick={share}>
          {copied ? <Check /> : <Share2 />}
          {t(copied ? "productPage.linkCopied" : "productPage.share")}
        </Button>
      </div>
    </div>
  )
}
