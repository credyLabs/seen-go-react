import { useTranslation } from "react-i18next"

import { pickProducts } from "@/api/products"
import { ProductRail } from "@/components/home/product-rail"

// TODO: replace with featured products from the API
const FEATURED = pickProducts([
  "iphone-16-pro-max-256",
  "galaxy-s25-ultra-512",
  "macbook-pro-14-m4-pro-1tb",
  "sony-wh-1000xm6",
  "ps5-pro",
  "lg-ultragear-oled-32",
  "bose-qc-ultra-earbuds",
  "macbook-air-13-m4",
  "galaxy-z-flip6",
  "iphone-16-plus-128",
])

export function FeaturedThisSeason() {
  const { t } = useTranslation()

  return (
    <ProductRail
      eyebrow={t("landing.featured.eyebrow")}
      title={t("landing.featured.title")}
      seeAllLabel={t("landing.featured.seeAll")}
      alwaysShowSeeAll
      products={FEATURED}
    />
  )
}
