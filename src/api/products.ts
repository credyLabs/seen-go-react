// Product types shared by the product page, product cards and the stores.
// Data comes from the catalogue API (see product-page.ts and home.ts).

export type ProductBadge = "bestseller" | "new" | "deal" | "hot"

export type ProductMedia =
  | { type: "image"; src: string }
  | { type: "video"; src: string; poster: string }

export interface ProductColor {
  name: string
  hex: string
}

export interface Product {
  id: string
  brand: string
  name: string
  description: string
  image: string
  badge?: ProductBadge
  rating: number
  reviewCount: number
  price: number
  // Only set when the product is discounted
  originalPrice?: number
}

// What a product card needs. API items may lack a price, rating or seller,
// so everything beyond the name, image and link is optional.
export interface ProductCardData {
  // Route param for /products/$productId (the product slug)
  id: string
  name: string
  image: string | null
  brand?: string
  description?: string
  badge?: ProductBadge
  rating?: number
  reviewCount?: number
  price?: number | null
  originalPrice?: number
}

export interface ProductDetail extends Product {
  // Product UUID; the related-product, review and view endpoints use it
  uuid: string
  gallery: ProductMedia[]
  colors: ProductColor[]
  overview: string
  highlights: string[]
  specs: { label: string; value: string }[]
  // Category display name, when the API resolves one
  categoryName?: string
  // Unknown (undefined) until sellers list stock for the product
  inStock?: boolean
  maxQuantity?: number
}
