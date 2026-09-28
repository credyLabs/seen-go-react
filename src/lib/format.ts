// Prices are always AED. Arabic gets the "د.إ" symbol; every language keeps
// Latin digits so prices read the same across the site.
export function formatPrice(value: number, lang: string) {
  return new Intl.NumberFormat(lang, {
    style: "currency",
    currency: "AED",
    currencyDisplay: "narrowSymbol",
    numberingSystem: "latn",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number, lang: string) {
  return new Intl.NumberFormat(lang, { numberingSystem: "latn" }).format(value)
}
