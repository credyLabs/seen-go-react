import { Popover } from "@base-ui/react/popover"
import { useQuery } from "@tanstack/react-query"
import { cn } from "cn"
import { ArrowRight, ChevronDown, ChevronRight, Menu } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { categoryMenuQueryOptions, type MenuCategory } from "@/api/categories"
import { buttonVariants } from "@/components/ui/button"
import { useCategoryMenuStore } from "@/stores/category-menu-store"

// "All categories" button that opens a mega menu on hover or click, built from
// the GET /catalogue/categories tree.
// Hovering (or focusing) a category on the left swaps the panel on the right.
export function CategoryMegaMenu() {
  const { t } = useTranslation()
  const open = useCategoryMenuStore((state) => state.open)
  const setOpen = useCategoryMenuStore((state) => state.setOpen)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        openOnHover
        delay={100}
        closeDelay={150}
        className={buttonVariants({
          variant: "secondary",
          className:
            "group/trigger h-8 shrink-0 gap-2 rounded-full bg-accent px-3 font-semibold text-accent-foreground",
        })}
      >
        <Menu />
        {t("header.allCategories")}
        <ChevronDown className="text-muted-foreground transition-transform group-data-popup-open/trigger:rotate-180" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={10}
          collisionPadding={16}
          className="isolate z-50 outline-none"
        >
          <Popover.Popup className="w-[min(56rem,calc(100vw-2rem))] origin-(--transform-origin) overflow-hidden rounded-md bg-popover text-popover-foreground shadow-xl ring-1 ring-foreground/10 duration-100 outline-none data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0 data-[side=bottom]:slide-in-from-top-2">
            <MegaMenuBody />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function MegaMenuBody() {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? i18n.language
  const { data, isPending, isError } = useQuery(categoryMenuQueryOptions(lang))
  const activeCategoryId = useCategoryMenuStore(
    (state) => state.activeCategoryId
  )
  const setActiveCategory = useCategoryMenuStore(
    (state) => state.setActiveCategory
  )

  // An empty tree is treated like a failed load: there is nothing to show
  if (isPending || isError || data.length === 0) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        {isPending ? t("header.megaMenu.loading") : t("header.megaMenu.error")}
      </p>
    )
  }

  const active = data.find((c) => c.id === activeCategoryId) ?? data[0]

  return (
    <div className="grid max-h-[min(32rem,calc(100svh-12rem))] grid-cols-[11rem_minmax(0,1fr)] sm:grid-cols-[13rem_minmax(0,1fr)]">
      <ul className="overflow-y-auto border-e py-2">
        {data.map((category) => {
          const isActive = category.id === active.id
          return (
            <li key={category.id}>
              <button
                type="button"
                onMouseEnter={() => setActiveCategory(category.id)}
                onFocus={() => setActiveCategory(category.id)}
                onClick={() => setActiveCategory(category.id)}
                aria-current={isActive || undefined}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  isActive
                    ? "bg-secondary text-white"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {/* Only the API's image; no placeholder when it has none */}
                {category.imageUrl && (
                  <img
                    src={category.imageUrl}
                    alt=""
                    width={20}
                    height={20}
                    loading="lazy"
                    className="size-5 shrink-0 rounded object-cover"
                  />
                )}
                <span className="flex-1 leading-tight">{category.label}</span>
                {isActive && (
                  <ChevronRight className="size-4 shrink-0 rtl:rotate-180" />
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <CategoryPanel category={active} />
    </div>
  )
}

function CategoryPanel({ category }: { category: MenuCategory }) {
  const { t } = useTranslation()
  const setOpen = useCategoryMenuStore((state) => state.setOpen)
  const close = () => setOpen(false)

  return (
    <div className="overflow-y-auto p-5 sm:p-6">
      <h2 className="mb-5 text-lg font-bold text-primary dark:text-foreground">
        <Link to="/search" search={{ categoryIds: category.id }} onClick={close} className="hover:underline">
          {category.label}
        </Link>
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {category.groups.map((group) => (
          <section key={group.id}>
            <h3 className="mb-3 text-sm font-semibold text-primary dark:text-foreground">
              <Link to="/search" search={{ categoryIds: group.id }} onClick={close} className="hover:underline">
                {group.label}
              </Link>
            </h3>
            {group.links.length > 0 && (
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                {group.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      to="/search"
                      search={{ categoryIds: link.id }}
                      onClick={close}
                      className="transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/search"
              search={{ categoryIds: group.id }}
              onClick={close}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary underline underline-offset-4 dark:text-foreground"
            >
              {t("header.megaMenu.viewAll")}
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Link>
          </section>
        ))}
      </div>
    </div>
  )
}
