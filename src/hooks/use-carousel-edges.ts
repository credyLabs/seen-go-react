import { useEffect, useState } from "react"

import type { CarouselApi } from "@/components/ui/carousel"

// Whether the carousel can still scroll back / forward. Both start false so
// anything gated on `atEnd` still shows when every item already fits.
export function useCarouselEdges(api: CarouselApi) {
  const [edges, setEdges] = useState({ canScrollPrev: false, canScrollNext: false })

  useEffect(() => {
    if (!api) return
    const update = () => {
      const canScrollPrev = api.canScrollPrev()
      const canScrollNext = api.canScrollNext()
      setEdges((prev) =>
        prev.canScrollPrev === canScrollPrev && prev.canScrollNext === canScrollNext
          ? prev
          : { canScrollPrev, canScrollNext }
      )
    }
    api.on("reInit", update)
    api.on("scroll", update)
    api.on("settle", update)
    // Embla is already initialised by the time we get the api
    queueMicrotask(update)
    return () => {
      api.off("reInit", update)
      api.off("scroll", update)
      api.off("settle", update)
    }
  }, [api])

  return { ...edges, atEnd: !edges.canScrollNext }
}
