import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import type { AuthContext } from "@/lib/auth"
import type { QueryClient } from "@tanstack/react-query"
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

interface RouterContext {
  auth: AuthContext
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

// Every page (public, auth, private) shares the site header and footer.
// The header switches between "Sign in" and the profile menu based on auth state.
function RootComponent() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <TanStackRouterDevtools />
    </div>
  )
}
