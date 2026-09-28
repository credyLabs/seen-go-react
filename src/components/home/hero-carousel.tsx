import Autoplay from "embla-carousel-autoplay"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import heroSlide1 from "@/assets/seen-go-carousal-1.png"
import heroSlide2 from "@/assets/seen-go-carousal-2.png"
import heroSlide3 from "@/assets/seen-go-carousal-3.png"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

const AUTOPLAY_DELAY_MS = 5000

// TODO: replace with banners from the API once it exists
const SLIDES = [
  { src: heroSlide1, alt: "Sony WH-1000XM6 — Industry-leading noise cancellation" },
  { src: heroSlide2, alt: "PlayStation 5 Pro — Next-gen gaming experience" },
  { src: heroSlide3, alt: "iPhone 15 Pro Max — Titanium. So strong. So light." },
]

// Arrows stay hidden until the carousel is hovered or a control has keyboard focus
const ARROW_CLASS =
  "h-16 w-7 rounded-md border-0 bg-white/80 text-foreground shadow-md backdrop-blur-sm transition-opacity duration-200 hover:bg-white disabled:opacity-0 dark:bg-black/60 dark:hover:bg-black/80 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:hidden"

export function HeroCarousel() {
  const { t, i18n } = useTranslation()
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)

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
        plugins={[autoplay]}
        opts={{ loop: true, direction: i18n.dir() }}
        className="group"
      >
        <CarouselContent className="cursor-grab active:cursor-grabbing">
          {SLIDES.map((slide, index) => (
            <CarouselItem key={slide.src}>
              {/* The banners have 16px corners baked in at 1156x346; the % radius
                  scales with the image so the clip always matches them */}
              <img
                src={slide.src}
                alt={slide.alt}
                width={1156}
                height={346}
                draggable={false}
                loading={index === 0 ? "eager" : "lazy"}
                className="aspect-1156/346 w-full rounded-[1.384%/4.624%] object-cover select-none"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className={cn(ARROW_CLASS, "start-4")} />
        <CarouselNext className={cn(ARROW_CLASS, "end-4")} />

        {/* Overlaid on the slides; the banners are dark so the dots are white */}
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 sm:bottom-4">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.src}
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
      </Carousel>
    </section>
  )
}
