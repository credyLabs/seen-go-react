import { queryOptions } from "@tanstack/react-query"

import { endpoints } from "@/api/endpoints"
import { request } from "@/api/http"

// GET /catalogue/footer — the footer's link columns (Shop, Help, Company, Legal)

export interface FooterLink {
  id: string
  title: string
  url: string
  sortOrder: number
}

export interface FooterGroup {
  id: string
  key: string
  title: string
  sortOrder: number
  links: FooterLink[]
}

const bySortOrder = (a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder

export async function fetchFooter(): Promise<FooterGroup[]> {
  const data = await request<{ groups: FooterGroup[] }>(endpoints.catalogue.footer)
  return [...data.groups]
    .sort(bySortOrder)
    .map((group) => ({ ...group, links: [...group.links].sort(bySortOrder) }))
    // A column with no links would be an empty heading
    .filter((group) => group.links.length > 0)
}

export const footerQueryOptions = (lang: string) =>
  queryOptions({
    queryKey: ["catalogue", "footer", lang],
    // lang is in the key so switching language refetches; send it once the API localizes content
    queryFn: fetchFooter,
    // Footer links rarely change; keep them for the session
    staleTime: Infinity,
  })
