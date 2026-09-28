import { queryOptions } from "@tanstack/react-query"

// TODO: replace with the real endpoint, e.g. GET /api/search/suggestions?q=xx&lang=xx.
const MOCK_TERMS = [
  "headphones",
  "headphones wireless",
  "headphones sony",
  "headphones noise cancelling",
  "headphones bluetooth",
  "headset gaming",
  "iphone 16 pro",
  "iphone 16",
  "iphone case",
  "ipad air",
  "ipad pro",
  "macbook air m3",
  "macbook pro",
  "samsung galaxy s24",
  "samsung galaxy watch",
  "smart watch",
  "smart tv",
  "sony playstation 5",
  "laptop gaming",
  "laptop bag",
  "power bank",
  "airpods pro",
  "airpods max",
  "apple watch",
  "bluetooth speaker",
  "camera mirrorless",
]

const MAX_SUGGESTIONS = 6

export async function fetchSearchSuggestions(query: string): Promise<string[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const words = q.split(/\s+/)
  // Terms starting with the query come first, then those whose words start with it
  const prefix = MOCK_TERMS.filter((term) => term.startsWith(q))
  const partial = MOCK_TERMS.filter(
    (term) =>
      !term.startsWith(q) &&
      words.every((word) => term.split(" ").some((part) => part.startsWith(word)))
  )
  // Fall back to terms sharing the first few letters (e.g. "headphones" -> "headset")
  const fuzzy = MOCK_TERMS.filter(
    (term) =>
      !prefix.includes(term) &&
      !partial.includes(term) &&
      term.startsWith(q.slice(0, 4))
  )
  return [...prefix, ...partial, ...fuzzy].slice(0, MAX_SUGGESTIONS)
}

export const searchSuggestionsQueryOptions = (query: string, lang: string) =>
  queryOptions({
    queryKey: ["search", "suggestions", lang, query.trim().toLowerCase()],
    queryFn: () => fetchSearchSuggestions(query),
    enabled: query.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  })
