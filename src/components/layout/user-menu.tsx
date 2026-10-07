import { Link, useRouter } from "@tanstack/react-router"
import { ChevronDown, Heart, LayoutDashboard, LogOut, Package, UserCog } from "lucide-react"
import { flushSync } from "react-dom"
import { useTranslation } from "react-i18next"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth"
import { useCartStore } from "@/stores/cart-store"
import { useWishlistStore } from "@/stores/wishlist-store"

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

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ")
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

      <DropdownMenuContent align="end" className="w-60">
        <div className="flex flex-col px-2 py-2">
          <span className="truncate text-sm font-semibold">{fullName}</span>
          <span className="truncate text-xs text-muted-foreground">
            {user?.email}
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/dashboard" />}>
          <LayoutDashboard />
          {t("header.myAccount")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/profile" />}>
          <UserCog />
          {t("header.profileSettings")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/orders" />}>
          <Package />
          {t("header.orders")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/wishlist" />}>
          <Heart />
          {t("header.myWishlist")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
