import { queryOptions } from "@tanstack/react-query"

import laptopImage from "@/assets/laptop.jpg"
import iphoneImage from "@/assets/product-1.jpg"
import samsungImage from "@/assets/product-2.png"
import sonyImage from "@/assets/product-3.png"
import boseImage from "@/assets/product-4.png"
import ps5Image from "@/assets/product-5.png"
import gamingSetupImage from "@/assets/product-6.jpg"
import headphonesDeskImage from "@/assets/product-detail-1.png"
import headphonesLeatherImage from "@/assets/product-detail-2.png"
// TODO: placeholder slideshow of the product photos; replace with the real product video
import sonyVideo from "@/assets/product-video-sony-wh-1000xm6.webm"

export type ProductBadge = "bestseller" | "new" | "deal"

// Keys of `header.categories` in the locale files
export type ProductCategory =
  | "smartphones"
  | "laptops"
  | "audio"
  | "gaming"
  | "monitors"

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
  category: ProductCategory
  badge?: ProductBadge
  rating: number
  reviewCount: number
  price: number
  // Only set when the product is discounted
  originalPrice?: number
}

export interface ProductDetail extends Product {
  // First item is shown first; defaults to the card image
  gallery: ProductMedia[]
  colors: ProductColor[]
  overview: string
  highlights: string[]
  specs: { label: string; value: string }[]
  warrantyYears: number
  inStock: boolean
  // Bought-together suggestions and the discount when all are added together
  bundle?: { productIds: string[]; discount: number }
}

type CatalogEntry = Product & Partial<Omit<ProductDetail, keyof Product>>

// TODO: replace with the real endpoints, e.g. GET /api/products/:id?lang=xx.
// Names, descriptions and copy are expected to come back localized for `lang`.
const CATALOG: CatalogEntry[] = [
  {
    id: "sony-wh-1000xm6",
    brand: "Sony",
    name: "Sony WH-1000XM6 Wireless Headphones",
    description: "Industry-leading ANC, 30h battery, LDAC + Auracast.",
    image: sonyImage,
    category: "audio",
    badge: "deal",
    rating: 4.8,
    reviewCount: 2104,
    price: 1499,
    originalPrice: 1699,
    gallery: [
      { type: "image", src: sonyImage },
      { type: "video", src: sonyVideo, poster: sonyImage },
      { type: "image", src: headphonesDeskImage },
      { type: "image", src: headphonesLeatherImage },
    ],
    colors: [
      { name: "Midnight Black", hex: "#1f1d1b" },
      { name: "Platinum Silver", hex: "#9c968a" },
      { name: "Smoky Pink", hex: "#d8d3cb" },
      { name: "Midnight Blue", hex: "#1c3a63" },
    ],
    overview:
      "Sony's sixth-generation flagship over-ears refine the formula: a lighter foldable frame, twelve microphones for class-leading noise cancellation, and the new QN3 processor that adapts to your environment as you walk through DXB terminals.",
    highlights: [
      "12-mic adaptive ANC",
      "30h battery, USB-C fast charge",
      "LDAC, LC3, Auracast",
      "Multipoint to two devices",
      "Foldable travel design",
    ],
    specs: [
      { label: "Model", value: "WH-1000XM6" },
      { label: "Driver", value: "30 mm carbon fibre composite" },
      { label: "Noise cancelling", value: "Adaptive, 12 microphones, QN3 processor" },
      { label: "Battery", value: "Up to 30 hours (ANC on), 3 min charge = 3 hours" },
      { label: "Bluetooth", value: "5.3, multipoint (2 devices)" },
      { label: "Codecs", value: "SBC, AAC, LDAC, LC3" },
      { label: "Weight", value: "254 g" },
      { label: "In the box", value: "Carry case, USB-C cable, 3.5 mm audio cable" },
    ],
    warrantyYears: 2,
    bundle: {
      productIds: ["iphone-16-pro-max-256", "macbook-pro-14-m4-pro-1tb"],
      discount: 240,
    },
  },
  {
    id: "iphone-16-pro-max-256",
    brand: "Apple",
    name: "iPhone 16 Pro Max 256GB",
    description: "Titanium build, A18 Pro chip, 48MP Fusion camera with 5x telephoto.",
    image: iphoneImage,
    category: "smartphones",
    badge: "bestseller",
    rating: 4.8,
    reviewCount: 1284,
    price: 4799,
    originalPrice: 5199,
    colors: [
      { name: "Desert Titanium", hex: "#bfa48f" },
      { name: "Natural Titanium", hex: "#c2bcb2" },
      { name: "White Titanium", hex: "#f2f1ed" },
      { name: "Black Titanium", hex: "#3c3c3d" },
    ],
  },
  {
    id: "galaxy-s25-ultra-512",
    brand: "Samsung",
    name: "Samsung Galaxy S25 Ultra 512GB",
    description: "Snapdragon 8 Elite, 200MP camera, built-in S Pen.",
    image: samsungImage,
    category: "smartphones",
    badge: "new",
    rating: 4.7,
    reviewCount: 932,
    price: 4499,
    originalPrice: 4899,
  },
  {
    id: "bose-qc-ultra-earbuds",
    brand: "Bose",
    name: "Bose QuietComfort Ultra Earbuds",
    description: "Immersive audio, world-class ANC, custom fit.",
    image: boseImage,
    category: "audio",
    badge: "deal",
    rating: 4.6,
    reviewCount: 712,
    price: 1199,
    originalPrice: 1399,
  },
  {
    id: "ps5-slim-disc",
    brand: "Sony",
    name: "PlayStation 5 Slim Disc Edition",
    description: "1TB SSD, 4K gaming at up to 120fps, DualSense controller.",
    image: ps5Image,
    category: "gaming",
    badge: "bestseller",
    rating: 4.9,
    reviewCount: 3210,
    price: 1899,
    originalPrice: 2099,
  },
  {
    id: "iphone-16-128",
    brand: "Apple",
    name: "iPhone 16 128GB",
    description: "A18 chip, Camera Control, 48MP Fusion camera.",
    image: iphoneImage,
    category: "smartphones",
    badge: "deal",
    rating: 4.7,
    reviewCount: 1856,
    price: 3199,
    originalPrice: 3399,
  },
  {
    id: "galaxy-z-fold6",
    brand: "Samsung",
    name: "Samsung Galaxy Z Fold6 256GB",
    description: "7.6\" foldable display, Galaxy AI, slimmer hinge.",
    image: samsungImage,
    category: "smartphones",
    badge: "bestseller",
    rating: 4.5,
    reviewCount: 438,
    price: 6299,
    originalPrice: 6999,
  },
  {
    id: "sony-wh-ch720n",
    brand: "Sony",
    name: "Sony WH-CH720N Headphones",
    description: "Lightweight ANC, 35h battery, multipoint pairing.",
    image: sonyImage,
    category: "audio",
    badge: "deal",
    rating: 4.4,
    reviewCount: 1520,
    price: 349,
    originalPrice: 449,
  },
  {
    id: "bose-qc-earbuds-ii",
    brand: "Bose",
    name: "Bose QuietComfort Earbuds II",
    description: "CustomTune sound calibration, 6h battery, IPX4.",
    image: boseImage,
    category: "audio",
    badge: "new",
    rating: 4.5,
    reviewCount: 964,
    price: 799,
    originalPrice: 999,
  },
  {
    id: "iphone-15-pro-refurbished",
    brand: "Apple",
    name: "iPhone 15 Pro 256GB (Renewed)",
    description: "Certified renewed, 1-year warranty, 90%+ battery health.",
    image: iphoneImage,
    category: "smartphones",
    badge: "deal",
    rating: 4.3,
    reviewCount: 376,
    price: 2999,
    originalPrice: 3599,
    warrantyYears: 1,
  },
  {
    id: "airpods-pro-3-usb-c",
    brand: "Apple",
    name: "AirPods Pro 3 with USB-C",
    description: "Adaptive Audio, lossless with Vision Pro, hearing aid mode.",
    image: boseImage,
    category: "audio",
    rating: 4.7,
    reviewCount: 1820,
    price: 949,
  },
  {
    id: "ps5-pro",
    brand: "Sony",
    name: "PlayStation 5 Pro",
    description: "2TB SSD, PSSR upscaling, advanced ray tracing.",
    image: ps5Image,
    category: "gaming",
    badge: "new",
    rating: 4.9,
    reviewCount: 2476,
    price: 2999,
  },
  {
    id: "iphone-16e-128",
    brand: "Apple",
    name: "iPhone 16e 128GB",
    description: "A18 chip, 48MP Fusion camera, all-day battery.",
    image: iphoneImage,
    category: "smartphones",
    rating: 4.5,
    reviewCount: 642,
    price: 2599,
  },
  {
    id: "galaxy-s25-256",
    brand: "Samsung",
    name: "Samsung Galaxy S25 256GB",
    description: "Compact flagship, Galaxy AI, 7 years of updates.",
    image: samsungImage,
    category: "smartphones",
    badge: "deal",
    rating: 4.6,
    reviewCount: 1105,
    price: 3199,
    originalPrice: 3499,
  },
  {
    id: "sony-ult-wear",
    brand: "Sony",
    name: "Sony ULT WEAR Headphones",
    description: "ULT bass boost, ANC, 30h battery.",
    image: sonyImage,
    category: "audio",
    rating: 4.3,
    reviewCount: 488,
    price: 699,
  },
  {
    id: "dualsense-edge",
    brand: "Sony",
    name: "DualSense Edge Wireless Controller",
    description: "Swappable sticks, back buttons, custom profiles.",
    image: ps5Image,
    category: "gaming",
    badge: "bestseller",
    rating: 4.6,
    reviewCount: 954,
    price: 849,
  },
  {
    id: "bose-ultra-open-earbuds",
    brand: "Bose",
    name: "Bose Ultra Open Earbuds",
    description: "Open-ear design, Immersive Audio, all-day comfort.",
    image: boseImage,
    category: "audio",
    badge: "deal",
    rating: 4.4,
    reviewCount: 367,
    price: 1049,
    originalPrice: 1199,
  },
  {
    id: "macbook-pro-14-m4-pro-1tb",
    brand: "Apple",
    name: "MacBook Pro 14\" M4 Pro 1TB",
    description: "M4 Pro chip, Liquid Retina XDR, up to 20h battery.",
    image: laptopImage,
    category: "laptops",
    badge: "bestseller",
    rating: 4.9,
    reviewCount: 412,
    price: 8999,
  },
  {
    id: "lg-ultragear-oled-32",
    brand: "LG",
    name: "LG UltraGear 32\" OLED Gaming Monitor",
    description: "4K 240Hz OLED, 0.03ms response, HDR True Black 400.",
    image: gamingSetupImage,
    category: "monitors",
    badge: "deal",
    rating: 4.7,
    reviewCount: 318,
    price: 4299,
    originalPrice: 4799,
  },
  {
    id: "macbook-air-13-m4",
    brand: "Apple",
    name: "MacBook Air 13\" M4 512GB",
    description: "M4 chip, 18h battery, fanless design.",
    image: laptopImage,
    category: "laptops",
    badge: "new",
    rating: 4.8,
    reviewCount: 655,
    price: 4999,
  },
  {
    id: "galaxy-z-flip6",
    brand: "Samsung",
    name: "Samsung Galaxy Z Flip6 256GB",
    description: "3.4\" FlexWindow, 50MP camera, Galaxy AI.",
    image: samsungImage,
    category: "smartphones",
    badge: "deal",
    rating: 4.5,
    reviewCount: 527,
    price: 3699,
    originalPrice: 3999,
  },
  {
    id: "iphone-16-plus-128",
    brand: "Apple",
    name: "iPhone 16 Plus 128GB",
    description: "6.7\" display, A18 chip, all-day battery life.",
    image: iphoneImage,
    category: "smartphones",
    rating: 4.6,
    reviewCount: 874,
    price: 3599,
  },
]

const BY_ID = new Map(CATALOG.map((product) => [product.id, product]))
// Same length as the home page rails
const RELATED_LIMIT = 10

// Look up catalog products for a curated list; unknown ids are skipped
export function pickProducts(ids: string[]): Product[] {
  return ids.flatMap((id) => BY_ID.get(id) ?? [])
}

function toDetail(entry: CatalogEntry): ProductDetail {
  return {
    ...entry,
    gallery: entry.gallery ?? [{ type: "image", src: entry.image }],
    colors: entry.colors ?? [],
    overview: entry.overview ?? entry.description,
    highlights: entry.highlights ?? [],
    specs: entry.specs ?? [{ label: "Brand", value: entry.brand }],
    warrantyYears: entry.warrantyYears ?? 2,
    inStock: entry.inStock ?? true,
  }
}

export interface ProductPageData {
  product: ProductDetail
  similar: Product[]
  alsoViewed: Product[]
  bundle: Product[]
}

export async function fetchProductPage(id: string): Promise<ProductPageData | null> {
  const entry = BY_ID.get(id)
  if (!entry) return null

  const byRating = (a: Product, b: Product) => b.rating - a.rating
  const others = CATALOG.filter((p) => p.id !== id).sort(byRating)
  // Same category first, topped up with the best-rated products from others
  const similar = [
    ...others.filter((p) => p.category === entry.category),
    ...others.filter((p) => p.category !== entry.category),
  ].slice(0, RELATED_LIMIT)
  // Don't repeat what "Similar products" already shows
  const shown = new Set(similar.map((p) => p.id))
  return {
    product: toDetail(entry),
    similar,
    alsoViewed: others.filter((p) => !shown.has(p.id)).slice(0, RELATED_LIMIT),
    bundle: pickProducts(entry.bundle?.productIds ?? []),
  }
}

export const productPageQueryOptions = (id: string, lang: string) =>
  queryOptions({
    queryKey: ["products", id, lang],
    // lang is in the key so switching language refetches; pass it to the request once the API exists
    queryFn: () => fetchProductPage(id),
  })
