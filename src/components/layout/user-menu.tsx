import { Link, useRouter } from "@tanstack/react-router"
import { ChevronDown, CircleHelp, Heart, LogOut, MapPin, Package, Settings, type LucideIcon } from "lucide-react"
import { flushSync } from "react-dom"
import { useTranslation } from "react-i18next"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth"
import { useCartStore } from "@/stores/cart-store"
import { useWishlistStore } from "@/stores/wishlist-store"

const ITEM_CLASS = "gap-2.5 rounded-lg px-2.5 py-2 text-sm"

// TODO: point Help & Support at the support page once it exists
const MENU_ITEMS: { to?: "/orders" | "/wishlist" | "/profile" | "/addresses"; label: string; Icon: LucideIcon }[] = [
  { to: "/orders", label: "header.menu.orders", Icon: Package },
  { to: "/wishlist", label: "header.menu.wishlist", Icon: Heart },
  { to: "/profile", label: "header.menu.profile", Icon: Settings },
  { label: "header.menu.help", Icon: CircleHelp },
  { to: "/addresses", label: "header.menu.addresses", Icon: MapPin },
]

export function UserMenu() {
  const { t } = useTranslation()
  const auth = useAuth()
  const router = useRouter()
  const user = auth.user

  const handleLogout = async () => {
    // Commit the new auth state so the router context is current, then re-run
    // guards: private pages redirect to /login, public pages stay put
    flushSync(() => auth.logout())
    // Cart and wishlist live on this device until their APIs are wired, so
    // don't leave them for whoever signs in next
    useCartStore.getState().clear()
    useWishlistStore.getState().clear()
    await router.invalidate()
  }

  const initials =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .map((part) => part![0])
      .join("")
      .toUpperCase() || "?"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-10 gap-2 rounded-full ps-1 pe-2"
            aria-label={t("header.account")}
          />
        }
      >
        <Avatar>
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-32 truncate sm:inline">
          {user?.firstName}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>

      {/* As in the design: six large rows in a rounded panel, Logout in red */}
      <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-lg">
        {MENU_ITEMS.map(({ to, label, Icon }) => (
          <DropdownMenuItem key={label} render={to ? <Link to={to} /> : <a href="#" />} className={ITEM_CLASS}>
            <Icon className="size-4" />
            {t(label)}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem variant="destructive" onClick={handleLogout} className={ITEM_CLASS}>
          <LogOut className="size-4" />
          {t("header.menu.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
