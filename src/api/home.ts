import { queryOptions } from "@tanstack/react-query"

import { endpoints } from "@/api/endpoints"
import { request } from "@/api/http"
import type { ProductBadge } from "@/api/products"

// GET /catalogue/home — the landing page is built from these sections.
// Shapes follow the deployed response, which differs from the spec in places.

export type HomeSectionType =
  | "BANNER"
  | "COLLECTION"
  | "DEALS"
  | "TRENDING"
  | "FEATURED"
  | "BRANDS"
  | "FOOTER_BENEFIT"
  | "FOOTER_LINK_GROUP"

export type HomeItemType = "PRODUCT" | "CATEGORY" | "BRAND" | "BENEFIT" | "FOOTER_LINK"

export interface HomeItem {
  id: string
  itemType: HomeItemType
  // Product/category/brand UUID; null for benefits and links
  referenceId: string | null
  label: string | null
  imageUrl: string | null
  linkUrl: string | null
  sortOrder: number
  // Older responses sent these; newer ones drop them (treat a missing isActive as active)
  isActive?: boolean
  description?: string | null
  // Frontend icon name for benefits, e.g. "shield-check"
  iconKey?: string | null

  // PRODUCT items also carry card data
  name?: string
  slug?: string
  shortDescription?: string | null
  primaryImageUrl?: string | null
  // e.g. "NEW", "DEAL", "HOT"
  badgeTag?: string | null
  currency?: string
  // Selling price once sellers list the product; null until then
  offerPrice?: number | null
  lowestPrice?: number | null
  originalPrice?: number | null
  discountAmount?: number | null
  discountPercent?: number | null
  averageRating?: number | null
  reviewCount?: number | null
  product?: {
    // Lowest-priced in-stock offer; null when nobody sells it yet
    bestListing: { listingId: string; price: number } | null
  }
}

export interface HomeSection {
  id: string
  key: string
  // Unknown future types are ignored by the page
  type: HomeSectionType | (string & {})
  title: string
  subtitle: string | null
  imageUrl: string | null
  linkUrl: string | null
  sortOrder: number
  items: HomeItem[]
}

export interface HomeResponse {
  sections: HomeSection[]
}

export function fetchHome() {
  return request<HomeResponse>(endpoints.catalogue.home)
}

export const homeQueryOptions = (lang: string) =>
  queryOptions({
    queryKey: ["catalogue", "home", lang],
    // lang is in the key so switching language refetches; send it once the API localizes content
    queryFn: fetchHome,
  })

const bySortOrder = (a: { sortOrder: number }, b: { sortOrder: number }) =>
  a.sortOrder - b.sortOrder

// Active items in display order
export function activeItems(section: HomeSection) {
  return section.items.filter((item) => item.isActive !== false).sort(bySortOrder)
}

export function sortSections(sections: HomeSection[]) {
  return [...sections].sort(bySortOrder)
}

// "/catalogue/products/sony-wh-1000xm6" -> "sony-wh-1000xm6". The listing paths
// (deals, trending, featured, search) aren't product pages.
const LISTING_SLUGS = new Set(["deals", "trending", "featured", "search"])

export function productSlugFromLink(linkUrl: string | null | undefined) {
  const match = linkUrl?.match(/^\/catalogue\/products\/([^/?#]+)$/)
  return match && !LISTING_SLUGS.has(match[1]) ? decodeURIComponent(match[1]) : null
}

export function itemSlug(item: HomeItem) {
  return item.slug ?? productSlugFromLink(item.linkUrl)
}

// Price to show for a product item. Until sellers list it there's no offer
// price, so fall back to the list price minus the advertised discount.
export function itemPrice(item: HomeItem): { price: number | null; originalPrice?: number } {
  const listed = item.offerPrice ?? item.lowestPrice ?? item.product?.bestListing?.price ?? null
  const original = item.originalPrice ?? null
  const price =
    listed ?? (original != null ? original - (item.discountAmount ?? 0) : null)
  return {
    price,
    originalPrice: original != null && price != null && original > price ? original : undefined,
  }
}

const BADGES: Record<string, ProductBadge> = {
  NEW: "new",
  DEAL: "deal",
  HOT: "hot",
  BESTSELLER: "bestseller",
  BEST_SELLER: "bestseller",
}

export function itemBadge(item: HomeItem): ProductBadge | undefined {
  return item.badgeTag ? BADGES[item.badgeTag.toUpperCase()] : undefined
}
