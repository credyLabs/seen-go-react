import { useTranslation } from "react-i18next"

import { pickProducts } from "@/api/products"
import { ProductRail } from "@/components/home/product-rail"

// TODO: replace with deals from the API
const DEALS = pickProducts([
  "iphone-16-pro-max-256",
  "galaxy-s25-ultra-512",
  "sony-wh-1000xm6",
  "bose-qc-ultra-earbuds",
  "ps5-slim-disc",
  "iphone-16-128",
  "galaxy-z-fold6",
  "sony-wh-ch720n",
  "bose-qc-earbuds-ii",
  "iphone-15-pro-refurbished",
])

export function TodaysDeals() {
  const { t } = useTranslation()

  return (
    <ProductRail
      eyebrow={t("landing.deals.eyebrow")}
      title={t("landing.deals.title")}
      subtitle={t("landing.deals.subtitle")}
      seeAllLabel={t("landing.deals.seeAll")}
      products={DEALS}
    />
  )
}
