import { createFileRoute, redirect } from "@tanstack/react-router"

import { productSlugFromLink } from "@/api/home"

// The API's links use /catalogue/products/<slug> (e.g. linkUrl on home items);
// send them to the product page so those links work anywhere in the app.
export const Route = createFileRoute("/catalogue/products/$slug")({
  beforeLoad: ({ params }) => {
    const slug = productSlugFromLink(`/catalogue/products/${params.slug}`)
    // Listing paths (deals, trending, …) have no page yet
    // TODO: send these to the listing page once it exists
    if (!slug) throw redirect({ to: "/", replace: true })
    throw redirect({ to: "/products/$productId", params: { productId: slug }, replace: true })
  },
})
