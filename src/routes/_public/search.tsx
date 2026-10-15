import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react"
import { useTranslation } from "react-i18next"

import { categoryTreeQueryOptions, flattenCategories } from "@/api/categories"
import { DEFAULT_SORT, LISTING_SORTS, listingQueryOptions, type ListingSort } from "@/api/listing"
import { footerBenefitsQueryOptions } from "@/api/product-page"
import { BrandError, BrandLoader } from "@/components/brand/brand-status"
import { ServiceHighlights } from "@/components/home/service-highlights"
import { ListingFilters, type FilterValues } from "@/components/listing/listing-filters"
import { ListingCard, ListingRow } from "@/components/listing/listing-row"
import { Pagination } from "@/components/orders/pagination"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Product listing / search results: GET /catalogue/products/search. Every
// filter, the sort, page and view live in the URL, so results can be shared
// and the back button steps through them. The URL uses the API's own names
// (q, categoryIds, brandIds, minPrice, maxPrice, minRating, inStock, sort).

type View = "list" | "grid"

export interface ListingSearch extends FilterValues {
  q?: string
  sort?: ListingSort
  // 1-based in the URL; the API is 0-based
  page?: number
  view?: View
}

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined)
const positive = (value: unknown) => (Number(value) > 0 ? Number(value) : undefined)
// "id1,id2" (or an array) -> "id1,id2", the API's comma-separated form
const ids = (value: unknown) => {
  const list = (Array.isArray(value) ? value : String(value ?? "").split(",")).map((id) => String(id).trim()).filter(Boolean)
  return list.length ? list.join(",") : undefined
}
const splitIds = (value?: string) => (value ? value.split(",") : undefined)

export const Route = createFileRoute("/_public/search")({
  validateSearch: (search: Record<string, unknown>): ListingSearch => ({
    q: text(search.q),
    categoryIds: ids(search.categoryIds),
    brandIds: ids(search.brandIds),
    minPrice: positive(search.minPrice),
    maxPrice: positive(search.maxPrice),
    minRating: Number(search.minRating) > 0 && Number(search.minRating) <= 5 ? Number(search.minRating) : undefined,
    inStock: search.inStock === true || search.inStock === "true" ? true : undefined,
    sort: LISTING_SORTS.includes(search.sort as ListingSort) ? (search.sort as ListingSort) : undefined,
    page: Number(search.page) > 1 ? Math.floor(Number(search.page)) : undefined,
    view: search.view === "grid" ? "grid" : undefined,
  }),
  component: ListingPage,
})

function ListingPage() {
  const { t, i18n } = useTranslation()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { q, categoryIds, brandIds, minPrice, maxPrice, minRating, inStock, sort, page = 1, view = "list" } = search

  const results = useQuery({
    ...listingQueryOptions(
      {
        q,
        categoryIds: splitIds(categoryIds),
        brandIds: splitIds(brandIds),
        minPrice,
        maxPrice,
        minRating,
        inStock,
        sort,
        page: page - 1,
      },
      i18n.language
    ),
    // Keep the current results on screen while the next filter/page loads
    placeholderData: keepPreviousData,
  })
  const { data: tree = [] } = useQuery(categoryTreeQueryOptions)
  const benefits = useQuery(footerBenefitsQueryOptions)

  // One or more picked categories: their names, e.g. "Audio & Headphones, Gaming"
  const allCategories = flattenCategories(tree)
  const categoryName =
    splitIds(categoryIds)
      ?.map((id) => allCategories.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(", ") || undefined
  const title = categoryName ?? (q ? t("listing.resultsFor", { q }) : t("listing.allProducts"))

  // Any filter change starts again from page 1
  const update = (patch: Partial<ListingSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, page: undefined, ...patch }) })
  const hasFilters = !!(categoryIds || brandIds || minPrice || maxPrice || minRating || inStock)
  const clearFilters = () =>
    void navigate({ search: (prev) => ({ q: prev.q, sort: prev.sort, view: prev.view }) })

  const items = results.data?.items ?? []
  // Top of the price slider: the highest price in the results, rounded up
  const highest = Math.max(0, ...items.map((item) => item.highestPrice ?? item.price ?? 0))
  const priceCeiling = Math.max(100, Math.ceil(highest / 100) * 100)

  const filters = (
    <ListingFilters
      values={{ categoryIds, brandIds, minPrice, maxPrice, minRating, inStock }}
      priceCeiling={priceCeiling}
      onChange={update}
    />
  )

  return (
    <div className="flex flex-col gap-10">
      <div className="grid items-start gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        {/* Sidebar on large screens; a collapsible panel above the results on small ones */}
        <aside aria-label={t("listing.filters")} className="hidden lg:block">
          {filters}
        </aside>
        <details className="group rounded-2xl border bg-card p-4 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="size-4" />
            {t("listing.filters")}
          </summary>
          <div className="mt-4">{filters}</div>
        </details>

        <section aria-labelledby="listing-title" className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h1 id="listing-title" className="text-bidi-plain text-2xl font-bold tracking-tight text-primary rtl:text-right dark:text-foreground">
                {title}
              </h1>
              {results.data && (
                <p className="text-xs text-muted-foreground">
                  {t("listing.productsFound", { count: results.data.totalItems })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={sort ?? DEFAULT_SORT}
                // The default isn't written to the URL
                onValueChange={(value) => update({ sort: value && value !== DEFAULT_SORT ? (value as ListingSort) : undefined })}
              >
                <SelectTrigger aria-label={t("listing.sortBy")} className="h-8 rounded-full bg-card text-xs">
                  <span className="text-muted-foreground">{t("listing.sortBy")}</span>
                  <SelectValue>
                    {(value: string) => (
                      <span className="font-semibold">{t(`listing.sort.${value}`)}</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end" alignItemWithTrigger={false}>
                  {LISTING_SORTS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`listing.sort.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div role="radiogroup" aria-label={t("listing.view")} className="flex gap-1">
                {(
                  [
                    ["grid", LayoutGrid, "listing.gridView"],
                    ["list", List, "listing.listView"],
                  ] as const
                ).map(([value, Icon, label]) => (
                  <Button
                    key={value}
                    variant="ghost"
                    size="icon"
                    role="radio"
                    aria-checked={view === value}
                    aria-label={t(label)}
                    onClick={() => void navigate({ search: (prev) => ({ ...prev, view: value === "grid" ? "grid" : undefined }) })}
                    className={cn(
                      "size-8 rounded-md",
                      view === value && "bg-brand-navy text-white hover:bg-brand-navy/90 hover:text-white"
                    )}
                  >
                    <Icon />
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {results.isPending ? (
            <BrandLoader label={t("listing.loading")} className="rounded-2xl border bg-card" />
          ) : results.isError ? (
            <BrandError
              title={t("listing.error.title")}
              body={t("listing.error.body")}
              onRetry={() => void results.refetch()}
              retrying={results.isFetching}
              className="rounded-2xl border bg-card px-5"
            />
          ) : items.length === 0 ? (
            // Filters stay selected so the shopper can loosen them
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-5 py-16 text-center">
              <h2 className="text-lg font-semibold">{t("listing.empty.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("listing.empty.body")}</p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters} className="rounded-full">
                  {t("listing.empty.clear")}
                </Button>
              )}
            </div>
          ) : (
            <div className={cn("transition-opacity", results.isPlaceholderData && "opacity-60")}>
              {view === "grid" ? (
                <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {items.map((item) => (
                    <li key={item.id}>
                      <ListingCard product={item} />
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="flex flex-col gap-3">
                  {items.map((item) => (
                    <li key={item.id}>
                      <ListingRow product={item} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {results.data && (
            <Pagination
              page={page}
              totalPages={results.data.totalPages}
              onChange={(next) => {
                void navigate({ search: (prev) => ({ ...prev, page: next > 1 ? next : undefined }) })
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              className="mt-4 justify-center"
            />
          )}
        </section>
      </div>

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
