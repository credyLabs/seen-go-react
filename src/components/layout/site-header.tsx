import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import {
  Heart,
  Loader2,
  MapPin,
  Phone,
  Search,
  ShoppingBag,
  User,
} from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { cartQueryOptions } from "@/api/cart"
import { categoryMenuQueryOptions } from "@/api/categories"
import { MIN_QUERY_LENGTH, searchSuggestionsQueryOptions, type SearchSuggestion } from "@/api/search"
import { LanguageSwitcher } from "@/components/language-switcher"
import { CategoryMegaMenu } from "@/components/layout/category-mega-menu"
import { SiteLogo } from "@/components/layout/site-logo"
import { UserMenu } from "@/components/layout/user-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { buttonVariants } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { signInRedirect } from "@/hooks/use-require-auth"
import { useAuth } from "@/lib/auth"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { selectCartCount, useCartStore } from "@/stores/cart-store"
import { useWishlistStore } from "@/stores/wishlist-store"

function TopBar() {
  const { t } = useTranslation()

  return (
    <div className="bg-brand-navy text-xs text-white/80">
      <div className="site-container flex h-9 items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5" dir="ltr">
            <Phone className="size-3.5" />
            {t("header.phone")}
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <MapPin className="size-3.5" />
            {t("header.delivering")}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* TODO: point these at real routes once they exist */}
          <a href="#" className="hidden hover:text-white md:inline">
            {t("header.trackOrder")}
          </a>
          <LanguageSwitcher className="h-7 border-0 bg-transparent px-1.5 text-xs text-white/80 shadow-none hover:bg-white/10 dark:bg-transparent" />
          <a href="#" className="hidden hover:text-white md:inline">
            {t("header.sellOnSeengo")}
          </a>
          <ModeToggle className="size-7 border-0 bg-transparent text-white/80 shadow-none hover:bg-white/10 hover:text-white dark:bg-transparent" />
        </div>
      </div>
    </div>
  )
}

// Wait this long after the last keystroke before searching
const SEARCH_DEBOUNCE_MS = 350

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// Bold the part of the name that matches what was typed, wherever it is, e.g. Sony WH-**1000**XM6
function HighlightedSuggestion({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase()
  const start = q ? text.toLowerCase().indexOf(q) : -1
  if (start < 0) return <span className="truncate text-foreground">{text}</span>
  return (
    <span className="truncate text-muted-foreground">
      {text.slice(0, start)}
      <span className="font-semibold text-foreground">{text.slice(start, start + q.length)}</span>
      {text.slice(start + q.length)}
    </span>
  )
}

// Header search. Once the user stops typing, GET /catalogue/products/search
// suggests matching products; picking one lists that brand's results. On the
// results page the results themselves follow the typing. Enter (or the
// button) opens the full results.
function SearchForm({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const onResultsPage = location.pathname === "/search"
  const urlQuery = onResultsPage ? ((location.search as { q?: string }).q ?? "") : ""

  const [query, setQuery] = useState(urlQuery)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listboxId = useId()

  // On the results page, the last query this field put in the URL itself
  const [pushedQuery, setPushedQuery] = useState(urlQuery)
  const resultsTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(resultsTimer.current), [])

  // Follow the URL when it changes elsewhere (back button, a category link),
  // but not when it is just catching up with this field mid-typing
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery)
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery)
    if (urlQuery !== pushedQuery) setQuery(urlQuery)
  }

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)
  const typedEnough = debouncedQuery.trim().length >= MIN_QUERY_LENGTH
  const { data: suggestions = [], isFetching } = useQuery({
    ...searchSuggestionsQueryOptions(debouncedQuery, i18n.language),
    // The results page lists the matches itself; don't fetch them twice
    enabled: !onResultsPage && typedEnough,
    placeholderData: keepPreviousData,
  })

  // On the results page, update the results once the user pauses typing
  // (replace, so each pause doesn't add a history entry)
  const scheduleResults = (value: string) => {
    window.clearTimeout(resultsTimer.current)
    resultsTimer.current = window.setTimeout(() => {
      const q = value.trim()
      setPushedQuery(q)
      void navigate({ to: "/search", search: (prev) => ({ ...prev, q: q || undefined, page: undefined }), replace: true })
    }, SEARCH_DEBOUNCE_MS)
  }

  // The results are already on screen there, so no dropdown on the results page
  const showSuggestions = open && !onResultsPage && query.trim().length >= MIN_QUERY_LENGTH && typedEnough && suggestions.length > 0

  const close = () => {
    setOpen(false)
    setActiveIndex(-1)
  }

  const submit = (value: string) => {
    close()
    // Enter wins over a pending debounced update
    window.clearTimeout(resultsTimer.current)
    setPushedQuery(value.trim())
    // An empty search lists every product
    void navigate({ to: "/search", search: (prev) => ({ ...(onResultsPage ? prev : {}), q: value.trim() || undefined, page: undefined }) })
  }

  // Picking a suggested product lists that product's brand for what was typed,
  // e.g. /search?q=sony&brandIds=<Sony>; without a brand it opens the product
  const pickSuggestion = (product: SearchSuggestion) => {
    close()
    if (!product.brandId) {
      void navigate({ to: "/products/$productId", params: { productId: product.id } })
      return
    }
    void navigate({ to: "/search", search: { q: query.trim() || undefined, brandIds: product.brandId } })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (event.key === "ArrowDown") setOpen(true)
      return
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        setActiveIndex((i) => (i + 1) % suggestions.length)
        break
      case "ArrowUp":
        event.preventDefault()
        setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
        break
      case "Escape":
        close()
        break
    }
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        // Enter on a highlighted product picks it; otherwise show all results
        if (showSuggestions && activeIndex >= 0) pickSuggestion(suggestions[activeIndex])
        else submit(query)
      }}
      className={cn("relative", className)}
    >
      <InputGroup className="h-11 rounded-full bg-muted/50">
        <InputGroupAddon className="ps-4">
          {isFetching && typedEnough ? <Loader2 className="animate-spin" /> : <Search />}
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          name="q"
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            showSuggestions && activeIndex >= 0
              ? `${listboxId}-${activeIndex}`
              : undefined
          }
          aria-label={t("header.search")}
          placeholder={t("header.searchPlaceholder")}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            setActiveIndex(-1)
            if (onResultsPage) scheduleResults(event.target.value)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
        />
        <InputGroupAddon align="inline-end" className="pe-1">
          <InputGroupButton
            type="submit"
            size="sm"
            className="h-9 rounded-full bg-brand-gradient px-5 text-white hover:opacity-90"
          >
            {t("header.search")}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      {showSuggestions && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg">
          <ul id={listboxId} role="listbox" aria-label={t("header.search")} className="py-1.5">
            {suggestions.map((product, index) => (
              <li
                key={product.id}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                // Keep focus in the input so onBlur doesn't close the list before the click lands
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pickSuggestion(product)}
                className={cn("flex cursor-pointer items-center gap-3 px-3 py-2 text-sm", index === activeIndex && "bg-muted")}
              >
                <span className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {product.image && <img src={product.image} alt="" className="size-full object-cover" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <HighlightedSuggestion text={product.name} query={query} />
                  {product.brand && <span className="text-xs text-muted-foreground">{product.brand}</span>}
                </span>
                {product.price != null && (
                  <span className="shrink-0 text-xs font-semibold">{formatPrice(product.price, i18n.language)}</span>
                )}
              </li>
            ))}
          </ul>
          {/* Same as pressing Enter */}
          <button
            type="submit"
            onMouseDown={(event) => event.preventDefault()}
            className="flex w-full items-center gap-2 border-t px-4 py-2.5 text-start text-sm font-medium text-secondary hover:bg-muted dark:text-foreground"
          >
            <Search className="size-4" />
            {t("header.seeAllResults", { q: query.trim() })}
          </button>
        </div>
      )}
    </form>
  )
}

// Small count bubble on the header's cart and wishlist icons
function CountBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      aria-hidden
      className="absolute -end-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold text-secondary-foreground"
    >
      {count > 99 ? "99+" : count}
    </span>
  )
}

function AccountActions() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const localCount = useCartStore(selectCartCount)
  const { token } = useAuth()
  const { data: serverCart } = useQuery(cartQueryOptions(token))
  // Signed in: units in the server cart (GET /cart); otherwise this browser's cart
  const cartCount = serverCart ? serverCart.items.reduce((sum, item) => sum + item.quantity, 0) : localCount
  const wishlistCount = useWishlistStore((state) => state.items.length)

  // Bring the user back to this page after signing in (not from the auth pages themselves)
  const redirect = signInRedirect(location)

  return (
    <div className="ms-auto flex items-center gap-1">
      {isAuthenticated ? (
        <UserMenu />
      ) : (
        <Link
          to="/login"
          search={{ redirect }}
          className={buttonVariants({
            variant: "ghost",
            className: "h-10 gap-2 rounded-full px-3",
          })}
        >
          <User />
          <span className="hidden sm:inline">{t("header.signIn")}</span>
        </Link>
      )}
      {/* The wishlist page is private, so guests are sent to sign in */}
      <Link
        to="/wishlist"
        aria-label={t("header.wishlistCount", { count: wishlistCount })}
        className={buttonVariants({
          variant: "ghost",
          size: "icon",
          className: "relative size-10 rounded-full",
        })}
      >
        <Heart />
        <CountBadge count={wishlistCount} />
      </Link>
      {/* The cart page is public; guests see a sign-in prompt there */}
      <Link
        to="/cart"
        aria-label={t("header.cartCount", { count: cartCount })}
        className={buttonVariants({
          variant: "ghost",
          size: "icon",
          className: "relative size-10 rounded-full",
        })}
      >
        <ShoppingBag />
        <CountBadge count={cartCount} />
      </Link>
    </div>
  )
}

// Departments from GET /catalogue/categories (shared with the mega menu's request)
function CategoryNav() {
  const { i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? i18n.language
  const { data: categories = [] } = useQuery(categoryMenuQueryOptions(lang))

  return (
    <nav className="border-t">
      <ScrollArea className="site-container">
        <div className="flex h-12 items-center gap-6 text-sm whitespace-nowrap">
          <CategoryMegaMenu />
          {categories.map((category) => (
            <Link
              key={category.id}
              to="/search"
              search={{ categoryIds: category.id }}
              className="text-bidi-plain text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "font-medium text-foreground" }}
            >
              {category.label}
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </nav>
  )
}

// Keeps the wishlist store in step with the signed-in account
function useWishlistSync() {
  const { token } = useAuth()
  const load = useWishlistStore((state) => state.load)
  const clear = useWishlistStore((state) => state.clear)
  useEffect(() => {
    if (token) void load(token)
    else clear()
  }, [token, load, clear])
}

export function SiteHeader() {
  useWishlistSync()
  return (
    <header className="sticky top-0 z-40 bg-card shadow-xs">
      <TopBar />
      <div className="site-container flex flex-wrap items-center gap-x-6 gap-y-3 py-3">
        <SiteLogo />
        <SearchForm className="order-last w-full md:order-none md:w-auto md:flex-1" />
        <AccountActions />
      </div>
      <CategoryNav />
    </header>
  )
}
