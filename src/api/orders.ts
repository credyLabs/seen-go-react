import { queryOptions } from "@tanstack/react-query"

import { endpoints, withQuery } from "@/api/endpoints"
import { request } from "@/api/http"

// Order-service contracts — FIGMA_FRONTEND_API_SPEC.md §14.6 / API 17.29–17.31

export interface OrderSummary {
  id: string
  orderNumber: string
  // e.g. OPEN, CONFIRMED, CANCELLED
  status: string
  paymentStatus: string
  // e.g. UNFULFILLED, SHIPPED, DELIVERED
  fulfillmentStatus: string
  grandTotal: number
  createdAt: string
}

export interface OrdersPage {
  orders: OrderSummary[]
  page: number
  size: number
  totalPages: number
  totalOrders: number
}

export interface OrderItem {
  id: string
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

export interface OrderDetail extends OrderSummary {
  subtotal: number
  discountTotal: number
  shippingTotal: number
  items: OrderItem[]
}

export const ORDERS_PAGE_SIZE = 10

export const ordersQueryOptions = (token: string | null, page: number) =>
  queryOptions({
    queryKey: ["orders", token, page],
    queryFn: () =>
      request<OrdersPage>(withQuery(endpoints.orders.list, { page, size: ORDERS_PAGE_SIZE }), { token }),
    enabled: !!token,
  })

// The list has no items, so each card loads its order's detail for the product lines
export const orderDetailQueryOptions = (token: string | null, orderId: string) =>
  queryOptions({
    queryKey: ["orders", token, "detail", orderId],
    queryFn: () => request<OrderDetail>(endpoints.orders.byId(orderId), { token }),
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
