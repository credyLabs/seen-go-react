import { useEffect } from "react"

import type { CarouselApi } from "@/components/ui/carousel"

// Pixels per "line" when the browser reports wheel deltas in lines (Firefox)
const LINE_HEIGHT = 40

// Lets Shift + a vertical mouse wheel scroll a horizontal carousel. Browsers
// don't all turn Shift+wheel into horizontal movement, and the wheel-gestures
// plugin only reacts to horizontal deltas.
export function useShiftWheelScroll(api: CarouselApi) {
  useEffect(() => {
    if (!api) return
    const root = api.rootNode()

    const onWheel = (event: WheelEvent) => {
      if (!event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

      const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? event.deltaY * LINE_HEIGHT
        : event.deltaY
      const engine = api.internalEngine()
      const current = engine.target.get()
      // Scrolling "down" moves forward, i.e. towards a more negative location
      const next = engine.limit.constrain(current - delta)
      // Already at the edge: leave the event alone
      if (next === current) return

      event.preventDefault()
      engine.scrollTo.distance(next - current, false)
    }

    root.addEventListener("wheel", onWheel, { passive: false })
    return () => root.removeEventListener("wheel", onWheel)
  }, [api])
}
