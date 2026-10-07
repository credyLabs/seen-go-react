import { ArrowRight } from "lucide-react"
import { useId } from "react"
import { useTranslation } from "react-i18next"

export interface CollectionCard {
  id: string
  title: string
  description?: string | null
  image: string | null
}

export function CuratedCollections({
  title,
  subtitle,
  collections,
}: {
  title: string
  subtitle?: string
  collections: CollectionCard[]
}) {
  const { t } = useTranslation()
  const titleId = useId()

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <div>
        <h2 id={titleId} className="text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {collections.map((collection) => (
          // TODO: link to the collection listing once the search page exists
          <a
            key={collection.id}
            href="#"
            className="group relative isolate flex aspect-3/4 flex-col justify-end overflow-hidden rounded-2xl bg-brand-navy p-4 text-white shadow-sm transition-shadow hover:shadow-lg sm:p-5"
          >
            {collection.image && (
              <img
                src={collection.image}
                alt=""
                loading="lazy"
                className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            {/* Darken the lower half so the copy stays readable on any photo */}
            <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/90 via-black/45 to-black/5" />

            <h3 className="text-bidi-plain text-lg font-semibold tracking-tight sm:text-2xl">
              {collection.title}
            </h3>
            {collection.description && (
              <p className="text-bidi-plain mt-1.5 line-clamp-2 text-xs text-white/75 sm:text-sm">
                {collection.description}
              </p>
            )}
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
