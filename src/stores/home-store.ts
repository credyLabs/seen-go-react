import { useEffect } from "react"
import { create } from "zustand"

import { fetchHome, type HomeResponse } from "@/api/home"

// GET /catalogue/home, loaded once when the home page first opens and kept
// here for the session: coming back to the home page reads the store instead
// of calling the API again. The hero and the sections below share it.

type HomeStatus = "idle" | "loading" | "success" | "error"

interface HomeState {
  data: HomeResponse | null
  // Language the data was loaded for; switching language loads it again
  lang: string | null
  status: HomeStatus
  // Skips the request when this language is already loaded or loading; force re-requests (retry)
  load: (lang: string, options?: { force?: boolean }) => Promise<void>
}

export const useHomeStore = create<HomeState>()((set, get) => ({
  data: null,
  lang: null,
  status: "idle",
  load: async (lang, { force = false } = {}) => {
    const { status, lang: loadedLang } = get()
    const sameLang = loadedLang === lang
    if (sameLang && status === "loading") return
    if (sameLang && status === "success" && !force) return

    set({ lang, status: "loading", ...(sameLang ? {} : { data: null }) })
    try {
      const data = await fetchHome()
      // Ignore a slow response for a language the user has since switched away from
      if (get().lang === lang) set({ data, status: "success" })
    } catch {
      if (get().lang === lang) set({ status: "error" })
    }
  },
}))

// Loads the home data on first use and returns it from the store
export function useHomeData(lang: string) {
  const data = useHomeStore((state) => (state.lang === lang ? state.data : null))
  const status = useHomeStore((state) => (state.lang === lang ? state.status : "idle"))
  const load = useHomeStore((state) => state.load)

  useEffect(() => {
    void load(lang)
  }, [load, lang])

  return {
    data,
    // Still pending until this language has data (or failed)
    isPending: !data && status !== "error",
    isError: status === "error" && !data,
    isRetrying: status === "loading",
    retry: () => void load(lang, { force: true }),
  }
}
