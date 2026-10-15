import { queryOptions } from "@tanstack/react-query"

import { endpoints } from "@/api/endpoints"
import { request } from "@/api/http"
import { queryClient } from "@/lib/query-client"

// GET /catalogue/categories returns the whole category tree, e.g.
// Electronics > Mobile Phones > Smartphones > iPhone.

export interface ApiCategory {
  id: string
  parentId: string | null
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  sortOrder: number
  hasChildren: boolean
  children: ApiCategory[]
}

export function fetchCategoryTree() {
  return request<ApiCategory[]>(endpoints.catalogue.categories)
}

export const categoryTreeQueryOptions = queryOptions({
  queryKey: ["catalogue", "categories"],
  queryFn: fetchCategoryTree,
  // The tree rarely changes; keep it for the session
  staleTime: Infinity,
})

// Shared with the mega menu's query, so the tree is fetched once
export const fetchCachedCategoryTree = () => queryClient.fetchQuery(categoryTreeQueryOptions)

const bySortOrder = (a: ApiCategory, b: ApiCategory) => a.sortOrder - b.sortOrder

// Every category in the tree, at any depth
export function flattenCategories(categories: ApiCategory[]): ApiCategory[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children)])
}

// --- Mega menu ---

export interface CategoryLink {
  id: string
  label: string
  slug: string
}

export interface CategoryGroup extends CategoryLink {
  links: CategoryLink[]
}

export interface MenuCategory extends CategoryLink {
  imageUrl: string | null
  groups: CategoryGroup[]
}

const toLink = (category: ApiCategory): CategoryLink => ({
  id: category.id,
  label: category.name,
  slug: category.slug,
})

// Menu = the top-level departments: the root's children when the API wraps
// everything in a single root (Electronics), otherwise the roots themselves.
// Each department's children are the panel's groups, their children the links.
export function toMenu(tree: ApiCategory[]): MenuCategory[] {
  const departments = tree.length === 1 && tree[0].children.length > 0 ? tree[0].children : tree
  return [...departments].sort(bySortOrder).map((department) => ({
    ...toLink(department),
    imageUrl: department.imageUrl,
    groups: [...department.children].sort(bySortOrder).map((group) => ({
      ...toLink(group),
      links: [...group.children].sort(bySortOrder).map(toLink),
    })),
  }))
}

export const categoryMenuQueryOptions = (lang: string) =>
  queryOptions({
    queryKey: ["categories", "menu", lang],
    // lang is in the key so switching language refetches; pass it to the request once the API localizes names
    queryFn: async () => toMenu(await fetchCachedCategoryTree()),
    staleTime: Infinity,
  })
