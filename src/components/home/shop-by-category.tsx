import { useTranslation } from "react-i18next"

import { ScrollRail } from "@/components/home/scroll-rail"
import { CarouselItem } from "@/components/ui/carousel"

export interface CategoryTile {
  id: string
  label: string
  image: string | null
}

export function ShopByCategory({
  title,
  subtitle,
  categories,
}: {
  title: string
  subtitle?: string
  categories: CategoryTile[]
}) {
  const { t } = useTranslation()

  return (
    <ScrollRail
      title={title}
      subtitle={subtitle}
      seeAllLabel={t("header.allCategories")}
      contentClassName="-ms-3"
    >
      {categories.map((category) => (
        <CarouselItem key={category.id} className="basis-auto ps-3">
          {/* TODO: link to the category listing once the search page exists */}
          <a
            href="#"
            draggable={false}
            className="flex w-28 flex-col items-center gap-2.5 rounded-2xl border bg-card px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            {category.image ? (
              <img
                src={category.image}
                alt=""
                width={56}
                height={56}
                draggable={false}
                className="size-14 rounded-xl object-cover select-none"
              />
            ) : (
              <span className="size-14 rounded-xl bg-muted" />
            )}
            <span className="text-bidi-plain line-clamp-1 text-xs font-medium">
              {category.label}
            </span>
          </a>
        </CarouselItem>
      ))}
    </ScrollRail>
  )
}
