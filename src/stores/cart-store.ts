import { create } from "zustand"
import { persist } from "zustand/middleware"

// Client-side cart until the cart API is wired in (GET/POST/PATCH/DELETE /cart…).
// Saved to localStorage so it survives reloads; cleared on sign-out.

export interface CartLine {
  // productId + variant, so two colours of one product are separate lines
  lineId: string
  // Identifies the product; with variant it forms the line id
  productId: string
  // Product page to link to; missing when unknown (e.g. re-added from an order)
  slug?: string
  name: string
  brand?: string
  image: string | null
  // e.g. the colour picked on the product page
  variant?: string
  price: number
  originalPrice?: number
  quantity: number
}

export type NewCartLine = Omit<CartLine, "lineId" | "quantity">

export const MAX_LINE_QUANTITY = 10

interface CartState {
  lines: CartLine[]
  addItem: (item: NewCartLine, quantity?: number) => void
  setQuantity: (lineId: string, quantity: number) => void
  removeItem: (lineId: string) => void
  clear: () => void
}

const lineIdFor = (item: Pick<CartLine, "productId" | "variant">) =>
  `${item.productId}:${item.variant ?? ""}`

const clampQuantity = (quantity: number) => Math.min(Math.max(quantity, 1), MAX_LINE_QUANTITY)

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      // Adding something already in the cart increases its quantity
      addItem: (item, quantity = 1) =>
        set((state) => {
          const lineId = lineIdFor(item)
          const existing = state.lines.find((line) => line.lineId === lineId)
          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line.lineId === lineId
                  ? { ...line, ...item, quantity: clampQuantity(line.quantity + quantity) }
                  : line
              ),
            }
          }
          return { lines: [...state.lines, { ...item, lineId, quantity: clampQuantity(quantity) }] }
        }),
      setQuantity: (lineId, quantity) =>
        set((state) => ({
          lines: state.lines.map((line) =>
            line.lineId === lineId ? { ...line, quantity: clampQuantity(quantity) } : line
          ),
        })),
      removeItem: (lineId) =>
        set((state) => ({ lines: state.lines.filter((line) => line.lineId !== lineId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "seengo-cart" }
  )
)

// Number of units, for the header badge
export const selectCartCount = (state: CartState) =>
  state.lines.reduce((sum, line) => sum + line.quantity, 0)

// UAE VAT, added on top of item prices at checkout
export const VAT_RATE = 0.05

export function cartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, line) => sum + (line.originalPrice ?? line.price) * line.quantity, 0)
  const afterDiscount = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const vat = Math.round(afterDiscount * VAT_RATE * 100) / 100
  return { subtotal, discount: subtotal - afterDiscount, vat, total: afterDiscount + vat }
}
