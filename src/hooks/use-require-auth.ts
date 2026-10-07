import { useLocation, useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"

import { useAuth } from "@/lib/auth"

export const AUTH_PATHS = ["/login", "/signup"]

// Where to return after signing in: the current page, unless it's a sign-in page itself
export function signInRedirect(location: { pathname: string; href: string }) {
  return AUTH_PATHS.includes(location.pathname) ? undefined : location.href
}

// Guards an action (add to cart, wishlist, buy now, ...) the same way the
// _private layout guards pages: signed-in users run it straight away; guests
// go to the sign-in page and come back here afterwards.
export function useRequireAuth() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(
    (action?: () => void) => {
      if (isAuthenticated) {
        action?.()
        return
      }
      // Already signing in: stay put so the existing ?redirect isn't lost
      if (AUTH_PATHS.includes(location.pathname)) return
      void navigate({ to: "/login", search: { redirect: location.href } })
    },
    [isAuthenticated, navigate, location]
  )
}
