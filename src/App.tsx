import { useAuth } from "@/lib/auth"
import { queryClient } from "@/lib/query-client"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

const router = createRouter({
  routeTree,
  // auth is injected at render time below
  context: { auth: undefined!, queryClient },
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

export function App() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth }} />
}

export default App
