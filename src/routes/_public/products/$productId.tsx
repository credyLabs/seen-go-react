import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute, notFound } from "@tanstack/react-router"
import { Check } from "lucide-react"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

import {
  footerBenefitsQueryOptions,
  productPageQueryOptions,
  recordProductView,
  relatedProductsQueryOptions,
} from "@/api/product-page"
import type { ProductDetail } from "@/api/products"
import { ProductRail } from "@/components/home/product-rail"
import { ServiceHighlights } from "@/components/home/service-highlights"
import { ProductGallery } from "@/components/product/product-gallery"
import { ProductInfoTabs } from "@/components/product/product-info-tabs"
import { ProductPurchase } from "@/components/product/product-purchase"
import { StarRating } from "@/components/product/star-rating"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { buttonVariants } from "@/components/ui/button"
import i18n from "@/i18n"
import { useAuth } from "@/lib/auth"
import { formatNumber } from "@/lib/format"

export const Route = createFileRoute("/_public/products/$productId")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(
      productPageQueryOptions(params.productId, i18n.language)
    )
    if (!product) throw notFound()
  },
  component: ProductPage,
  pendingComponent: ProductPending,
  // Show the skeleton quickly when moving between products
  pendingMs: 200,
  notFoundComponent: ProductNotFound,
})

function ProductPage() {
  const { productId } = Route.useParams()
  const { i18n } = useTranslation()
  const { data: product } = useSuspenseQuery(productPageQueryOptions(productId, i18n.language))
  // The loader already threw notFound() for unknown slugs
  if (!product) return null
  // Keyed by product so moving between products resets the gallery, colour and quantity
  return <ProductContent key={product.id} product={product} />
}

// Everything shown here comes from the catalogue API; sections without data are left out
function ProductContent({ product }: { product: ProductDetail }) {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()

  // Related rows load separately so the product shows sooner
  const related = useQuery(relatedProductsQueryOptions(product.uuid, product.id, i18n.language))
  const benefits = useQuery(footerBenefitsQueryOptions)

  // Record the view once after it renders. The ref keeps React's dev-mode
  // double effects from posting it twice.
  const recorded = useRef(false)
  useEffect(() => {
    if (recorded.current) return
    recorded.current = true
    recordProductView(product.uuid, token)
  }, [product.uuid, token])

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6">
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/" />}>{t("home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {product.categoryName && (
              <>
                {/* Plain text until there's a category page to link to */}
                <BreadcrumbItem>{product.categoryName}</BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage className="text-bidi-plain line-clamp-1">
                {product.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
          <ProductGallery product={product} />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {(product.brand || product.categoryName) && (
                <span className="text-[11px] font-semibold tracking-widest text-brand-copper uppercase">
                  {[product.brand, product.categoryName].filter(Boolean).join(" · ")}
                </span>
              )}
              <h1 className="text-bidi-plain text-3xl font-bold tracking-tight lg:text-4xl">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {product.reviewCount > 0 && (
                  <>
                    <StarRating rating={product.rating} reviewCount={product.reviewCount} />
                    <span aria-hidden className="text-muted-foreground">·</span>
                    <span className="font-medium">
                      {t("productPage.readReviews", {
                        count: product.reviewCount,
                        formatted: formatNumber(product.reviewCount, i18n.language),
                      })}
                    </span>
                  </>
                )}
                {/* Only when sellers report stock; the API has no listing for most products yet */}
                {product.inStock !== undefined && (
                  <>
                    {product.reviewCount > 0 && <span aria-hidden className="text-muted-foreground">·</span>}
                    {product.inStock ? (
                      <span className="flex items-center gap-1 text-success">
                        <Check className="size-3.5" />
                        {t("productPage.inStock")}
                      </span>
                    ) : (
                      <span className="text-destructive">{t("productPage.outOfStock")}</span>
                    )}
                  </>
                )}
              </div>
            </div>

            <ProductPurchase product={product} />
          </div>
        </div>
      </div>

      <ProductInfoTabs product={product} />

      {/* No "see all" links: there are no listing pages to send them to yet */}
      <ProductRail title={t("productPage.similar")} products={related.data?.similar ?? []} />
      <ProductRail
        title={t(
          related.data?.alsoViewedKind === "recommended" ? "productPage.recommended" : "productPage.alsoViewed"
        )}
        products={related.data?.alsoViewed ?? []}
      />
      {benefits.data && benefits.data.length > 0 && (
        <ServiceHighlights
          items={benefits.data.map((benefit) => ({
            id: benefit.id,
            title: benefit.title ?? "",
            description: benefit.description,
            iconKey: benefit.icon,
            linkUrl: benefit.linkUrl,
          }))}
        />
      )}
    </div>
  )
}

function ProductPending() {
  const { t } = useTranslation()
  return (
    <div role="status" aria-label={t("productPage.loading")} className="flex animate-pulse flex-col gap-6">
      <div className="h-4 w-64 rounded bg-muted" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="aspect-square rounded-2xl bg-muted" />
        <div className="flex flex-col gap-4">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-10 w-3/4 rounded bg-muted" />
          <div className="h-56 rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  )
}

function ProductNotFound() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">{t("productPage.notFound.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("productPage.notFound.body")}</p>
      <Link to="/" className={buttonVariants({ className: "rounded-full" })}>
        {t("productPage.notFound.back")}
      </Link>
    </div>
  )
}
