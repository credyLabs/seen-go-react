import { queryOptions } from "@tanstack/react-query"

import { endpoints, withQuery } from "@/api/endpoints"
import { request } from "@/api/http"

// Order-service contracts — FIGMA_FRONTEND_API_SPEC.md §14.6 / API 17.29–17.31

export interface OrderSummary {
  // The deployed list sends it as `orderId`; normalised to `id` (see ordersQueryOptions)
  id: string
  orderNumber: string
  // e.g. OPEN, CONFIRMED, CANCELLED
  status: string
  paymentStatus: string
  // e.g. UNFULFILLED, SHIPPED, DELIVERED
  fulfillmentStatus: string
  grandTotal: number
  createdAt: string
  // The deployed list also includes each order's lines and totals
  items?: OrderItem[]
  itemCount?: number
  subtotal?: number
  discountTotal?: number
  shippingTotal?: number
  currency?: string
}

export interface OrdersPage {
  orders: OrderSummary[]
  page: number
  size: number
  totalPages: number
  totalOrders: number
}

export interface OrderItem {
  // `orderItemId` in the deployed list
  id: string
  // Product details the deployed list adds to each line
  primaryImageUrl?: string | null
  media?: { cdnUrl: string; mediaType: string }[]
  product?: { id: string; slug: string; name: string }
  productAvailable?: boolean
  listingId: string
  variantId: string
  sellerId: string
  nameSnapshot: string
  skuSnapshot: string | null
  unitPrice: number
  quantity: number
  totalPrice: number
  fulfillmentStatus: string
}

// The address the order ships to, copied onto the order when it was placed
export interface OrderAddress {
  addressType: string
  fullName: string
  phoneNumber?: string | null
  street1: string
  street2?: string | null
  city: string
  state: string
  postalCode?: string | null
  country: string
}

export interface OrderDetail extends OrderSummary {
  subtotal: number
  discountTotal: number
  shippingTotal: number
  items: OrderItem[]
  // TODO: confirm the detail's field names against the deployed service (the list uses orderId/orderItemId)
  // SHIPPING (and possibly BILLING); may be empty on legacy orders
  addresses?: OrderAddress[]
}

export interface PlacedOrder {
  message: string
  orderId: string
  orderNumber: string
  grandTotal: number
  status: string
  paymentStatus: string
}

// One line of POST /orders/checkout. Prices and quantities are sent as strings,
// as the API documents.
export interface CheckoutItem {
  variantId: string
  listingId?: string
  sellerId: string
  nameSnapshot: string
  skuSnapshot: string
  unitPrice: string
  quantity: string
  commissionRate?: string
}

// POST /orders/checkout (API 17.45) on VITE_ORDER_API_URL — places an order from
// item snapshots. The address must be a saved addressId; the server looks it up
// (raw address fields aren't accepted). 400 explains what's wrong.
export function checkoutOrder(
  token: string,
  order: { addressId: string; items: CheckoutItem[]; discountTotal?: number; couponId?: string }
) {
  return request<PlacedOrder>(endpoints.orders.checkout, {
    method: "POST",
    token,
    body: {
      addressId: order.addressId,
      discountTotal: order.discountTotal ?? 0,
      ...(order.couponId ? { couponId: order.couponId } : {}),
      items: order.items,
    },
  })
}

export const ORDERS_PAGE_SIZE = 10

// The deployed service names ids `orderId` / `orderItemId` (the spec says id)
type RawOrder = Omit<OrderSummary, "id" | "items"> & {
  id?: string
  orderId?: string
  items?: (Omit<OrderItem, "id"> & { id?: string; orderItemId?: string })[]
}

function normalizeOrder(raw: RawOrder): OrderSummary {
  const { orderId, items, ...rest } = raw
  return {
    ...rest,
    id: raw.id ?? orderId ?? "",
    items: items?.map(({ orderItemId, ...item }) => ({ ...item, id: item.id ?? orderItemId ?? "" })),
  }
}

export const ordersQueryOptions = (token: string | null, page: number) =>
  queryOptions({
    queryKey: ["orders", token, page],
    queryFn: async (): Promise<OrdersPage> => {
      const data = await request<Omit<OrdersPage, "orders"> & { orders: RawOrder[] }>(
        withQuery(endpoints.orders.list, { page, size: ORDERS_PAGE_SIZE }),
        { token }
      )
      return { ...data, orders: data.orders.map(normalizeOrder) }
    },
    enabled: !!token,
  })

// Each card also loads its order's detail, for the delivery address (the list
// has no addresses) and for the lines when the list doesn't include them
export const orderDetailQueryOptions = (token: string | null, orderId: string) =>
  queryOptions({
    queryKey: ["orders", token, "detail", orderId],
    queryFn: async () => normalizeOrder(await request<RawOrder>(endpoints.orders.byId(orderId), { token })) as OrderDetail,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })

// The My Orders tabs. The spec filters them client-side from the status fields.
export type OrderStage = "processing" | "shipped" | "delivered" | "cancelled"

// TODO: confirm the full list of status/fulfillmentStatus values with the backend
const SHIPPED = new Set(["SHIPPED", "PARTIALLY_SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY"])
const DELIVERED = new Set(["DELIVERED", "FULFILLED"])

export function orderStage(order: Pick<OrderSummary, "status" | "fulfillmentStatus">): OrderStage {
  if (order.status === "CANCELLED") return "cancelled"
  if (DELIVERED.has(order.fulfillmentStatus)) return "delivered"
  if (SHIPPED.has(order.fulfillmentStatus)) return "shipped"
  return "processing"
}
