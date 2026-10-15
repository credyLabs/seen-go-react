import { Link, createFileRoute } from "@tanstack/react-router"
import { Heart, Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { BrandError, BrandLoader } from "@/components/brand/brand-status"
import { ProductCard } from "@/components/product/product-card"
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
import { cn } from "@/lib/utils"
import { RemoveFromWishlistDialog } from "@/components/wishlist/remove-from-wishlist-dialog"
import { useWishlistStore, type WishlistEntry } from "@/stores/wishlist-store"

export const Route = createFileRoute("/_private/wishlist")({
  component: WishlistPage,
})

function WishlistPage() {
  const { t } = useTranslation()
  const items = useWishlistStore((state) => state.items)
  const { token } = useAuth()
  // The item whose trash button was pressed; the dialog confirms before DELETE
  const [removing, setRemoving] = useState<WishlistEntry | null>(null)
  const status = useWishlistStore((state) => state.status)
  const load = useWishlistStore((state) => state.load)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/" />}>{t("home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>{t("orders.myAccount")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("wishlist.title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-primary">{t("wishlist.title")}</h1>
          {items.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {t("wishlist.itemCount", { count: items.length })}
            </span>
          )}
        </div>
      </div>

      {items.length === 0 && status === "error" ? (
        // Not "empty": the list just couldn't be loaded
        <BrandError
          title={t("wishlist.loadError")}
          body={t("landing.error.body")}
          onRetry={() => void load(token!)}
          className="rounded-2xl border bg-card"
        />
      ) : items.length === 0 && status === "loading" ? (
        <BrandLoader label={t("wishlist.loading")} className="rounded-2xl border bg-card" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-5 py-16 text-center shadow-xs">
          <span className="mb-2 flex size-20 items-center justify-center rounded-full bg-muted">
            <Heart className="size-8 text-brand-copper" strokeWidth={1.5} />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-primary">{t("wishlist.emptyTitle")}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{t("wishlist.emptyBody")}</p>
          <Link
            to="/"
            className={cn(buttonVariants(), "mt-4 h-10 rounded-full bg-brand-gradient px-8 text-white shadow-md hover:opacity-90")}
          >
            {t("cart.continueShopping")}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <li key={item.productId}>
              {/* The trash button asks first; confirming calls DELETE /wishlist/items/{productId} */}
              {item.unavailable ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
                  {t("wishlist.unavailable")}
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => setRemoving(item)}>
                    <Trash2 />
                    {t("wishlist.removeUnavailable")}
                  </Button>
                </div>
              ) : (
                <ProductCard product={item} onRemove={() => setRemoving(item)} />
              )}
            </li>
          ))}
        </ul>
      )}
      <RemoveFromWishlistDialog item={removing} onOpenChange={(open) => !open && setRemoving(null)} />
    </div>
  )
}
