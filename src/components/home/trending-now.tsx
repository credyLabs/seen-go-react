import { useTranslation } from "react-i18next"

import { pickProducts } from "@/api/products"
import { ProductRail } from "@/components/home/product-rail"

// TODO: replace with trending products from the API
const TRENDING = pickProducts([
  "iphone-16-pro-max-256",
  "galaxy-s25-ultra-512",
  "sony-wh-1000xm6",
  "airpods-pro-3-usb-c",
  "ps5-pro",
  "iphone-16e-128",
  "galaxy-s25-256",
  "sony-ult-wear",
  "dualsense-edge",
  "bose-ultra-open-earbuds",
])

export function TrendingNow() {
  const { t } = useTranslation()

  return (
    <ProductRail
      eyebrow={t("landing.trending.eyebrow")}
      title={t("landing.trending.title")}
      subtitle={t("landing.trending.subtitle")}
      seeAllLabel={t("landing.trending.seeAll")}
      products={TRENDING}
    />
  )
}
