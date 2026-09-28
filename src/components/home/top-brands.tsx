import { useTranslation } from "react-i18next"

import { ScrollRail } from "@/components/home/scroll-rail"
import { CarouselItem } from "@/components/ui/carousel"

// TODO: replace with brands from the API and point hrefs at brand routes
const BRANDS = [
  { id: "apple", name: "Apple", productCount: 48 },
  { id: "samsung", name: "Samsung", productCount: 62 },
  { id: "sony", name: "Sony", productCount: 39 },
  { id: "bose", name: "Bose", productCount: 21 },
  { id: "dji", name: "DJI", productCount: 18 },
  { id: "dell", name: "Dell", productCount: 27 },
  { id: "lg", name: "LG", productCount: 34 },
  { id: "asus", name: "ASUS", productCount: 29 },
  { id: "microsoft", name: "Microsoft", productCount: 15 },
  { id: "huawei", name: "Huawei", productCount: 22 },
  { id: "lenovo", name: "Lenovo", productCount: 31 },
  { id: "jbl", name: "JBL", productCount: 24 },
]

export function TopBrands() {
  const { t } = useTranslation()

  return (
    <ScrollRail
      title={t("landing.brands.title")}
      subtitle={t("landing.brands.subtitle")}
      seeAllLabel={t("landing.brands.seeAll")}
      contentClassName="-ms-3"
    >
      {BRANDS.map((brand) => (
        <CarouselItem key={brand.id} className="basis-auto ps-3">
          <a
            href="#"
            draggable={false}
            className="flex w-32 flex-col items-center gap-1 rounded-2xl border bg-card px-3 py-5 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className="line-clamp-1 text-base font-bold tracking-tight">
              {brand.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("landing.brands.productCount", { count: brand.productCount })}
            </span>
          </a>
        </CarouselItem>
      ))}
    </ScrollRail>
  )
}
