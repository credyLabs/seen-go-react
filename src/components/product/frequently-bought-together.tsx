import { Link } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { Fragment } from "react"
import { useTranslation } from "react-i18next"

import type { Product } from "@/api/products"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"

export function FrequentlyBoughtTogether({
  products,
  discount,
}: {
  // The current product first, then the suggestions
  products: Product[]
  discount: number
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const total = products.reduce((sum, product) => sum + product.price, 0) - discount

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold tracking-tight">
        {t("productPage.bundle.title")}
      </h2>
      <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border bg-card p-5 md:flex-row">
        <ul className="flex flex-wrap items-center justify-center gap-3">
          {products.map((product, index) => (
            <Fragment key={product.id}>
              {index > 0 && (
                <li aria-hidden className="text-muted-foreground">
                  <Plus className="size-4" />
                </li>
              )}
              <li>
                <Link
                  to="/products/$productId"
                  params={{ productId: product.id }}
                  title={product.name}
                  className="block size-16 overflow-hidden rounded-xl border transition-transform hover:scale-105 sm:size-20"
                >
                  <img src={product.image} alt={product.name} className="size-full object-cover" />
                </Link>
              </li>
            </Fragment>
          ))}
        </ul>

        <div className="flex w-full flex-col gap-1 md:w-80">
          <span className="text-xs text-muted-foreground">{t("productPage.bundle.total")}</span>
          <span className="text-2xl font-bold tracking-tight">{formatPrice(total, lang)}</span>
          {discount > 0 && (
            <span className="text-xs text-muted-foreground">
              {t("productPage.bundle.save", { amount: formatPrice(discount, lang) })}
            </span>
          )}
          {/* TODO: add every bundle item to the cart once it exists */}
          <Button className="mt-2 h-10 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
            {t("productPage.bundle.addToCart")}
          </Button>
        </div>
      </div>
    </section>
  )
}
