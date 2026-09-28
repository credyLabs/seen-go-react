import { Popover } from "@base-ui/react/popover"
import { useQuery } from "@tanstack/react-query"
import { cn } from "cn"
import {
  ArrowRight,
  Camera,
  ChevronDown,
  ChevronRight,
  Gamepad2,
  Headphones,
  House,
  Laptop,
  Menu,
  Plug,
  Smartphone,
  Tv,
  Watch,
  type LucideIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  categoryMenuQueryOptions,
  type CategoryIcon,
  type MenuCategory,
} from "@/api/categories"
import { buttonVariants } from "@/components/ui/button"
import { useCategoryMenuStore } from "@/stores/category-menu-store"

const ICONS: Record<CategoryIcon, LucideIcon> = {
  smartphone: Smartphone,
  laptop: Laptop,
  headphones: Headphones,
  watch: Watch,
  camera: Camera,
  gamepad: Gamepad2,
  tv: Tv,
  home: House,
  plug: Plug,
}

// "All categories" button that opens a mega menu on hover or click.
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

  if (isPending || isError) {
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
          const Icon = ICONS[category.icon]
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
                <Icon className="size-4 shrink-0" />
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
        {category.label}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {category.groups.map((group) => (
          <section key={group.title}>
            <h3 className="mb-3 text-sm font-semibold text-primary dark:text-foreground">
              {group.title}
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {/* TODO: switch to router <Link>s once category routes exist */}
              {group.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={close}
                    className="transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={group.href}
              onClick={close}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary underline underline-offset-4 dark:text-foreground"
            >
              {t("header.megaMenu.viewAll")}
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </a>
          </section>
        ))}
      </div>
    </div>
  )
}
