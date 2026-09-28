import { Heart, Play } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { ProductBadge, ProductMedia } from "@/api/products"
import { BADGE_CLASS } from "@/components/product/product-badge"
import { VideoPlayer } from "@/components/video-player"
import { cn } from "@/lib/utils"

export function ProductGallery({
  media,
  name,
  badge,
}: {
  media: ProductMedia[]
  name: string
  badge?: ProductBadge
}) {
  const { t } = useTranslation()
  const [active, setActive] = useState(0)
  // Only autoplay a video the user picked, not one that happens to be first
  const [userPicked, setUserPicked] = useState(false)
  // TODO: persist to the wishlist once it exists
  const [wishlisted, setWishlisted] = useState(false)
  const current = media[active]

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {media.length > 1 && (
        <div className="flex gap-3 sm:flex-col">
          {media.map((item, index) => (
            <button
              key={index}
              type="button"
              aria-label={
                item.type === "video"
                  ? t("productPage.playVideo")
                  : t("productPage.showImage", { number: index + 1 })
              }
              aria-current={index === active}
              onClick={() => {
                setActive(index)
                setUserPicked(true)
              }}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-card transition-colors sm:size-20",
                index === active
                  ? "border-brand-copper"
                  : "border-transparent opacity-80 hover:opacity-100"
              )}
            >
              <img
                src={item.type === "video" ? item.poster : item.src}
                alt=""
                className="size-full object-cover"
              />
              {item.type === "video" && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                  {/* Same look as the player's big play button */}
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-navy text-white shadow ring-2 ring-white/25">
                    <Play className="ms-0.5 size-3.5 fill-current" />
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="relative aspect-square flex-1 overflow-hidden rounded-2xl bg-muted">
        {current.type === "video" ? (
          <VideoPlayer
            // Remount per video so switching resets playback
            key={current.src}
            src={current.src}
            poster={current.poster}
            title={name}
            autoPlay={userPicked}
            className="size-full"
          />
        ) : (
          <img src={current.src} alt={name} className="size-full object-cover" />
        )}
        {badge && (
          <span
            className={cn(
              "pointer-events-none absolute start-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              BADGE_CLASS[badge]
            )}
          >
            {t(`landing.product.badges.${badge}`)}
          </span>
        )}
        <button
          type="button"
          aria-pressed={wishlisted}
          aria-label={t(wishlisted ? "productPage.removeFromWishlist" : "productPage.addToWishlist")}
          onClick={() => setWishlisted((value) => !value)}
          className="absolute end-4 top-4 flex size-10 items-center justify-center rounded-full bg-white text-brand-navy shadow-md transition-transform hover:scale-105"
        >
          <Heart className={cn("size-5", wishlisted && "fill-destructive text-destructive")} />
        </button>
      </div>
    </div>
  )
}
