import { create } from "zustand"

interface CategoryMenuState {
  open: boolean
  // Category highlighted in the mega menu; null falls back to the first one
  activeCategoryId: string | null
  setOpen: (open: boolean) => void
  setActiveCategory: (id: string) => void
}

// Kept in a store (not local state) so anything, e.g. a category link or a route
// change, can close the menu without prop drilling.
export const useCategoryMenuStore = create<CategoryMenuState>()((set) => ({
  open: false,
  activeCategoryId: null,
  setOpen: (open) => set({ open }),
  setActiveCategory: (activeCategoryId) => set({ activeCategoryId }),
}))
