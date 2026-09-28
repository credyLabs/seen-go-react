import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute, notFound } from "@tanstack/react-router"
import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"

import { productPageQueryOptions } from "@/api/products"
import { ProductRail } from "@/components/home/product-rail"
import { ServiceHighlights } from "@/components/home/service-highlights"
import { FrequentlyBoughtTogether } from "@/components/product/frequently-bought-together"
import { ProductGallery } from "@/components/product/product-gallery"
import { ProductInfoTabs } from "@/components/product/product-info-tabs"
import { ProductPerks } from "@/components/product/product-perks"
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
import { formatNumber } from "@/lib/format"

export const Route = createFileRoute("/_public/products/$productId")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      productPageQueryOptions(params.productId, i18n.language)
    )
    if (!data) throw notFound()
  },
  component: ProductPage,
  notFoundComponent: ProductNotFound,
})

function ProductPage() {
  const { productId } = Route.useParams()
  const { t, i18n } = useTranslation()
  const { data } = useSuspenseQuery(productPageQueryOptions(productId, i18n.language))
  // The loader already threw notFound() for unknown ids
  if (!data) return null
  const { product, similar, alsoViewed, bundle } = data
  const category = t(`header.categories.${product.category}`)

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6">
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/" />}>{t("home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {/* TODO: link to the category page once it exists */}
              <BreadcrumbLink href="#">{category}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-bidi-plain line-clamp-1">
                {product.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
          <ProductGallery media={product.gallery} name={product.name} badge={product.badge} />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-widest text-brand-copper uppercase">
                {product.brand} · {category}
              </span>
              <h1 className="text-bidi-plain text-3xl font-bold tracking-tight lg:text-4xl">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <StarRating rating={product.rating} reviewCount={product.reviewCount} />
                <span aria-hidden className="text-muted-foreground">·</span>
                <span className="font-medium">
                  {t("productPage.readReviews", {
                    count: product.reviewCount,
                    formatted: formatNumber(product.reviewCount, i18n.language),
                  })}
                </span>
                <span aria-hidden className="text-muted-foreground">·</span>
                {product.inStock ? (
                  <span className="flex items-center gap-1 text-success">
                    <Check className="size-3.5" />
                    {t("productPage.inStock")}
                  </span>
                ) : (
                  <span className="text-destructive">{t("productPage.outOfStock")}</span>
                )}
              </div>
            </div>

            <ProductPurchase product={product} />
            <ProductPerks brand={product.brand} warrantyYears={product.warrantyYears} />
          </div>
        </div>
      </div>

      <ProductInfoTabs product={product} />

      {product.bundle && bundle.length > 0 && (
        <FrequentlyBoughtTogether
          products={[product, ...bundle]}
          discount={product.bundle.discount}
        />
      )}

      <ProductRail
        title={t("productPage.similar")}
        seeAllLabel={t("productPage.seeAllSimilar")}
        products={similar}
      />
      <ProductRail
        title={t("productPage.alsoViewed")}
        seeAllLabel={t("productPage.seeAllProducts")}
        products={alsoViewed}
      />
      <ServiceHighlights />
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
