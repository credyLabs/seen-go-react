import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Link, useLocation } from "@tanstack/react-router"
import {
  Heart,
  MapPin,
  Phone,
  Search,
  ShoppingBag,
  User
} from "lucide-react"
import { useEffect, useId, useState } from "react"
import { useTranslation } from "react-i18next"

import { searchSuggestionsQueryOptions } from "@/api/search"
import { LanguageSwitcher } from "@/components/language-switcher"
import { CategoryMegaMenu } from "@/components/layout/category-mega-menu"
import { SiteLogo } from "@/components/layout/site-logo"
import { UserMenu } from "@/components/layout/user-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  "smartphones",
  "laptops",
  "audio",
  "wearables",
  "tablets",
  "gaming",
  "smartHome",
  "cameras",
  "brands",
] as const

const AUTH_PATHS = ["/login", "/signup"]

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

const SUGGESTION_DEBOUNCE_MS = 200

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// Bold the part of the suggestion that matches what was typed, e.g. **head**set
function HighlightedSuggestion({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase()
  let matched = 0
  while (
    matched < q.length &&
    matched < text.length &&
    text[matched].toLowerCase() === q[matched]
  ) {
    matched++
  }

  return (
    <span className="truncate">
      <span className="font-semibold text-foreground">{text.slice(0, matched)}</span>
      <span className="text-muted-foreground">{text.slice(matched)}</span>
    </span>
  )
}

function SearchForm({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listboxId = useId()

  const debouncedQuery = useDebouncedValue(query, SUGGESTION_DEBOUNCE_MS)
  const { data: suggestions = [] } = useQuery({
    ...searchSuggestionsQueryOptions(debouncedQuery, i18n.language),
    placeholderData: keepPreviousData,
  })

  const showSuggestions =
    open && query.trim().length > 0 && suggestions.length > 0

  const submit = (value: string) => {
    setQuery(value)
    setOpen(false)
    setActiveIndex(-1)
    // TODO: navigate to the search results route once it exists
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
        setOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        submit(
          showSuggestions && activeIndex >= 0 ? suggestions[activeIndex] : query
        )
      }}
      className={cn("relative", className)}
    >
      <InputGroup className="h-11 rounded-full bg-muted/50">
        <InputGroupAddon className="ps-4">
          <Search />
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
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t("header.search")}
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover py-1.5 text-popover-foreground shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              // Keep focus in the input so onBlur doesn't close the list before the click lands
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => submit(suggestion)}
              className={cn(
                "flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm",
                index === activeIndex && "bg-muted"
              )}
            >
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <HighlightedSuggestion text={suggestion} query={query} />
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}

function AccountActions() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  // Bring the user back to this page after signing in (not from the auth pages themselves)
  const redirect = AUTH_PATHS.includes(location.pathname)
    ? undefined
    : location.href

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
      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-full"
        aria-label={t("header.wishlist")}
      >
        <Heart />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-full"
        aria-label={t("header.cart")}
      >
        <ShoppingBag />
      </Button>
    </div>
  )
}

function CategoryNav() {
  const { t } = useTranslation()

  return (
    <nav className="border-t">
      <ScrollArea className="site-container">
        <div className="flex h-12 items-center gap-6 text-sm whitespace-nowrap">
          <CategoryMegaMenu />
          {/* TODO: point these at category routes once they exist */}
          {CATEGORIES.map((category) => (
            <a
              key={category}
              href="#"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(`header.categories.${category}`)}
            </a>
          ))}
          <a href="#" className="font-medium text-destructive hover:underline">
            {t("header.categories.deals")}
          </a>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </nav>
  )
}

export function SiteHeader() {
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
