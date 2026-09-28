import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { ProductDetail } from "@/api/products"
import { Stars } from "@/components/product/star-rating"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatNumber } from "@/lib/format"

// Keep the active underline inside the list, which clips overflow so it can scroll on phones
const TRIGGER_CLASS =
  "h-auto flex-none px-0 pb-3 text-sm group-data-horizontal/tabs:after:bottom-0 after:bg-secondary"

export function ProductInfoTabs({ product }: { product: ProductDetail }) {
  const { t, i18n } = useTranslation()

  return (
    <Tabs defaultValue="overview" className="gap-6">
      <TabsList variant="line" className="h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b p-0">
        <TabsTrigger value="overview" className={TRIGGER_CLASS}>
          {t("productPage.tabs.overview")}
        </TabsTrigger>
        <TabsTrigger value="specs" className={TRIGGER_CLASS}>
          {t("productPage.tabs.specs")}
        </TabsTrigger>
        <TabsTrigger value="reviews" className={TRIGGER_CLASS}>
          {t("productPage.tabs.reviews", { count: formatNumber(product.reviewCount, i18n.language) })}
        </TabsTrigger>
        <TabsTrigger value="delivery" className={TRIGGER_CLASS}>
          {t("productPage.tabs.delivery")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid gap-8 md:grid-cols-5">
          <p className="text-bidi-plain leading-relaxed rtl:text-right text-muted-foreground md:col-span-3">
            {product.overview}
          </p>
          {product.highlights.length > 0 && (
            <ul className="flex flex-col gap-2 md:col-span-2">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-brand-copper" />
                  <span className="text-bidi-plain">{highlight}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </TabsContent>

      <TabsContent value="specs">
        <dl className="divide-y overflow-hidden rounded-xl border bg-card">
          {product.specs.map((spec) => (
            <div key={spec.label} className="grid grid-cols-3 gap-4 px-4 py-3">
              <dt className="text-bidi-plain text-muted-foreground rtl:text-right">{spec.label}</dt>
              <dd className="text-bidi-plain col-span-2 rtl:text-right">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </TabsContent>

      <TabsContent value="reviews">
        {/* TODO: list individual reviews once the reviews API exists */}
        <div className="flex flex-wrap items-center gap-6 rounded-xl border bg-card p-5">
          <div className="flex flex-col gap-1">
            <span className="text-4xl font-bold tracking-tight">{product.rating.toFixed(1)}</span>
            <Stars rating={product.rating} className="size-4" />
            <span className="text-xs text-muted-foreground">
              {t("productPage.reviewsBasedOn", {
                count: product.reviewCount,
                formatted: formatNumber(product.reviewCount, i18n.language),
              })}
            </span>
          </div>
          <Button variant="outline" className="ms-auto rounded-full">
            {t("productPage.writeReview")}
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="delivery">
        <div className="grid gap-4 md:grid-cols-3">
          {(["delivery", "returns", "warranty"] as const).map((key) => (
            <div key={key} className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold">{t(`productPage.policies.${key}.title`)}</h3>
              <p className="mt-1 text-muted-foreground">
                {t(`productPage.policies.${key}.body`, {
                  count: product.warrantyYears,
                  brand: product.brand,
                })}
              </p>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
