import { useTranslation } from "react-i18next"

import {
  activeItems,
  itemPrice,
  itemSlug,
  sortSections,
  type HomeSection,
} from "@/api/home"
import { HeroCarousel, type HeroSlide } from "@/components/home/hero-carousel"
import { useHomeData } from "@/stores/home-store"

// One slide per BANNER item in the BANNER sections, filled from the item's
// fields (the ready-made banner image in imageUrl isn't used)
function toSlides(sections: HomeSection[]): HeroSlide[] {
  return sortSections(sections)
    .filter((section) => section.type === "BANNER")
    .flatMap((section) =>
      activeItems(section)
        .filter((item) => item.itemType === "BANNER")
        .map((item) => {
          const title = item.name ?? item.label ?? section.title
          return {
            id: item.id,
            // Shown exactly as sent, e.g. "HOT"
            eyebrow: item.badgeTag,
            title,
            // The label is the marketing line; when it just repeats the name, use the subtitle
            tagline: item.label && item.label !== title ? item.label : item.subtitle,
            price: itemPrice(item).price,
            bgColor: item.bgColor,
            image: item.productImageUrl ?? item.primaryImageUrl ?? null,
            productSlug: itemSlug(item),
          }
        })
    )
}

// Hero carousel from the BANNER sections of GET /catalogue/home. Reads the home
// store, shared with the sections below, so it's one request.
export function HeroBanners() {
  const { i18n } = useTranslation()
  const { data } = useHomeData(i18n.language)
  // The home page shows the loader and error states for the whole page
  if (!data) return null

  const slides = toSlides(data.sections)
  return slides.length > 0 ? <HeroCarousel slides={slides} /> : null
}
