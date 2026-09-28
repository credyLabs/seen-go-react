import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures"
import { ArrowRight } from "lucide-react"
import { useId, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { ScrollShadows } from "@/components/home/scroll-shadows"
import {
  Carousel,
  CarouselContent,
  type CarouselApi,
} from "@/components/ui/carousel"
import { useCarouselEdges } from "@/hooks/use-carousel-edges"
import { useShiftWheelScroll } from "@/hooks/use-shift-wheel-scroll"
import { cn } from "@/lib/utils"

interface ScrollRailProps {
  eyebrow?: string
  title: string
  subtitle?: string
  seeAllLabel: string
  // TODO: make required once the listing routes exist
  seeAllHref?: string
  // Show the "see all" link from the start instead of only once scrolled to the end
  alwaysShowSeeAll?: boolean
  // Extra classes for the track, e.g. to change the gap between items
  contentClassName?: string
  // <CarouselItem>s
  children: ReactNode
}

// A titled row of items that scrolls sideways (drag, swipe or wheel), with edge
// shadows while more items are off-screen and a "see all" link
export function ScrollRail({
  eyebrow,
  title,
  subtitle,
  seeAllLabel,
  seeAllHref = "#",
  alwaysShowSeeAll = false,
  contentClassName,
  children,
}: ScrollRailProps) {
  const { i18n } = useTranslation()
  const titleId = useId()
  const [api, setApi] = useState<CarouselApi>()
  const { atEnd, canScrollPrev, canScrollNext } = useCarouselEdges(api)
  const showSeeAll = alwaysShowSeeAll || atEnd
  const [wheelGestures] = useState(() => WheelGesturesPlugin())
  useShiftWheelScroll(api)

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <span className="text-xs font-semibold tracking-widest text-brand-copper uppercase">
              {eyebrow}
            </span>
          )}
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {/* Unless always shown, only offered once the user has scrolled through every item */}
        <a
          href={seeAllHref}
          aria-hidden={!showSeeAll}
          tabIndex={showSeeAll ? undefined : -1}
          className={cn(
            "flex shrink-0 items-center gap-1.5 text-sm font-medium transition-opacity duration-300 hover:underline",
            showSeeAll ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          {seeAllLabel}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </a>
      </div>

      <Carousel
        setApi={setApi}
        plugins={[wheelGestures]}
        opts={{ align: "start", dragFree: true, direction: i18n.dir() }}
      >
        <CarouselContent
          className={cn(
            "cursor-grab py-1 select-none active:cursor-grabbing",
            contentClassName
          )}
        >
          {children}
        </CarouselContent>
        <ScrollShadows canScrollPrev={canScrollPrev} canScrollNext={canScrollNext} />
      </Carousel>
    </section>
  )
}
