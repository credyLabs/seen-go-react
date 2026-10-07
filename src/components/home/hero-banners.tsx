import { useQuery } from "@tanstack/react-query"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"

import {
  activeItems,
  homeQueryOptions,
  itemBadge,
  itemPrice,
  itemSlug,
  sortSections,
  type HomeSection,
} from "@/api/home"
import { HeroCarousel, type HeroSlide } from "@/components/home/hero-carousel"

// One slide per product in each BANNER section: the product's badge (or the
// campaign title) is the pill, its name, short description, price and photo
// fill the rest. A banner section without products becomes one slide from its
// own fields.
function toSlides(sections: HomeSection[], t: TFunction): HeroSlide[] {
  return sortSections(sections)
    .filter((section) => section.type === "BANNER")
    .flatMap((section) => {
      const products = activeItems(section).filter((item) => item.itemType === "PRODUCT")
      if (products.length === 0) {
        return [
          {
            id: section.id,
            title: section.title,
            tagline: section.subtitle,
            image: section.imageUrl,
          },
        ]
      }
      return products.map((item) => {
        const badge = itemBadge(item)
        return {
          id: item.id,
          eyebrow: badge ? t(`landing.product.badges.${badge}`) : section.title,
          title: item.label ?? item.name ?? section.title,
          tagline: item.shortDescription ?? item.description ?? section.subtitle,
          image: item.primaryImageUrl ?? item.imageUrl ?? section.imageUrl,
          price: itemPrice(item).price,
          productSlug: itemSlug(item),
        }
      })
    })
}

// Hero carousel from the BANNER sections of GET /catalogue/home. Shares the
// cached home query with the sections below, so it's one request; on error the
// hero is simply left out (the sections below show the retry message).
export function HeroBanners() {
  const { t, i18n } = useTranslation()
  const { data, isPending, isError } = useQuery(homeQueryOptions(i18n.language))

  if (isPending) {
    return <div className="aspect-1156/346 w-full animate-pulse rounded-2xl bg-muted" />
  }
  if (isError) return null

  const slides = toSlides(data.sections, t)
  return slides.length > 0 ? <HeroCarousel slides={slides} /> : null
}
