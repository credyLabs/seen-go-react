import { ArrowRight } from "lucide-react"
import { useId } from "react"
import { useTranslation } from "react-i18next"

import laptopImage from "@/assets/laptop.jpg"
import samsungImage from "@/assets/product-2.png"
import headphonesImage from "@/assets/product-3.png"
import gamingSetupImage from "@/assets/product-6.jpg"

// TODO: point hrefs at collection routes once they exist, and swap in dedicated
// images for back-to-work and creators-kit (these reuse product shots for now)
const COLLECTIONS = [
  { key: "backToWork", image: headphonesImage },
  { key: "creatorsKit", image: samsungImage },
  { key: "familyBundles", image: gamingSetupImage },
  { key: "travelLight", image: laptopImage },
] as const

export function CuratedCollections() {
  const { t } = useTranslation()
  const titleId = useId()

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <div>
        <h2 id={titleId} className="text-2xl font-semibold tracking-tight">
          {t("landing.collections.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("landing.collections.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {COLLECTIONS.map(({ key, image }) => (
          <a
            key={key}
            href="#"
            className="group relative isolate flex aspect-3/4 flex-col justify-end overflow-hidden rounded-2xl p-4 text-white shadow-sm transition-shadow hover:shadow-lg sm:p-5"
          >
            <img
              src={image}
              alt=""
              loading="lazy"
              className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Darken the lower half so the copy stays readable on any photo */}
            <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/90 via-black/45 to-black/5" />

            <span className="text-[10px] font-semibold tracking-widest text-brand-copper uppercase sm:text-xs">
              {t(`landing.collections.items.${key}.eyebrow`)}
            </span>
            <h3 className="mt-1 text-lg font-semibold tracking-tight sm:text-2xl">
              {t(`landing.collections.items.${key}.title`)}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-xs text-white/75 sm:text-sm">
              {t(`landing.collections.items.${key}.description`)}
            </p>
            <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-brand-navy">
              {t("landing.collections.explore")}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
