import { QueryClient } from "@tanstack/react-query"

// One client for the whole app. It is also passed into the router context so
// route loaders can prefetch with `context.queryClient.ensureQueryData(...)`.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
