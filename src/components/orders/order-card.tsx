import { useNavigate } from "@tanstack/react-router"
import { Package, Star } from "lucide-react"
import { useTranslation } from "react-i18next"

import { orderStage, type OrderDetail, type OrderStage, type OrderSummary } from "@/api/orders"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useCartStore } from "@/stores/cart-store"

const STAGE_BADGE: Record<OrderStage, string> = {
  processing: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  shipped: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
}

const PILL = "h-8 rounded-full bg-card px-4 text-xs font-semibold"

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  )
}

export function OrderCard({ order, detail }: { order: OrderSummary; detail?: OrderDetail }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const addToCart = useCartStore((state) => state.addItem)
  const stage = orderStage(order)
  const [first, ...others] = detail?.items ?? []

  // "Buy again" / "Reorder": put every line back in the cart.
  // TODO: POST /cart/items with each listingId once the cart API is wired
  const reorder = () => {
    for (const item of detail?.items ?? []) {
      addToCart(
        {
          productId: item.listingId,
          name: item.nameSnapshot,
          image: null,
          variant: item.skuSnapshot ?? undefined,
          price: item.unitPrice,
        },
        item.quantity
      )
    }
    void navigate({ to: "/cart" })
  }

  const placedOn = new Date(order.createdAt).toLocaleDateString(lang, {
    year: "numeric",
    month: "long",
    day: "numeric",
    numberingSystem: "latn",
  })

  return (
    <article className="rounded-2xl border bg-card shadow-xs">
      <header className="flex flex-wrap items-start gap-x-10 gap-y-3 px-5 py-4">
        <Meta label={t("orders.orderNumber")} value={`#${order.orderNumber}`} />
        <Meta label={t("orders.placedOn")} value={placedOn} />
        <span
          className={cn(
            "ms-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase",
            STAGE_BADGE[stage]
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {t(`orders.status.${stage}`)}
        </span>
      </header>

      <div className="flex items-center gap-4 border-t px-5 py-4">
        {/* TODO: show the product image once order items include one */}
        <span className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Package className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          {first ? (
            <>
              <p className="text-bidi-plain line-clamp-2 text-sm font-semibold">
                {first.nameSnapshot}
                {first.skuSnapshot && ` - ${first.skuSnapshot}`}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("orders.quantity", { count: first.quantity })}
                {others.length > 0 && ` · ${t("orders.moreItems", { count: others.length })}`}
              </p>
            </>
          ) : (
            <span className="block h-4 w-2/3 animate-pulse rounded bg-muted" />
          )}
        </div>
        <div className="shrink-0 text-end">
          <p className="text-xs text-muted-foreground">{t("orders.totalAmount")}</p>
          <p className="text-base font-bold">{formatPrice(order.grandTotal, lang)}</p>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t px-5 py-3">
        <p className="text-xs text-muted-foreground">
          {t("orders.needHelp")}{" "}
          {/* TODO: point at the support page once it exists */}
          <a href="#" className="font-medium text-brand-copper underline-offset-2 hover:underline">
            {t("orders.contactSupport")}
          </a>
        </p>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {/* TODO: open the order detail page once it's designed */}
          <Button variant="outline" className={PILL}>
            {t("orders.viewDetails")}
          </Button>
          {stage === "processing" || stage === "shipped" ? (
            // TODO: wire to shipment tracking once its contract is confirmed
            <Button variant="outline" className={cn(PILL, "border-primary text-primary")}>
              {t("orders.trackOrder")}
            </Button>
          ) : (
            <Button
              disabled={!detail}
              onClick={reorder}
              className={cn(PILL, "bg-secondary text-secondary-foreground hover:bg-secondary/90")}
            >
              {t(stage === "cancelled" ? "orders.reorder" : "orders.buyAgain")}
            </Button>
          )}
        </div>
      </footer>

      {stage === "delivered" && (
        // TODO: submit via POST /catalogue/products/{productId}/reviews once order items carry productId
        <div className="flex items-center gap-3 border-t px-5 py-3 text-xs">
          <span className="text-muted-foreground">{t("orders.rate")}</span>
          <span className="flex text-muted-foreground/40" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className="size-3.5" />
            ))}
          </span>
          <a href="#" className="ms-auto font-medium text-brand-copper underline-offset-2 hover:underline">
            {t("orders.writeReview")}
          </a>
        </div>
      )}
    </article>
  )
}
