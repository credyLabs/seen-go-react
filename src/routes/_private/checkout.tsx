import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { CheckCircle2, ImageOff, Loader2, Lock } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { addressesQueryOptions } from "@/api/addresses"
import { ApiError } from "@/api/http"
import {
  checkoutOrder,
  type CheckoutItem,
  type PlacedOrder,
} from "@/api/orders"
import { cartQueryOptions, deleteCartItem, type ApiCartItem } from "@/api/cart"
import { AddressBook } from "@/components/addresses/address-book"
import { BrandError, BrandLoader } from "@/components/brand/brand-status"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useCartStore } from "@/stores/cart-store"

export const Route = createFileRoute("/_private/checkout")({
  component: CheckoutPage,
})

// The cart line as an order item snapshot for POST /orders/checkout
function toCheckoutItem(item: ApiCartItem): CheckoutItem {
  return {
    variantId: item.variantId,
    listingId: item.listingId,
    sellerId: item.sellerId,
    nameSnapshot: item.product?.name ?? item.productName,
    skuSnapshot: item.variantName ?? "Standard",
    unitPrice: item.unitPrice.toFixed(2),
    quantity: String(item.quantity),
    commissionRate: "0",
  }
}

// Checkout: pick (or add / edit) a saved delivery address, review the cart from
// GET /cart, then POST /orders/checkout with that addressId and the cart's lines
// as item snapshots. Payment isn't specified by the backend yet, so the order
// is placed with its payment pending.
function CheckoutPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const cart = useQuery(cartQueryOptions(token))
  const addresses = useQuery(addressesQueryOptions(token))
  const clearLocalCart = useCartStore((state) => state.clear)
  const [picked, setPicked] = useState<string | null>(null)
  const [placed, setPlaced] = useState<PlacedOrder | null>(null)

  // Picked address, else the default, else the first; dropped if it was deleted
  const list = addresses.data ?? []
  const selected =
    list.find((a) => a.id === picked) ??
    list.find((a) => a.isDefault) ??
    list[0] ??
    null

  const order = useMutation({
    mutationFn: () =>
      checkoutOrder(token!, {
        addressId: selected!.id,
        items: (cart.data?.items ?? []).map(toCheckoutItem),
        discountTotal: cart.data?.discount ?? 0,
      }),
    onSuccess: async (result) => {
      setPlaced(result)
      clearLocalCart()
      // This endpoint takes the items directly, so empty the cart ourselves;
      // a line that fails to delete just stays in the cart
      await Promise.allSettled(
        (cart.data?.items ?? []).map((item) => deleteCartItem(token!, item.id))
      )
      // The cart is now empty server-side and the order is in My Orders
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cart"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ])
    },
  })

  if (placed) return <OrderPlaced order={placed} />

  const items = cart.data?.items ?? []
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const orderError = order.error
    ? order.error instanceof ApiError && order.error.status === 0
      ? t("cart.errors.network")
      : order.error instanceof ApiError &&
          order.error.status === 400 &&
          order.error.message
        ? order.error.message
        : t("checkout.errors.place")
    : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/" />}>
                {t("home")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/cart" />}>
                {t("header.cart")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("checkout.title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-foreground">
          {t("checkout.title")}
        </h1>
      </div>

      {cart.isError ? (
        <BrandError
          title={t("cart.loadError")}
          body={t("landing.error.body")}
          onRetry={() => void cart.refetch()}
          retrying={cart.isFetching}
          className="rounded-2xl border bg-card"
        />
      ) : !cart.data ? (
        <BrandLoader
          label={t("cart.loading")}
          className="rounded-2xl border bg-card"
        />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-5 py-16 text-center">
          <h2 className="text-xl font-semibold">{t("checkout.emptyTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("checkout.emptyBody")}
          </p>
          <Link
            to="/"
            className={cn(
              buttonVariants(),
              "mt-2 rounded-full bg-brand-gradient px-6 text-white"
            )}
          >
            {t("cart.continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-6">
            <section
              aria-labelledby="deliver-to"
              className="flex flex-col gap-3"
            >
              <AddressBook
                selectable
                selectedId={selected?.id ?? null}
                onSelect={(address) => setPicked(address.id)}
                header={
                  <div className="flex flex-col gap-0.5">
                    <h2 id="deliver-to" className="text-lg font-semibold">
                      {t("checkout.deliverTo")}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t("checkout.deliverToHint")}
                    </p>
                  </div>
                }
              />
            </section>
          </div>

          <aside className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-xs lg:sticky lg:top-40">
            <h2 className="text-lg font-semibold">{t("cart.summary")}</h2>
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 text-sm">
                  <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {item.primaryImageUrl ? (
                      <img
                        src={item.primaryImageUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImageOff className="size-5 text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-medium text-bidi-plain">
                      {item.product?.name ?? item.productName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      × {item.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold">
                    {formatPrice(item.lineTotal, lang)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="flex flex-col gap-2.5 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("cart.subtotalItems", { count })}
                </dt>
                <dd>{formatPrice(cart.data.subtotal, lang)}</dd>
              </div>
              {cart.data.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {t("cart.discount")}
                  </dt>
                  <dd className="font-medium text-success">
                    -{formatPrice(cart.data.discount, lang)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("cart.shipping")}</dt>
                <dd className="font-semibold text-success uppercase">
                  {t("cart.free")}
                </dd>
              </div>
              <div className="mt-1 flex justify-between border-t pt-3 text-base font-bold">
                <dt>{t("cart.total")}</dt>
                <dd>{formatPrice(cart.data.total, lang)}</dd>
              </div>
            </dl>

            {orderError && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {orderError}
              </p>
            )}
            <Button
              disabled={!selected || order.isPending}
              onClick={() => order.mutate()}
              className="h-11 rounded-full bg-brand-gradient text-white shadow-md hover:opacity-90"
            >
              {order.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Lock />
              )}
              {t("checkout.placeOrder")}
            </Button>
            {!selected && addresses.isSuccess && (
              <p className="text-center text-xs text-muted-foreground">
                {t("checkout.addAddressFirst")}
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

function OrderPlaced({ order }: { order: PlacedOrder }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-14 text-center shadow-xs">
      <CheckCircle2 className="size-14 text-success" strokeWidth={1.5} />
      <h1 className="text-2xl font-bold tracking-tight text-primary dark:text-foreground">
        {t("checkout.placedTitle")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("checkout.placedBody", {
          number: order.orderNumber,
          total: formatPrice(order.grandTotal, i18n.language),
        })}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <Link
          to="/orders"
          className={cn(
            buttonVariants(),
            "h-10 rounded-full bg-brand-gradient px-6 text-white"
          )}
        >
          {t("checkout.viewOrders")}
        </Link>
        <Link
          to="/"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-10 rounded-full bg-card px-6"
          )}
        >
          {t("cart.continueShopping")}
        </Link>
      </div>
    </div>
  )
}
