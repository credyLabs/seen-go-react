import { useQuery } from "@tanstack/react-query"
import { BadgeCheck, Check } from "lucide-react"
import { useTranslation } from "react-i18next"

import { productReviewsQueryOptions } from "@/api/product-page"
import type { ProductDetail } from "@/api/products"
import { Stars } from "@/components/product/star-rating"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatNumber } from "@/lib/format"

// Keep the active underline inside the list, which clips overflow so it can scroll on phones
const TRIGGER_CLASS =
  "h-auto flex-none px-0 pb-3 text-sm group-data-horizontal/tabs:after:bottom-0 after:bg-secondary"

// Tabs only appear when the API has content for them
export function ProductInfoTabs({ product }: { product: ProductDetail }) {
  const { t, i18n } = useTranslation()
  const hasOverview = !!product.overview || product.highlights.length > 0
  const hasSpecs = product.specs.length > 0

  return (
    <Tabs defaultValue={hasOverview ? "overview" : hasSpecs ? "specs" : "reviews"} className="gap-6">
      <TabsList variant="line" className="h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b p-0">
        {hasOverview && (
          <TabsTrigger value="overview" className={TRIGGER_CLASS}>
            {t("productPage.tabs.overview")}
          </TabsTrigger>
        )}
        {hasSpecs && (
          <TabsTrigger value="specs" className={TRIGGER_CLASS}>
            {t("productPage.tabs.specs")}
          </TabsTrigger>
        )}
        <TabsTrigger value="reviews" className={TRIGGER_CLASS}>
          {t("productPage.tabs.reviews", { count: formatNumber(product.reviewCount, i18n.language) })}
        </TabsTrigger>
      </TabsList>

      {hasOverview && (
        <TabsContent value="overview">
          <div className="grid gap-8 md:grid-cols-5">
            <p className="text-bidi-plain leading-relaxed text-muted-foreground rtl:text-right md:col-span-3">
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
      )}

      {hasSpecs && (
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
      )}

      <TabsContent value="reviews">
        <ReviewsPanel product={product} />
      </TabsContent>
    </Tabs>
  )
}

function ReviewsPanel({ product }: { product: ProductDetail }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { data, isPending, isError } = useQuery(productReviewsQueryOptions(product.uuid))

  return (
    <div className="flex flex-col gap-4">
      {product.reviewCount > 0 && (
        <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
          <span className="text-4xl font-bold tracking-tight">{product.rating.toFixed(1)}</span>
          <div className="flex flex-col gap-1">
            <Stars rating={product.rating} className="size-4" />
            <span className="text-xs text-muted-foreground">
              {t("productPage.reviewsBasedOn", {
                count: product.reviewCount,
                formatted: formatNumber(product.reviewCount, lang),
              })}
            </span>
          </div>
        </div>
      )}

      {isPending ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">{t("productPage.reviewsError")}</p>
      ) : data.reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("productPage.noWrittenReviews")}</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-xl border bg-card">
          {data.reviews.map((review) => (
            <li key={review.id} className="flex flex-col gap-1.5 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <Stars rating={review.rating} />
                {review.title && <span className="text-bidi-plain text-sm font-semibold">{review.title}</span>}
              </div>
              {review.body && (
                <p className="text-bidi-plain text-sm leading-relaxed text-muted-foreground rtl:text-right">
                  {review.body}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <time dateTime={review.createdAt}>
                  {new Date(review.createdAt).toLocaleDateString(lang, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    numberingSystem: "latn",
                  })}
                </time>
                {review.isVerifiedPurchase && (
                  <span className="flex items-center gap-1 text-success">
                    <BadgeCheck className="size-3.5" />
                    {t("productPage.verifiedPurchase")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
