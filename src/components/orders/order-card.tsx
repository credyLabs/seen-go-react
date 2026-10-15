import { useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { Loader2, Package, Star } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { addCartItem } from "@/api/cart"
import { ApiError } from "@/api/http"

import { orderStage, type OrderDetail, type OrderStage, type OrderSummary } from "@/api/orders"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

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
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const stage = orderStage(order)
  // The list includes the lines; older responses need the detail call
  const items = order.items ?? detail?.items ?? []
  const [first, ...others] = items
  const firstImage = first?.primaryImageUrl ?? first?.media?.find((m) => m.mediaType !== "VIDEO")?.cdnUrl ?? null
  const [reordering, setReordering] = useState(false)
  const [reorderError, setReorderError] = useState<string | null>(null)

  // "Buy again" / "Reorder": POST /cart/items for each line's seller listing,
  // then open the cart. Stops at the first refusal and shows its reason.
  const reorder = async () => {
    if (!token) return
    setReordering(true)
    setReorderError(null)
    try {
      for (const item of items) await addCartItem(token, item.listingId, item.quantity)
      await queryClient.invalidateQueries({ queryKey: ["cart"] })
      void navigate({ to: "/cart" })
    } catch (err) {
      setReorderError(err instanceof ApiError && err.status === 400 && err.message ? err.message : t("cart.errors.add"))
    } finally {
      setReordering(false)
    }
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
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
          {firstImage ? <img src={firstImage} alt="" className="size-full object-cover" /> : <Package className="size-6" />}
        </span>
        <div className="min-w-0 flex-1">
          {first ? (
            <>
              <p className="text-bidi-plain line-clamp-2 text-sm font-semibold">
                {first.product?.slug ? (
                  <Link to="/products/$productId" params={{ productId: first.product.slug }} className="hover:underline">
                    {first.nameSnapshot}
                  </Link>
                ) : (
                  first.nameSnapshot
                )}
                {/* "Standard" is the only variant of most products */}
                {first.skuSnapshot && first.skuSnapshot !== "Standard" && ` - ${first.skuSnapshot}`}
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
              disabled={items.length === 0 || reordering}
              onClick={() => void reorder()}
              className={cn(PILL, "bg-secondary text-secondary-foreground hover:bg-secondary/90")}
            >
              {reordering && <Loader2 className="animate-spin" />}
              {t(stage === "cancelled" ? "orders.reorder" : "orders.buyAgain")}
            </Button>
          )}
        </div>
        {reorderError && (
          <p role="alert" className="w-full text-end text-xs text-destructive">
            {reorderError}
          </p>
        )}
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
