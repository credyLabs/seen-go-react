import { Link, createFileRoute } from "@tanstack/react-router"
import { Heart, X } from "lucide-react"
import { useTranslation } from "react-i18next"

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
import { cn } from "@/lib/utils"
import { useWishlistStore } from "@/stores/wishlist-store"

export const Route = createFileRoute("/_private/wishlist")({
  component: WishlistPage,
})

function WishlistPage() {
  const { t } = useTranslation()
  const items = useWishlistStore((state) => state.items)
  const remove = useWishlistStore((state) => state.remove)

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

      {items.length === 0 ? (
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-2">
              <ProductCard product={item} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(item.id)}
                className="self-center rounded-full text-xs text-muted-foreground hover:text-destructive"
              >
                <X />
                {t("wishlist.remove")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
