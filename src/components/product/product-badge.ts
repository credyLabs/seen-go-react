import type { Product, ProductBadge } from "@/api/products"

export const BADGE_CLASS: Record<ProductBadge, string> = {
  bestseller: "bg-brand-copper text-brand-navy",
  new: "bg-brand-navy text-white",
  deal: "bg-destructive text-white",
}

export function discountPercent(product: Pick<Product, "price" | "originalPrice">) {
  return product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0
}
