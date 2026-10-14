import { HeartOff, ImageOff, Loader2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth"
import { formatPrice } from "@/lib/format"
import { useWishlistStore, type WishlistEntry } from "@/stores/wishlist-store"

// "Remove from Wishlist?" — confirming calls DELETE /wishlist/items/{productId}.
// Closes once the API agrees; if it fails, the item stays and an error shows.
export function RemoveFromWishlistDialog({
  item,
  onOpenChange,
}: {
  // The item being removed; null keeps the dialog closed
  item: WishlistEntry | null
  onOpenChange: (open: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const remove = useWishlistStore((state) => state.remove)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const close = (open: boolean) => {
    if (pending) return
    if (!open) setFailed(false)
    onOpenChange(open)
  }

  const confirm = async () => {
    if (!item || !token) return
    setPending(true)
    setFailed(false)
    const ok = await remove(token, item.productId)
    setPending(false)
    if (ok) onOpenChange(false)
    else setFailed(true)
  }

  return (
    <Dialog open={!!item} onOpenChange={close}>
      {/* minmax(0,1fr) lets the long product name truncate instead of widening the dialog */}
      <DialogContent showCloseButton={false} className="grid-cols-[minmax(0,1fr)] gap-5 p-6 text-center sm:max-w-sm">
        {item && (
          <>
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <HeartOff className="size-5 text-destructive" />
            </span>
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="text-lg font-bold text-primary dark:text-foreground">
                {t("wishlist.removeDialog.title")}
              </DialogTitle>
              <DialogDescription className="text-xs">{t("wishlist.removeDialog.body")}</DialogDescription>
            </div>

            {!item.unavailable && (
              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3 text-start">
                <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card">
                  {item.image ? (
                    <img src={item.image} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageOff className="size-5 text-muted-foreground" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-bidi-plain truncate text-sm font-semibold">{item.name}</p>
                  {item.price != null && (
                    <p className="text-xs text-muted-foreground">{formatPrice(item.price, i18n.language)}</p>
                  )}
                </div>
              </div>
            )}

            {failed && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {t("wishlist.removeDialog.error")}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button
                disabled={pending}
                onClick={() => void confirm()}
                className="h-10 rounded-full bg-destructive text-white hover:bg-destructive/90"
              >
                {pending && <Loader2 className="animate-spin" />}
                {t("wishlist.removeDialog.confirm")}
              </Button>
              <DialogClose
                disabled={pending}
                render={<Button variant="link" className="text-xs text-muted-foreground" />}
              >
                {t("cancel")}
              </DialogClose>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
