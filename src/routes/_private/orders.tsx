import { useQueries, useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { PackageOpen, RotateCw, Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import { orderDetailQueryOptions, orderStage, ordersQueryOptions, type OrderStage } from "@/api/orders"
import { OrderCard } from "@/components/orders/order-card"
import { Pagination } from "@/components/orders/pagination"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button, buttonVariants } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

const TABS = ["all", "processing", "shipped", "delivered", "cancelled"] as const
type Tab = (typeof TABS)[number]

interface OrdersSearch {
  tab?: Tab
  q?: string
  // 1-based in the URL; the API is 0-based
  page?: number
}

export const Route = createFileRoute("/_private/orders")({
  validateSearch: (search: Record<string, unknown>): OrdersSearch => ({
    tab: TABS.includes(search.tab as Tab) && search.tab !== "all" ? (search.tab as Tab) : undefined,
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    page: Number(search.page) > 1 ? Math.floor(Number(search.page)) : undefined,
  }),
  component: OrdersPage,
})

function OrdersPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const { tab = "all", q = "", page = 1 } = Route.useSearch()
  const navigate = Route.useNavigate()

  const ordersQuery = useQuery(ordersQueryOptions(token, page - 1))
  const orders = ordersQuery.data?.orders ?? []
  const details = useQueries({
    queries: orders.map((order) => orderDetailQueryOptions(token, order.id)),
  })
  const detailById = new Map(orders.map((order, i) => [order.id, details[i]?.data]))

  // Tabs and search filter the loaded page client-side, as the spec describes
  const term = q.trim().toLowerCase()
  const visible = orders.filter((order) => {
    if (tab !== "all" && orderStage(order) !== (tab as OrderStage)) return false
    if (!term) return true
    const names = detailById.get(order.id)?.items.map((item) => item.nameSnapshot) ?? []
    return [order.orderNumber, ...names].some((text) => text.toLowerCase().includes(term))
  })

  const setSearch = (next: OrdersSearch) =>
    navigate({ search: (prev) => ({ ...prev, ...next }), replace: true, resetScroll: false })

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
              <BreadcrumbPage>{t("orders.title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight text-primary">{t("orders.title")}</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label={t("orders.filter")} className="-mb-px flex gap-6 overflow-x-auto">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              aria-current={tab === key ? "true" : undefined}
              onClick={() => setSearch({ tab: key === "all" ? undefined : key })}
              className={cn(
                "border-b-2 pb-2 text-sm whitespace-nowrap transition-colors",
                tab === key
                  ? "border-secondary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`orders.tabs.${key}`)}
            </button>
          ))}
        </nav>
        <InputGroup className="h-9 w-full rounded-lg bg-card sm:w-80">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={q}
            onChange={(event) => setSearch({ q: event.target.value || undefined })}
            aria-label={t("orders.searchPlaceholder")}
            placeholder={t("orders.searchPlaceholder")}
          />
        </InputGroup>
      </div>

      {ordersQuery.isPending ? (
        <div role="status" aria-label={t("orders.loading")} className="flex animate-pulse flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted" />
          ))}
        </div>
      ) : ordersQuery.isError ? (
        <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border bg-card py-16 text-center">
          <h2 className="text-lg font-semibold">{t("orders.loadError")}</h2>
          <Button onClick={() => ordersQuery.refetch()} disabled={ordersQuery.isRefetching} className="rounded-full">
            <RotateCw className={cn(ordersQuery.isRefetching && "animate-spin")} />
            {t("landing.error.retry")}
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-muted">
            <PackageOpen className="size-7 text-brand-copper" strokeWidth={1.5} />
          </span>
          <h2 className="text-lg font-semibold">
            {t(orders.length === 0 ? "orders.emptyTitle" : "orders.noMatchTitle")}
          </h2>
          {orders.length === 0 && (
            <Link to="/" className={cn(buttonVariants(), "mt-2 rounded-full bg-brand-gradient px-6 text-white hover:opacity-90")}>
              {t("cart.continueShopping")}
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((order) => (
            <OrderCard key={order.id} order={order} detail={detailById.get(order.id)} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={ordersQuery.data?.totalPages ?? 0}
        onChange={(next) => {
          setSearch({ page: next > 1 ? next : undefined })
          window.scrollTo({ top: 0 })
        }}
      />
    </div>
  )
}
