import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { ThemeProvider } from "@/components/theme-provider.tsx"
import { AuthProvider } from "@/lib/auth.tsx"
import { queryClient } from "@/lib/query-client.ts"
import App from "./App.tsx"
import { LanguageDirectionProvider } from "./components/language-direction-provider.tsx"
import "./i18n"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <LanguageDirectionProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LanguageDirectionProvider>
      </ThemeProvider>
      <ReactQueryDevtools buttonPosition="bottom-right" />
    </QueryClientProvider>
  </StrictMode>
)
