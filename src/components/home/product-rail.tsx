import type { Product } from "@/api/products"
import { ScrollRail } from "@/components/home/scroll-rail"
import { ProductCard } from "@/components/product/product-card"
import { CarouselItem } from "@/components/ui/carousel"

interface ProductRailProps {
  eyebrow?: string
  title: string
  subtitle?: string
  seeAllLabel: string
  seeAllHref?: string
  alwaysShowSeeAll?: boolean
  products: Product[]
}

// A titled, horizontally scrollable row of product cards
export function ProductRail({ products, ...rail }: ProductRailProps) {
  return (
    <ScrollRail {...rail}>
      {products.map((product) => (
        <CarouselItem
          key={product.id}
          className="basis-[62%] sm:basis-[40%] md:basis-[30%] lg:basis-1/5"
        >
          <ProductCard product={product} />
        </CarouselItem>
      ))}
    </ScrollRail>
  )
}
