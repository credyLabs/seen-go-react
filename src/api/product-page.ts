import { queryOptions } from "@tanstack/react-query"

import { fetchCachedCategoryTree, flattenCategories } from "@/api/categories"
import { endpoints, withQuery } from "@/api/endpoints"
import { itemBadge, itemPrice, type HomeItem } from "@/api/home"
import { ApiError, request } from "@/api/http"
import type { ProductCardData, ProductDetail, ProductMedia } from "@/api/products"
import { queryClient } from "@/lib/query-client"

// Product page data, all from the catalogue API: GET /catalogue/products/{slug},
// its related-product and review endpoints, and the footer benefits. Nothing is
// filled in locally; anything the API doesn't send is simply not shown.

interface ApiMedia {
  cdnUrl: string
  mediaType: "IMAGE" | "VIDEO" | string
  altText: string | null
  sortOrder: number
}

interface ApiVariant {
  variantId: string
  name: string
  option1Name: string | null
  option1Value: string | null
  option2Name: string | null
  option2Value: string | null
  lowestPrice: number | null
  sellerCount: number
  sellers: { available: number; listingId?: string; price?: number | null }[]
}

interface ApiProductDetail {
  product: {
    id: string
    slug: string
    name: string
    brandId: string | null
    categoryId: string | null
    description: string | null
    shortDescription: string | null
    badgeTag?: string | null
    originalPrice?: number | null
    discountAmount?: number | null
    averageRating?: number | null
    reviewCount?: number | null
  }
  media: ApiMedia[]
  variants: ApiVariant[]
  specifications: { name: string; value: string }[]
  quantityLimits?: { minimum: number; maximum: number }
  originalPrice?: number | null
  discountAmount?: number | null
  discountPercent?: number | null
  averageRating?: number | null
  reviewCount?: number | null
  badgeTag?: string | null
}

// Product-card shape returned by /similar, /recommendations, /customers-also-viewed
// and /catalogue/products/search
export interface ApiProductCard {
  product: {
    id: string
    slug: string
    name: string
    brandId?: string | null
    description?: string | null
    shortDescription?: string | null
  }
  primaryImageUrl: string | null
  media?: { cdnUrl: string; mediaType: string }[]
  shortDescription?: string | null
  originalPrice?: number | null
  discountAmount?: number | null
  averageRating?: number | null
  reviewCount?: number | null
  badgeTag?: string | null
  // Approved-review summary (search results)
  ratingSummary?: { averageRating: number | null; reviewCount: number | null }
  priceSummary?: {
    lowestPrice: number | null
    highestPrice?: number | null
    // Search results repeat the list price and advertised discount here
    originalPrice?: number | null
    discountAmount?: number | null
  }
  // Lowest-priced in-stock offer; null when nobody has stock
  bestListing?: { listingId: string; price: number; compareAtPrice?: number | null; inStock?: boolean } | null
}

interface NamedItem {
  id: string
  name: string
}

const RELATED_LIMIT = 10
const VISITOR_KEY = "seengo-visitor-id"

// Stable anonymous id for view tracking (never an email or token)
export function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

// "noiseCancellation" -> "Noise cancellation"; "true" -> "Yes"
function specLabel(name: string) {
  const words = name.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function specValue(value: string) {
  if (value === "true") return "Yes"
  if (value === "false") return "No"
  return value
}

// Reuses the home helpers, which understand the same price/badge fields
function asHomeItem(fields: Partial<HomeItem>): HomeItem {
  return { id: "", itemType: "PRODUCT", referenceId: null, label: null, imageUrl: null, linkUrl: null, sortOrder: 0, ...fields }
}

export function cardFromApi(card: ApiProductCard, brands: Map<string, string>): ProductCardData {
  const { price, originalPrice } = itemPrice(
    asHomeItem({
      offerPrice: card.bestListing?.price ?? card.priceSummary?.lowestPrice ?? null,
      // A seller's own "was" price goes with its price; otherwise the product's list price
      originalPrice: card.bestListing
        ? (card.bestListing.compareAtPrice ?? card.originalPrice ?? card.priceSummary?.originalPrice)
        : (card.originalPrice ?? card.priceSummary?.originalPrice),
      discountAmount: card.discountAmount ?? card.priceSummary?.discountAmount,
    })
  )
  // Search results carry the counts in ratingSummary; the other lists at the top level
  const reviewCount = card.reviewCount ?? card.ratingSummary?.reviewCount ?? undefined
  return {
    id: card.product.slug,
    uuid: card.product.id,
    listingId: card.bestListing?.listingId,
    name: card.product.name,
    image: card.primaryImageUrl ?? card.media?.find((m) => m.mediaType !== "VIDEO")?.cdnUrl ?? null,
    brand: card.product.brandId ? brands.get(card.product.brandId) : undefined,
    description: card.shortDescription ?? card.product.shortDescription ?? undefined,
    badge: itemBadge(asHomeItem({ badgeTag: card.badgeTag })),
    rating: card.averageRating ?? card.ratingSummary?.averageRating ?? undefined,
    reviewCount,
    price,
    originalPrice,
  }
}

function toProductDetail(
  data: ApiProductDetail,
  brands: Map<string, string>,
  categories: Map<string, string>
): ProductDetail {
  const { product } = data
  // Sellers' lowest variant price once listed; until then list price minus the advertised discount
  const listed = data.variants.map((v) => v.lowestPrice).filter((p): p is number => p != null)
  const { price, originalPrice } = itemPrice(
    asHomeItem({
      offerPrice: listed.length ? Math.min(...listed) : null,
      originalPrice: data.originalPrice ?? product.originalPrice,
      discountAmount: data.discountAmount ?? product.discountAmount,
    })
  )
  const media = [...data.media].sort((a, b) => a.sortOrder - b.sortOrder)
  const images = media.filter((m) => m.mediaType !== "VIDEO")
  const gallery: ProductMedia[] = media.map((m) => {
    const alt = m.altText ?? undefined
    return m.mediaType === "VIDEO"
      ? { type: "video", src: m.cdnUrl, poster: images[0]?.cdnUrl ?? "", alt }
      : { type: "image", src: m.cdnUrl, alt }
  })

  // Stock is only known once sellers list the product
  const stockOf = (sellers: { available: number }[] = []) =>
    sellers.length ? sellers.some((seller) => seller.available > 0) : undefined
  const inStock = stockOf(data.variants.flatMap((variant) => variant.sellers ?? []))

  const specs = data.specifications.map((spec) => ({ label: specLabel(spec.name), value: specValue(spec.value) }))

  const variants = data.variants.map((variant) => ({
    id: variant.variantId,
    name: variant.name,
    options: [
      [variant.option1Name, variant.option1Value],
      [variant.option2Name, variant.option2Value],
    ].flatMap(([name, value]) => (name && value ? [{ name, value }] : [])),
    price: variant.lowestPrice,
    inStock: stockOf(variant.sellers),
    // Cheapest seller with stock
    listingId: [...(variant.sellers ?? [])]
      .filter((seller) => seller.available > 0 && seller.listingId)
      .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0]?.listingId,
  }))

  return {
    id: product.slug,
    uuid: product.id,
    brand: (product.brandId && brands.get(product.brandId)) || "",
    name: product.name,
    description: product.shortDescription ?? product.description ?? "",
    image: images[0]?.cdnUrl ?? "",
    categoryName: product.categoryId ? categories.get(product.categoryId) : undefined,
    badge: itemBadge(asHomeItem({ badgeTag: data.badgeTag ?? product.badgeTag })),
    rating: data.averageRating ?? product.averageRating ?? 0,
    reviewCount: data.reviewCount ?? product.reviewCount ?? 0,
    price: price ?? 0,
    originalPrice,
    gallery,
    variants,
    discountPercent: data.discountPercent ?? undefined,
    overview: product.description ?? product.shortDescription ?? "",
    // The overview's checklist: the API has no highlights field, so the key specifications
    highlights: specs.map((spec) => `${spec.label}: ${spec.value}`),
    specs,
    inStock,
    minQuantity: data.quantityLimits?.minimum,
    maxQuantity: data.quantityLimits?.maximum,
  }
}

// Brand and category names for the ids on products. Plain objects so React
// Query can cache them; fetched once per session. The category tree is the
// same cached request the header mega menu uses.
async function fetchNames() {
  const [brands, categories] = await Promise.all([
    request<NamedItem[]>(endpoints.catalogue.brands).catch(() => []),
    fetchCachedCategoryTree().then(flattenCategories).catch(() => []),
  ])
  const toRecord = (items: NamedItem[]) => Object.fromEntries(items.map((item) => [item.id, item.name]))
  return { brands: toRecord(brands), categories: toRecord(categories) }
}

const namesQueryOptions = queryOptions({
  queryKey: ["catalogue", "names"],
  queryFn: fetchNames,
  staleTime: Infinity,
})

export const fetchCachedNames = () => queryClient.fetchQuery(namesQueryOptions)

async function fetchCards(url: string, headers?: Record<string, string>) {
  const data = await request<{ items: ApiProductCard[] }>(withQuery(url, { limit: RELATED_LIMIT }), { headers }).catch(
    () => ({ items: [] as ApiProductCard[] })
  )
  return data.items
}

// Only the product itself, so navigating between products is quick; the
// related rows and reviews load separately. null when the slug doesn't exist.
export async function fetchProduct(slug: string): Promise<ProductDetail | null> {
  try {
    const [data, names] = await Promise.all([
      request<ApiProductDetail>(endpoints.products.bySlug(slug)),
      fetchCachedNames(),
    ])
    return toProductDetail(data, new Map(Object.entries(names.brands)), new Map(Object.entries(names.categories)))
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export interface RelatedProducts {
  similar: ProductCardData[]
  alsoViewed: ProductCardData[]
  // "recommended" when the behavioural list was empty and recommendations filled in
  alsoViewedKind: "alsoViewed" | "recommended"
}

async function fetchRelatedProducts(uuid: string, slug: string): Promise<RelatedProducts> {
  const [similar, alsoViewed, recommended, names] = await Promise.all([
    fetchCards(endpoints.products.similar(uuid)),
    fetchCards(endpoints.products.customersAlsoViewed(uuid), { "X-Visitor-Id": visitorId() }),
    fetchCards(endpoints.products.recommendations(uuid)),
    fetchCachedNames(),
  ])
  const brands = new Map(Object.entries(names.brands))
  const notSelf = (card: ApiProductCard) => card.product.slug !== slug
  // New visitors have no viewing history yet, so recommendations stand in
  const useRecommended = alsoViewed.length === 0
  return {
    similar: similar.filter(notSelf).map((card) => cardFromApi(card, brands)),
    alsoViewed: (useRecommended ? recommended : alsoViewed).filter(notSelf).map((card) => cardFromApi(card, brands)),
    alsoViewedKind: useRecommended ? "recommended" : "alsoViewed",
  }
}

// POST /catalogue/products/{id}/view — feeds "customers also viewed"; failures are ignored
export function recordProductView(uuid: string, token: string | null) {
  void request(endpoints.products.recordView(uuid), {
    method: "POST",
    token,
    headers: token ? undefined : { "X-Visitor-Id": visitorId() },
  }).catch(() => {})
}

export const productPageQueryOptions = (slug: string, lang: string) =>
  queryOptions({
    queryKey: ["products", slug, lang],
    // lang is in the key so switching language refetches; send it once the API localizes content
    queryFn: () => fetchProduct(slug),
  })

export const relatedProductsQueryOptions = (uuid: string, slug: string, lang: string) =>
  queryOptions({
    queryKey: ["products", slug, lang, "related"],
    queryFn: () => fetchRelatedProducts(uuid, slug),
  })

// GET /orders/products/{id}/frequently-bought-together (order service). Its items
// carry no price, so each one's product page data is loaded (and cached) for it.
interface ApiBoughtTogether {
  items: { variantId: string; purchaseCount: number; product: { id: string; slug: string; name: string } }[]
  source: string
}

async function fetchBoughtTogether(uuid: string, lang: string): Promise<ProductDetail[]> {
  const data = await request<ApiBoughtTogether>(endpoints.products.frequentlyBoughtTogether(uuid))
  const products = await Promise.all(
    data.items.map((item) =>
      queryClient.fetchQuery(productPageQueryOptions(item.product.slug, lang)).catch(() => null)
    )
  )
  return products.filter((product): product is ProductDetail => product != null)
}

export const frequentlyBoughtTogetherQueryOptions = (uuid: string, lang: string) =>
  queryOptions({
    queryKey: ["products", uuid, lang, "bought-together"],
    // The order service may be down or have no history yet; the section is then hidden
    queryFn: () => fetchBoughtTogether(uuid, lang).catch(() => []),
  })

// GET /catalogue/products/{id}/reviews
export interface ProductReview {
  id: string
  rating: number
  title: string | null
  body: string | null
  isVerifiedPurchase: boolean
  createdAt: string
}

export interface ProductReviews {
  summary: { averageRating: number; reviewCount: number }
  reviews: ProductReview[]
}

export const productReviewsQueryOptions = (uuid: string) =>
  queryOptions({
    queryKey: ["products", uuid, "reviews"],
    queryFn: () => request<ProductReviews>(endpoints.products.reviews(uuid)),
  })

// GET /catalogue/footer-benefits — the service strip under the product
export interface FooterBenefit {
  id: string
  title: string | null
  description: string | null
  // Frontend icon name, e.g. "shield-check"
  icon: string | null
  iconUrl: string | null
  linkUrl: string | null
  sortOrder: number
}

export const footerBenefitsQueryOptions = queryOptions({
  queryKey: ["catalogue", "footer-benefits"],
  queryFn: async () => {
    const data = await request<{ items: FooterBenefit[] }>(endpoints.catalogue.footerBenefits)
    return [...data.items].sort((a, b) => a.sortOrder - b.sortOrder)
  },
  staleTime: 30 * 60 * 1000,
})
