import { useTranslation } from "react-i18next"

import accessoriesImage from "@/assets/accessories.png"
import cameraImage from "@/assets/camera.png"
import gamingImage from "@/assets/gaming.png"
import headphonesImage from "@/assets/headphones.png"
import laptopImage from "@/assets/laptop.jpg"
import smartphonesImage from "@/assets/smartphones.png"
import smartwatchImage from "@/assets/smartwatch.png"
import tabletImage from "@/assets/tablet.png"
import { ScrollRail } from "@/components/home/scroll-rail"
import { CarouselItem } from "@/components/ui/carousel"

// TODO: replace with categories from the API and point hrefs at category routes
const CATEGORIES = [
  { key: "smartphones", image: smartphonesImage },
  { key: "laptops", image: laptopImage },
  { key: "audio", image: headphonesImage },
  { key: "wearables", image: smartwatchImage },
  { key: "tablets", image: tabletImage },
  { key: "gaming", image: gamingImage },
  { key: "cameras", image: cameraImage },
  { key: "accessories", image: accessoriesImage },
  { key: "earbuds", image: headphonesImage },
  { key: "monitors", image: laptopImage },
  { key: "consoles", image: gamingImage },
  { key: "fitnessTrackers", image: smartwatchImage },
  { key: "eReaders", image: tabletImage },
  { key: "drones", image: cameraImage },
  { key: "chargers", image: accessoriesImage },
  { key: "refurbished", image: smartphonesImage },
] as const

export function ShopByCategory() {
  const { t } = useTranslation()

  return (
    <ScrollRail
      title={t("landing.categories.title")}
      subtitle={t("landing.categories.subtitle")}
      seeAllLabel={t("header.allCategories")}
      contentClassName="-ms-3"
    >
      {CATEGORIES.map((category) => (
        <CarouselItem key={category.key} className="basis-auto ps-3">
          <a
            href="#"
            draggable={false}
            className="flex w-28 flex-col items-center gap-2.5 rounded-2xl border bg-card px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <img
              src={category.image}
              alt=""
              width={56}
              height={56}
              draggable={false}
              className="size-14 rounded-xl object-cover select-none"
            />
            <span className="line-clamp-1 text-xs font-medium">
              {t(`header.categories.${category.key}`)}
            </span>
          </a>
        </CarouselItem>
      ))}
    </ScrollRail>
  )
}
