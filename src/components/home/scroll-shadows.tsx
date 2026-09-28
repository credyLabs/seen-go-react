import { cn } from "@/lib/utils"

// An ellipse anchored on the edge fades out towards the top, bottom and
// inner side, so the shadow has no hard straight edge
const SHADOW_CLASS =
  "pointer-events-none absolute inset-y-0 z-10 w-12 transition-opacity duration-300 [--shadow:rgb(0_0_0/0.14)] dark:[--shadow:rgb(0_0_0/0.4)]"
// Class names are spelled out in full so Tailwind can find them
const LEFT_SHADOW =
  "bg-[radial-gradient(farthest-side_at_left,var(--shadow),transparent)] rtl:bg-[radial-gradient(farthest-side_at_right,var(--shadow),transparent)]"
const RIGHT_SHADOW =
  "bg-[radial-gradient(farthest-side_at_right,var(--shadow),transparent)] rtl:bg-[radial-gradient(farthest-side_at_left,var(--shadow),transparent)]"

// Edge shadows inside a <Carousel> hinting that more items are off-screen
export function ScrollShadows({
  canScrollPrev,
  canScrollNext,
}: {
  canScrollPrev: boolean
  canScrollNext: boolean
}) {
  return (
    <>
      <div
        aria-hidden
        className={cn(
          SHADOW_CLASS,
          "start-0",
          LEFT_SHADOW,
          canScrollPrev ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        aria-hidden
        className={cn(
          SHADOW_CLASS,
          "end-0",
          RIGHT_SHADOW,
          canScrollNext ? "opacity-100" : "opacity-0"
        )}
      />
    </>
  )
}
