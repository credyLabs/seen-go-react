import { useTranslation } from "react-i18next"

import {
  activeItems,
  itemBadge,
  itemPrice,
  itemSlug,
  type HomeItem,
  type HomeSection as HomeSectionData,
} from "@/api/home"
import type { ProductCardData } from "@/api/products"
import { CuratedCollections } from "@/components/home/curated-collections"
import { ProductRail } from "@/components/home/product-rail"
import { ShopByCategory } from "@/components/home/shop-by-category"
import { TopBrands } from "@/components/home/top-brands"

function toProductCard(item: HomeItem): ProductCardData {
  const { price, originalPrice } = itemPrice(item)
  return {
    id: itemSlug(item) ?? item.referenceId ?? item.id,
    name: item.name ?? item.label ?? "",
    image: item.primaryImageUrl ?? item.imageUrl,
    description: item.shortDescription ?? item.description ?? undefined,
    badge: itemBadge(item),
    rating: item.averageRating ?? undefined,
    reviewCount: item.reviewCount ?? undefined,
    price,
    originalPrice,
  }
}

// Eyebrow and "see all" copy for each product row; titles come from the API
const PRODUCT_ROWS = {
  DEALS: { eyebrow: "landing.deals.eyebrow", seeAll: "landing.deals.seeAll", alwaysShowSeeAll: false },
  TRENDING: { eyebrow: "landing.trending.eyebrow", seeAll: "landing.trending.seeAll", alwaysShowSeeAll: false },
  FEATURED: { eyebrow: "landing.featured.eyebrow", seeAll: "landing.featured.seeAll", alwaysShowSeeAll: true },
} as const

// Renders one /catalogue/home section by its type. Hero banners and the
// benefits strip are placed by the page itself.
export function HomeSection({ section }: { section: HomeSectionData }) {
  const { t } = useTranslation()
  const items = activeItems(section)
  if (items.length === 0) return null
  const subtitle = section.subtitle ?? undefined

  if (section.type in PRODUCT_ROWS) {
    const row = PRODUCT_ROWS[section.type as keyof typeof PRODUCT_ROWS]
    return (
      <ProductRail
        eyebrow={t(row.eyebrow)}
        title={section.title}
        subtitle={subtitle}
        seeAllLabel={t(row.seeAll)}
        alwaysShowSeeAll={row.alwaysShowSeeAll}
        products={items.filter((item) => item.itemType === "PRODUCT").map(toProductCard)}
      />
    )
  }

  switch (section.type) {
    case "COLLECTION":
      // Category tiles for "Shop by category"; anything else is a curated collection
      return items.every((item) => item.itemType === "CATEGORY") ? (
        <ShopByCategory
          title={section.title}
          subtitle={subtitle}
          categories={items.map((item) => ({
            id: item.id,
            label: item.label ?? "",
            image: item.imageUrl,
          }))}
        />
      ) : (
        <CuratedCollections
          title={section.title}
          subtitle={subtitle}
          collections={items.map((item) => ({
            id: item.id,
            title: item.label ?? "",
            description: item.description,
            image: item.imageUrl,
          }))}
        />
      )
    case "BRANDS":
      return (
        <TopBrands
          title={section.title}
          subtitle={subtitle}
          brands={items.map((item) => ({
            id: item.id,
            name: item.label ?? "",
            logoUrl: item.imageUrl,
          }))}
        />
      )
    default:
      return null
  }
}
