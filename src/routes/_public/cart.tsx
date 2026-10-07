import { Link, createFileRoute } from "@tanstack/react-router"
import {
  Check,
  Heart,
  ImageOff,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react"
import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"

import { canMoveToWishlist, useMoveToWishlist } from "@/components/cart/move-to-wishlist"
import { RemoveFromCartDialog } from "@/components/cart/remove-from-cart-dialog"
import { ServiceHighlights } from "@/components/home/service-highlights"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  MAX_LINE_QUANTITY,
  VAT_RATE,
  cartTotals,
  selectCartCount,
  useCartStore,
  type CartLine,
} from "@/stores/cart-store"

export const Route = createFileRoute("/_public/cart")({
  component: CartPage,
})

function CartPage() {
  const { isAuthenticated } = useAuth()
  const lines = useCartStore((state) => state.lines)

  return (
    <div className="flex flex-col gap-10">
      {/* Guests can't add to the cart (adding asks them to sign in first) */}
      {!isAuthenticated || lines.length === 0 ? (
        <div className="rounded-2xl border bg-card px-5 py-14 shadow-xs sm:py-20">
          <EmptyCart guest={!isAuthenticated} />
        </div>
      ) : (
        <CartContents lines={lines} />
      )}
      <ServiceHighlights />
    </div>
  )
}

function EmptyCart({ guest }: { guest: boolean }) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
      <span className="mb-2 flex size-20 items-center justify-center rounded-full bg-muted">
        <ShoppingCart className="size-8 text-brand-copper" strokeWidth={1.5} />
      </span>
      <h1 className="text-2xl font-bold tracking-tight text-primary">{t("cart.emptyTitle")}</h1>
      <p className="text-sm text-muted-foreground">
        {t(guest ? "cart.emptyGuest" : "cart.emptySignedIn")}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {guest && (
          <Link
            to="/login"
            search={{ redirect: "/cart" }}
            className={cn(buttonVariants(), "h-10 rounded-full bg-brand-gradient px-8 text-white shadow-md hover:opacity-90")}
          >
            {t("cart.signIn")}
          </Link>
        )}
        <Link
          to="/"
          className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-full bg-card px-6 font-semibold text-primary")}
        >
          {t("cart.continueShopping")}
        </Link>
      </div>
    </div>
  )
}

function CartContents({ lines }: { lines: CartLine[] }) {
  const { t } = useTranslation()
  const count = useCartStore(selectCartCount)
  // Line waiting for the "Remove from cart?" confirmation
  const [removing, setRemoving] = useState<CartLine | null>(null)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/" />}>{t("home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("header.cart")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-primary">{t("cart.title")}</h1>
          <span className="text-sm text-muted-foreground">{t("cart.itemCount", { count })}</span>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <ul className="flex flex-col gap-4">
          {lines.map((line) => (
            <CartLineCard key={line.lineId} line={line} onRemove={() => setRemoving(line)} />
          ))}
        </ul>
        <OrderSummary lines={lines} count={count} />
      </div>

      <RemoveFromCartDialog line={removing} onOpenChange={(open) => !open && setRemoving(null)} />
    </div>
  )
}

function CartLineCard({ line, onRemove }: { line: CartLine; onRemove: () => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const setQuantity = useCartStore((state) => state.setQuantity)
  const moveToWishlist = useMoveToWishlist()
  const savings = line.originalPrice && line.originalPrice > line.price ? line.originalPrice - line.price : 0

  // Standard delivery arrives the next day
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const deliveryDate = tomorrow.toLocaleDateString(lang, {
    weekday: "short",
    day: "numeric",
    month: "short",
    numberingSystem: "latn",
  })

  const image = line.image ? (
    <img src={line.image} alt="" className="size-full object-cover" />
  ) : (
    <ImageOff className="size-7 text-muted-foreground" />
  )

  return (
    <li className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-xs sm:flex-row sm:p-5">
      <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
        {line.slug ? (
          <Link to="/products/$productId" params={{ productId: line.slug }} className="flex size-full items-center justify-center">
            {image}
          </Link>
        ) : (
          image
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {line.brand && (
          <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{line.brand}</span>
        )}
        {line.slug ? (
          <Link
            to="/products/$productId"
            params={{ productId: line.slug }}
            className="text-bidi-plain line-clamp-2 font-semibold hover:underline"
          >
            {line.name}
          </Link>
        ) : (
          <p className="text-bidi-plain line-clamp-2 font-semibold">{line.name}</p>
        )}
        {line.variant && (
          <p className="text-xs text-muted-foreground">{t("cart.color", { color: line.variant })}</p>
        )}
        {/* Only in-stock items can be added, so this reflects the time of adding */}
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success">
          <Check className="size-3.5" />
          {t("productPage.inStock")}
        </p>
        <p className="flex items-center gap-1 text-xs text-success">
          <Truck className="size-3.5" />
          {t("cart.freeDelivery", { date: deliveryDate })}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="text-xl font-bold">{formatPrice(line.price * line.quantity, lang)}</span>
          {savings > 0 && (
            <>
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(line.originalPrice! * line.quantity, lang)}
              </span>
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                {t("cart.save", { amount: formatPrice(savings * line.quantity, lang) })}
              </span>
            </>
          )}
        </div>

        <div className="flex h-9 items-center rounded-full border">
          <button
            type="button"
            aria-label={t("productPage.decrease")}
            disabled={line.quantity <= 1}
            onClick={() => setQuantity(line.lineId, line.quantity - 1)}
            className="flex size-9 items-center justify-center rounded-full disabled:opacity-40"
          >
            <Minus className="size-3.5" />
          </button>
          <output aria-label={t("productPage.quantity")} className="w-6 text-center text-sm font-medium">
            {line.quantity}
          </output>
          <button
            type="button"
            aria-label={t("productPage.increase")}
            disabled={line.quantity >= MAX_LINE_QUANTITY}
            onClick={() => setQuantity(line.lineId, line.quantity + 1)}
            className="flex size-9 items-center justify-center rounded-full disabled:opacity-40"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 text-destructive hover:underline"
          >
            <Trash2 className="size-3.5" />
            {t("cart.removeAction")}
          </button>
          {canMoveToWishlist(line) && (
            <button
              type="button"
              onClick={() => moveToWishlist(line)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
            >
              <Heart className="size-3.5" />
              {t("cart.saveForLater")}
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

function OrderSummary({ lines, count }: { lines: CartLine[]; count: number }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { subtotal, discount, vat, total } = cartTotals(lines)
  const [promoCode, setPromoCode] = useState("")
  const [promoMessage, setPromoMessage] = useState<string | null>(null)

  // TODO: POST /cart/coupon once the cart API is wired; the local cart can't validate codes
  const applyPromo = (event: FormEvent) => {
    event.preventDefault()
    if (promoCode.trim()) setPromoMessage(t("cart.promoUnavailable"))
  }

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-xs lg:sticky lg:top-40">
      <h2 className="text-lg font-semibold">{t("cart.summary")}</h2>

      <form onSubmit={applyPromo} className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <Input
            value={promoCode}
            onChange={(event) => {
              setPromoCode(event.target.value)
              setPromoMessage(null)
            }}
            placeholder={t("cart.promoPlaceholder")}
            aria-label={t("cart.promoPlaceholder")}
            className="h-9 rounded-full bg-card px-4"
          />
          <Button
            type="submit"
            className="h-9 rounded-full bg-brand-gradient px-5 text-white hover:opacity-90"
          >
            {t("cart.apply")}
          </Button>
        </div>
        {promoMessage && (
          <p role="status" className="ps-4 text-xs text-muted-foreground">
            {promoMessage}
          </p>
        )}
      </form>

      <dl className="flex flex-col gap-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t("cart.subtotalItems", { count })}</dt>
          <dd>{formatPrice(subtotal, lang)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("cart.discount")}</dt>
            <dd className="font-medium text-success">-{formatPrice(discount, lang)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t("cart.shipping")}</dt>
          <dd className="font-semibold text-success uppercase">{t("cart.free")}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t("cart.vat", { rate: VAT_RATE * 100 })}</dt>
          <dd>{formatPrice(vat, lang)}</dd>
        </div>
        <div className="mt-1 flex justify-between border-t pt-3 text-base font-bold">
          <dt>{t("cart.total")}</dt>
          <dd>{formatPrice(total, lang)}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2">
        {/* TODO: checkout via POST /orders with a saved addressId once the flow is designed */}
        <Button className="h-11 rounded-full bg-brand-gradient text-white shadow-md hover:opacity-90">
          {t("cart.checkout")}
        </Button>
        <Link
          to="/"
          className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-full bg-card font-semibold text-primary")}
        >
          {t("cart.continueShopping")}
        </Link>
      </div>

      <ul className="flex flex-col gap-2 border-t pt-4 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <Lock className="size-3.5" />
          {t("cart.trust.secure")}
        </li>
        <li className="flex items-center gap-2">
          <RotateCcw className="size-3.5" />
          {t("cart.trust.returns")}
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="size-3.5" />
          {t("cart.trust.warranty")}
        </li>
      </ul>
    </aside>
  )
}
