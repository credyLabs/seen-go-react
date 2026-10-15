// Product types shared by the product page, product cards and the stores.
// Data comes from the catalogue API (see product-page.ts and home.ts).

export type ProductBadge = "bestseller" | "new" | "deal" | "hot"

export type ProductMedia =
  | { type: "image"; src: string; alt?: string }
  | { type: "video"; src: string; poster: string; alt?: string }

// One purchasable variant, e.g. Edition: Standard
export interface ProductVariant {
  id: string
  name: string
  // e.g. [{ name: "Edition", value: "Standard" }]
  options: { name: string; value: string }[]
  // Lowest seller price for this variant; null until a seller lists it
  price: number | null
  // That seller's listing, for POST /cart/items
  listingId?: string
  // Unknown (undefined) until sellers list stock for it
  inStock?: boolean
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
  // Product UUID, for the wishlist and other id-based APIs
  uuid?: string
  name: string
  image: string | null
  brand?: string
  description?: string
  badge?: ProductBadge
  rating?: number
  reviewCount?: number
  price?: number | null
  originalPrice?: number
  // false when every seller is sold out; undefined when unknown
  inStock?: boolean
  // Seller listing POST /cart/items adds (the API's bestListing.listingId)
  listingId?: string
}

export interface ProductDetail extends Product {
  // Product UUID; the related-product, review and view endpoints use it
  uuid: string
  gallery: ProductMedia[]
  variants: ProductVariant[]
  // The API's discount percentage, e.g. 9.09
  discountPercent?: number
  overview: string
  highlights: string[]
  specs: { label: string; value: string }[]
  // Category display name, when the API resolves one
  categoryName?: string
  // Unknown (undefined) until sellers list stock for the product
  inStock?: boolean
  minQuantity?: number
  maxQuantity?: number
}
