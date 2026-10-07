import { Link } from "@tanstack/react-router"
import Autoplay from "embla-carousel-autoplay"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

const AUTOPLAY_DELAY_MS = 5000

export interface HeroSlide {
  id: string
  // Small pill above the title, e.g. the campaign name
  eyebrow?: string | null
  title: string
  tagline?: string | null
  image: string | null
  price?: number | null
  // Product the slide opens, if any
  productSlug?: string | null
}

// Gold tagline from the banner design
const TAGLINE_CLASS = "text-[#e2a72e]"

function HeroSlideContent({ slide, eager }: { slide: HeroSlide; eager: boolean }) {
  const { t, i18n } = useTranslation()

  const content = (
    <>
      <div className="flex flex-1 flex-col justify-center gap-1.5 p-5 sm:gap-2.5 sm:ps-[5%] sm:pe-6">
        {slide.eyebrow && (
          <span className="text-bidi-plain mb-1 w-fit rounded-full bg-white px-3 py-1 text-[10px] font-semibold tracking-widest text-brand-navy uppercase sm:text-[11px]">
            {slide.eyebrow}
          </span>
        )}
        <h2 className="text-bidi-plain line-clamp-2 text-xl font-semibold tracking-tight rtl:text-right sm:text-3xl">
          {slide.title}
        </h2>
        {slide.tagline && (
          <p className={cn("text-bidi-plain line-clamp-2 text-sm font-semibold rtl:text-right sm:text-lg", TAGLINE_CLASS)}>
            {slide.tagline}
          </p>
        )}
        {slide.price != null && (
          <p className="text-xs text-white/75 sm:text-sm">
            {t("landing.hero.startingFrom")}
            <span className="ms-2 text-sm font-bold text-white sm:text-base">
              {formatPrice(slide.price, i18n.language)}
            </span>
          </p>
        )}
      </div>

      {/* Product photo as a framed panel, inset from the end edge like the design */}
      <div className="relative w-2/5 shrink-0 shadow-[0_0_32px_rgb(0_0_0/0.35)] sm:me-[9%] sm:w-[31%]">
        {slide.image && (
          <img
            src={slide.image}
            alt={slide.title}
            draggable={false}
            loading={eager ? "eager" : "lazy"}
            className="absolute inset-0 size-full object-cover select-none"
          />
        )}
      </div>
    </>
  )

  const className =
    "flex min-h-48 overflow-hidden rounded-2xl bg-brand-navy text-white sm:aspect-1156/346 sm:min-h-0"

  // The whole banner opens the product it features
  return slide.productSlug ? (
    <Link
      to="/products/$productId"
      params={{ productId: slide.productSlug }}
      draggable={false}
      className={className}
    >
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}

// Arrows stay hidden until the carousel is hovered or a control has keyboard focus
const ARROW_CLASS =
  "h-16 w-7 rounded-md border-0 bg-white/80 text-foreground shadow-md backdrop-blur-sm transition-opacity duration-200 hover:bg-white disabled:opacity-0 dark:bg-black/60 dark:hover:bg-black/80 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:hidden"

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const { t, i18n } = useTranslation()
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)
  // A single banner is shown as a still image: no autoplay, dragging, arrows or dots
  const isCarousel = slides.length > 1

  // Create the plugin once so re-renders don't reset autoplay
  const [autoplay] = useState(() =>
    Autoplay({ delay: AUTOPLAY_DELAY_MS, stopOnInteraction: false })
  )

  useEffect(() => {
    if (!api) return
    const onSelect = () => setSelected(api.selectedScrollSnap())
    api.on("select", onSelect)
    api.on("reInit", onSelect)
    return () => {
      api.off("select", onSelect)
      api.off("reInit", onSelect)
    }
  }, [api])

  return (
    <section aria-label={t("landing.hero.label")}>
      <Carousel
        setApi={setApi}
        plugins={isCarousel ? [autoplay] : []}
        opts={{ loop: isCarousel, watchDrag: isCarousel, direction: i18n.dir() }}
        className="group"
      >
        <CarouselContent className={cn(isCarousel && "cursor-grab active:cursor-grabbing")}>
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id}>
              <HeroSlideContent slide={slide} eager={index === 0} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {isCarousel && (
          <>
            <CarouselPrevious className={cn(ARROW_CLASS, "start-4")} />
            <CarouselNext className={cn(ARROW_CLASS, "end-4")} />
          </>
        )}

        {/* Overlaid on the slides; the banners are dark so the dots are white */}
        {isCarousel && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 sm:bottom-4">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={t("landing.hero.goToSlide", { number: index + 1 })}
                aria-current={index === selected}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "h-2 rounded-full shadow-sm transition-all",
                  index === selected
                    ? "w-6 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        )}
      </Carousel>
    </section>
  )
}
