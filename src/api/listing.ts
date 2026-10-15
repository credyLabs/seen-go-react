import { queryOptions } from "@tanstack/react-query"

import { endpoints, withQuery } from "@/api/endpoints"
import { request } from "@/api/http"
import { cardFromApi, fetchCachedNames, type ApiProductCard } from "@/api/product-page"
import type { ProductCardData } from "@/api/products"

// GET /catalogue/products/search — the product listing / search results page

export const LISTING_SORTS = ["popularity", "newest", "price_asc", "price_desc", "name_asc", "name_desc"] as const
export type ListingSort = (typeof LISTING_SORTS)[number]
// Used when the URL doesn't pick a sort
export const DEFAULT_SORT: ListingSort = "popularity"

export const LISTING_PAGE_SIZE = 24

export interface ListingFilters {
  q?: string
  categoryIds?: string[]
  brandIds?: string[]
  minPrice?: number
  maxPrice?: number
  minRating?: number
  inStock?: boolean
  sort?: ListingSort
  // 0-based, as the API expects
  page: number
}

export interface ListingProduct extends ProductCardData {
  // From bestListing: true when someone has stock, false when nobody does, unknown without offers
  inStock?: boolean
  // Highest offer price, used to size the price slider
  highestPrice?: number | null
}

export interface ListingResult {
  items: ListingProduct[]
  totalItems: number
  totalPages: number
}

interface ApiSearchResponse {
  items: (ApiProductCard & { offers?: unknown[] })[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

async function searchProducts(filters: ListingFilters): Promise<ListingResult> {
  const url = withQuery(endpoints.products.search, {
    q: filters.q?.trim(),
    categoryIds: filters.categoryIds,
    brandIds: filters.brandIds,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minRating: filters.minRating,
    // The API defaults to false; only send it when the filter is on
    inStock: filters.inStock || undefined,
    sort: filters.sort ?? DEFAULT_SORT,
    page: filters.page,
    size: LISTING_PAGE_SIZE,
  })
  const [data, names] = await Promise.all([request<ApiSearchResponse>(url), fetchCachedNames()])
  const brands = new Map(Object.entries(names.brands))
  return {
    items: data.items.map((item) => ({
      ...cardFromApi(item, brands),
      // No offers at all means stock is unknown, not "out of stock"
      inStock: item.bestListing ? item.bestListing.inStock !== false : item.offers?.length ? false : undefined,
      highestPrice: item.priceSummary?.highestPrice ?? item.originalPrice ?? null,
    })),
    totalItems: data.totalItems,
    totalPages: data.totalPages,
  }
}

export const listingQueryOptions = (filters: ListingFilters, lang: string) =>
  queryOptions({
    queryKey: ["catalogue", "search", lang, filters],
    queryFn: () => searchProducts(filters),
  })

// GET /catalogue/brands — the brand filter's options
export interface Brand {
  id: string
  name: string
  logoUrl?: string | null
}

export const brandsQueryOptions = queryOptions({
  queryKey: ["catalogue", "brands"],
  queryFn: async () => {
    const brands = await request<Brand[]>(endpoints.catalogue.brands)
    return [...brands].sort((a, b) => a.name.localeCompare(b.name))
  },
  staleTime: Infinity,
})
