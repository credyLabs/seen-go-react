import { Heart, ImageOff } from "lucide-react"
import { useTranslation } from "react-i18next"

import { canMoveToWishlist, useMoveToWishlist } from "@/components/cart/move-to-wishlist"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useCartStore, type CartLine } from "@/stores/cart-store"

export function RemoveFromCartDialog({
  line,
  onOpenChange,
}: {
  // The line being removed; null keeps the dialog closed
  line: CartLine | null
  onOpenChange: (open: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  const removeItem = useCartStore((state) => state.removeItem)
  const moveToWishlist = useMoveToWishlist()
  const close = () => onOpenChange(false)

  return (
    <Dialog open={!!line} onOpenChange={onOpenChange}>
      {/* minmax(0,1fr) lets the long product name truncate instead of widening the dialog */}
      <DialogContent showCloseButton={false} className="grid-cols-[minmax(0,1fr)] gap-5 p-6 text-center sm:max-w-sm">
        {line && (
          <>
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <Heart className="size-5 text-brand-copper" />
            </span>
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="text-lg font-bold text-primary">{t("cart.removeDialog.title")}</DialogTitle>
              <DialogDescription className="text-xs">
                {t(canMoveToWishlist(line) ? "cart.removeDialog.body" : "cart.removeDialog.bodyNoWishlist")}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3 text-start">
              <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card">
                {line.image ? (
                  <img src={line.image} alt="" className="size-full object-cover" />
                ) : (
                  <ImageOff className="size-5 text-muted-foreground" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-bidi-plain truncate text-sm font-semibold">{line.name}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(line.price, i18n.language)}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {canMoveToWishlist(line) && (
                <Button
                  onClick={() => {
                    moveToWishlist(line)
                    close()
                  }}
                  className="h-10 rounded-full bg-brand-gradient text-white shadow-md hover:opacity-90"
                >
                  {t("cart.removeDialog.moveToWishlist")}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  removeItem(line.lineId)
                  close()
                }}
                className={cn("h-10 rounded-full bg-card font-semibold text-destructive hover:text-destructive")}
              >
                {t("cart.removeDialog.remove")}
              </Button>
              <DialogClose render={<Button variant="link" className="text-xs text-muted-foreground" />}>
                {t("cancel")}
              </DialogClose>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
