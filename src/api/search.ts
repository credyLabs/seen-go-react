import { queryOptions } from "@tanstack/react-query"

import { endpoints, withQuery } from "@/api/endpoints"
import { request } from "@/api/http"
import { cardFromApi, fetchCachedNames, type ApiProductCard } from "@/api/product-page"
import type { ProductCardData } from "@/api/products"

// Header search suggestions: the first few matching products from
// GET /catalogue/products/search, fetched once the user pauses typing.
// Each keeps its brand id, so picking one can open that brand's results.

const MAX_SUGGESTIONS = 6
// Shorter queries match nearly everything, so wait for a second character
export const MIN_QUERY_LENGTH = 2

export interface SearchSuggestion extends ProductCardData {
  brandId: string | null
}

export async function fetchSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const q = query.trim()
  if (q.length < MIN_QUERY_LENGTH) return []
  const [data, names] = await Promise.all([
    request<{ items: ApiProductCard[] }>(withQuery(endpoints.products.search, { q, page: 0, size: MAX_SUGGESTIONS })),
    fetchCachedNames(),
  ])
  const brands = new Map(Object.entries(names.brands))
  return data.items.map((item) => ({ ...cardFromApi(item, brands), brandId: item.product.brandId ?? null }))
}

export const searchSuggestionsQueryOptions = (query: string, lang: string) =>
  queryOptions({
    queryKey: ["search", "suggestions", lang, query.trim().toLowerCase()],
    queryFn: () => fetchSearchSuggestions(query),
    enabled: query.trim().length >= MIN_QUERY_LENGTH,
    staleTime: 60 * 1000,
  })
