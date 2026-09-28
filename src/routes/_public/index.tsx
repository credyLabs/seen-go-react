import { createFileRoute } from "@tanstack/react-router"

import { CuratedCollections } from "@/components/home/curated-collections"
import { FeaturedThisSeason } from "@/components/home/featured-this-season"
import { HeroCarousel } from "@/components/home/hero-carousel"
import { ServiceHighlights } from "@/components/home/service-highlights"
import { ShopByCategory } from "@/components/home/shop-by-category"
import { TodaysDeals } from "@/components/home/todays-deals"
import { TopBrands } from "@/components/home/top-brands"
import { TrendingNow } from "@/components/home/trending-now"

export const Route = createFileRoute("/_public/")({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <HeroCarousel />
      <ShopByCategory />
      <TodaysDeals />
      <TrendingNow />
      <CuratedCollections />
      <TopBrands />
      <FeaturedThisSeason />
      <ServiceHighlights />
    </div>
  )
}
