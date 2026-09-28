import { useRouter, useSearch } from "@tanstack/react-router"
import { flushSync } from "react-dom"

import { useAuth, type AuthUser } from "@/lib/auth"

// Stores the token, then sends the user back to where they were headed
export function useCompleteAuth() {
  const auth = useAuth()
  const router = useRouter()
  const search = useSearch({ from: "/_auth" })

  return (token: string, user: AuthUser) => {
    // Commit the new auth state so the router context is current before navigating
    flushSync(() => auth.login(token, user))

    // redirect is a full href (may include search params), so push it as-is
    if (search.redirect) {
      router.history.push(search.redirect)
    } else {
      void router.navigate({ to: "/dashboard" })
    }
  }
}
