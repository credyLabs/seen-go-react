import { createFileRoute, redirect } from "@tanstack/react-router"

import { productSlugFromLink } from "@/api/home"

// The API's links use /catalogue/products/<slug> (e.g. linkUrl on home items);
// send them to the product page so those links work anywhere in the app.
export const Route = createFileRoute("/catalogue/products/$slug")({
  beforeLoad: ({ params, location }) => {
    const slug = productSlugFromLink(`/catalogue/products/${params.slug}`)
    // Listing paths (search, deals, trending, …) open the product listing,
    // keeping the API link's query and category, e.g. search?categoryIds=…
    if (!slug) {
      const query = new URLSearchParams(location.searchStr)
      throw redirect({
        to: "/search",
        search: {
          q: query.get("q") || undefined,
          categoryIds: query.get("categoryIds") || query.get("categoryId") || undefined,
          brandIds: query.get("brandIds") || query.get("brandId") || undefined,
        },
        replace: true,
      })
    }
    throw redirect({ to: "/products/$productId", params: { productId: slug }, replace: true })
  },
})
