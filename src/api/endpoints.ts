import { env, type Service } from "@/lib/env"

// Every backend endpoint from FIGMA_FRONTEND_API_SPEC.md as a full URL on the
// service that owns it. HTTP methods are noted next to each entry; several
// paths serve more than one method (e.g. GET and PUT /auth/profile).

type QueryValue = string | number | boolean | readonly (string | number)[] | null | undefined

const enc = encodeURIComponent

function url(service: Service, path: string) {
  return `${env.apiUrl[service]}${path}`
}

// Appends query params, skipping empty values. Arrays are sent comma-separated,
// which the spec accepts for every list parameter (categoryIds, productIds, ...).
export function withQuery<T extends { [K in keyof T]?: QueryValue }>(base: string, params: T) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries<QueryValue>(params)) {
    if (value === undefined || value === null || value === "") continue
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(key, value.join(","))
    } else {
      search.set(key, String(value))
    }
  }
  const query = search.toString()
  return query ? `${base}?${query}` : base
}

export const endpoints = {
  // auth-service
  auth: {
    signIn: url("auth", "/auth/signin"), // POST
    signUp: url("auth", "/auth/signup"), // POST
    confirm: url("auth", "/auth/confirm"), // POST
    refresh: url("auth", "/auth/refresh"), // POST
    forgotPassword: url("auth", "/auth/forgot-password"), // POST
    resetPassword: url("auth", "/auth/reset-password"), // POST
    me: url("auth", "/auth/me"), // GET
    profile: url("auth", "/auth/profile"), // PUT
    profilePicture: url("auth", "/auth/profile/picture"), // POST (multipart), DELETE
  },

  // auth-service
  addresses: {
    list: url("auth", "/users/me/addresses"), // GET, POST
    byId: (addressId: string) => url("auth", `/users/me/addresses/${enc(addressId)}`), // PUT, DELETE
    setDefault: (addressId: string) =>
      url("auth", `/users/me/addresses/${enc(addressId)}/default`), // PATCH
  },

  // catalogue-service
  catalogue: {
    home: url("catalogue", "/catalogue/home"), // GET
    banners: url("catalogue", "/catalogue/banners"), // GET
    collections: url("catalogue", "/catalogue/collections"), // GET
    footer: url("catalogue", "/catalogue/footer"), // GET
    footerBenefits: url("catalogue", "/catalogue/footer-benefits"), // GET
    categories: url("catalogue", "/catalogue/categories"), // GET
    categoryChildren: (parentId: string) =>
      url("catalogue", `/catalogue/categories/${enc(parentId)}/children`), // GET
    brands: url("catalogue", "/catalogue/brands"), // GET
    featuredBrands: url("catalogue", "/catalogue/brands/featured"), // GET
  },

  // catalogue-service
  products: {
    list: url("catalogue", "/catalogue/products"), // GET
    search: url("catalogue", "/catalogue/products/search"), // GET, query in SearchParams
    featured: url("catalogue", "/catalogue/products/featured"), // GET
    trending: url("catalogue", "/catalogue/products/trending"), // GET
    deals: url("catalogue", "/catalogue/products/deals"), // GET
    bySlug: (slug: string) => url("catalogue", `/catalogue/products/${enc(slug)}`), // GET
    recordView: (productId: string) =>
      url("catalogue", `/catalogue/products/${enc(productId)}/view`), // POST, X-Visitor-Id when anonymous
    reviews: (productId: string) =>
      url("catalogue", `/catalogue/products/${enc(productId)}/reviews`), // GET, POST
    recommendations: (productId: string) =>
      url("catalogue", `/catalogue/products/${enc(productId)}/recommendations`), // GET, ?limit
    similar: (productId: string) =>
      url("catalogue", `/catalogue/products/${enc(productId)}/similar`), // GET, ?limit
    customersAlsoViewed: (productId: string) =>
      url("catalogue", `/catalogue/products/${enc(productId)}/customers-also-viewed`), // GET, ?limit
    // Owned by order-service, not catalogue
    frequentlyBoughtTogether: (productId: string) =>
      url("order", `/orders/products/${enc(productId)}/frequently-bought-together`), // GET
  },

  // Owner not stated in the spec; see VITE_WISHLIST_API_URL
  wishlist: {
    list: url("wishlist", "/wishlist"), // GET
    status: (productId: string) => url("wishlist", `/wishlist/status/${enc(productId)}`), // GET
    statuses: url("wishlist", "/wishlist/statuses"), // GET, ?productIds (1–100)
    items: url("wishlist", "/wishlist/items"), // POST
    item: (productId: string) => url("wishlist", `/wishlist/items/${enc(productId)}`), // DELETE
  },

  // cart-service
  cart: {
    view: url("cart", "/cart"), // GET
    items: url("cart", "/cart/items"), // POST
    item: (itemId: string) => url("cart", `/cart/items/${enc(itemId)}`), // PATCH, DELETE
    coupon: url("cart", "/cart/coupon"), // POST, DELETE
  },

  // order-service
  orders: {
    list: url("order", "/orders"), // GET (?page, size), POST to place an order
    byId: (orderId: string) => url("order", `/orders/${enc(orderId)}`), // GET
    cancel: (orderId: string) => url("order", `/orders/${enc(orderId)}/cancel`), // POST
  },

  // notification-service
  notifications: {
    list: url("notification", "/notifications"), // GET, ?isRead, page, size
    unreadCount: url("notification", "/notifications/unread-count"), // GET
    markRead: (notificationId: string) =>
      url("notification", `/notifications/${enc(notificationId)}/read`), // POST
    markAllRead: url("notification", "/notifications/read-all"), // POST
    preferences: url("notification", "/notifications/preferences"), // GET, PUT
  },

  // catalogue-service, admin token required
  admin: {
    footerGroups: url("catalogue", "/admin/catalogue/footer/groups"), // GET, POST
    footerGroup: (groupId: string) =>
      url("catalogue", `/admin/catalogue/footer/groups/${enc(groupId)}`), // GET, PUT, DELETE
    footerGroupLinks: (groupId: string) =>
      url("catalogue", `/admin/catalogue/footer/groups/${enc(groupId)}/links`), // GET, POST
    footerLink: (linkId: string) =>
      url("catalogue", `/admin/catalogue/footer/links/${enc(linkId)}`), // GET, PUT, DELETE
    footerBenefits: url("catalogue", "/admin/catalogue/footer-benefits"), // GET, POST
    footerBenefit: (benefitId: string) =>
      url("catalogue", `/admin/catalogue/footer-benefits/${enc(benefitId)}`), // GET, PUT, DELETE
  },
} as const

// Query parameters accepted by GET /catalogue/products/search
export interface ProductSearchParams {
  q?: string
  categoryIds?: string[]
  brandIds?: string[]
  sellerIds?: string[]
  variant?: string
  tags?: string[]
  spec?: string
  minRating?: number
  minDiscount?: number
  maxDiscount?: number
  minPrice?: number
  maxPrice?: number
  pincode?: string
  inStock?: boolean
  // "relevance" appears in the spec's example request but not its enum list; confirm with the backend
  sort?: "relevance" | "newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc"
  // Zero-based
  page?: number
  // 1–100
  size?: number
}
