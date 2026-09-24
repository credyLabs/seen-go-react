import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { ThemeProvider } from "@/components/theme-provider.tsx"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { DirectionProvider } from "./components/ui/direction.tsx"
import "./i18n"
import "./index.css"
import { routeTree } from "./routeTree.gen.ts"
const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <DirectionProvider direction="ltr">
        <RouterProvider router={router} />
      </DirectionProvider>
    </ThemeProvider>
  </StrictMode>
)
