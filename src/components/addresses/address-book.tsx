import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, Loader2, MapPin, Pencil, Phone, Plus, Trash2 } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { addressesQueryOptions, deleteAddress, setDefaultAddress, type Address } from "@/api/addresses"
import { AddressFormDialog } from "@/components/addresses/address-form-dialog"
import { BrandError, BrandLoader } from "@/components/brand/brand-status"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

// The signed-in user's saved addresses (GET /users/me/addresses) with add
// (POST), edit (PUT), delete (DELETE) and set-default (PATCH …/default).
// Used on Saved Addresses, My Orders and checkout; with `selectable` each card
// can be picked (checkout's delivery address).

// Label pill colours from the design; any other label is grey
const LABEL_CLASS: Record<string, string> = {
  home: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  office: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  work: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  family: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
}
const PILL = "rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase"

export function AddressBook({
  header,
  selectable = false,
  selectedId,
  onSelect,
  className,
}: {
  // Shown on the start side of the toolbar, next to "Add New Address"
  header?: ReactNode
  selectable?: boolean
  selectedId?: string | null
  onSelect?: (address: Address) => void
  className?: string
}) {
  const { t } = useTranslation()
  const { token } = useAuth()
  const addresses = useQuery(addressesQueryOptions(token))
  // null = closed; "new" = adding; an address = editing it
  const [editing, setEditing] = useState<Address | "new" | null>(null)
  const [deleting, setDeleting] = useState<Address | null>(null)
  const list = addresses.data ?? []

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        {header ?? <span />}
        {addresses.isSuccess && (
          <Button
            onClick={() => setEditing("new")}
            className="h-10 rounded-full bg-secondary px-5 text-secondary-foreground hover:bg-secondary/90"
          >
            <Plus />
            {t("addresses.add")}
          </Button>
        )}
      </div>

      {addresses.isError ? (
        <BrandError
          title={t("addresses.errors.load")}
          body={t("landing.error.body")}
          onRetry={() => void addresses.refetch()}
          retrying={addresses.isFetching}
          className="rounded-2xl border bg-card"
        />
      ) : addresses.isPending ? (
        <BrandLoader label={t("addresses.loading")} className="rounded-2xl border bg-card py-16" />
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-5 py-14 text-center shadow-xs">
          <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-muted">
            <MapPin className="size-7 text-brand-copper" strokeWidth={1.5} />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-primary dark:text-foreground">{t("addresses.emptyTitle")}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{t("addresses.emptyBody")}</p>
        </div>
      ) : (
        <ul
          role={selectable ? "radiogroup" : undefined}
          aria-label={selectable ? t("checkout.deliverTo") : undefined}
          className="grid gap-4 md:grid-cols-2"
        >
          {list.map((address) => (
            <li key={address.id}>
              <AddressCard
                address={address}
                selectable={selectable}
                selected={selectedId === address.id}
                onSelect={() => onSelect?.(address)}
                onEdit={() => setEditing(address)}
                onDelete={() => setDeleting(address)}
              />
            </li>
          ))}
        </ul>
      )}

      <AddressFormDialog
        open={editing !== null}
        address={editing === "new" ? null : editing}
        isFirst={list.length === 0}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <DeleteAddressDialog address={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </div>
  )
}

function AddressCard({
  address,
  selectable,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  address: Address
  selectable: boolean
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const makeDefault = useMutation({
    mutationFn: () => setDefaultAddress(token!, address.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["account", "addresses"] }),
  })
  const labelKey = address.label?.trim().toLowerCase() ?? ""
  // Known labels are translated; custom ones are shown as typed
  const labelText = LABEL_CLASS[labelKey] ? t(`addresses.labels.${labelKey}`) : address.label

  return (
    <article
      onClick={selectable ? onSelect : undefined}
      className={cn(
        "relative flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-xs transition-colors",
        selectable && "cursor-pointer hover:border-secondary/50",
        selected && "border-secondary ring-2 ring-secondary/30"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {selectable && (
            // The whole card picks it (onClick below); this radio carries the state for keyboards and screen readers
            <input
              type="radio"
              name="delivery-address"
              checked={selected}
              onChange={onSelect}
              aria-label={[address.label, address.fullName, address.street1].filter(Boolean).join(", ")}
              className="me-1 size-4 accent-secondary"
            />
          )}
          {labelText && (
            <span className={cn(PILL, LABEL_CLASS[labelKey] ?? "bg-muted text-muted-foreground")}>{labelText}</span>
          )}
          {address.isDefault && <span className={cn(PILL, "bg-success/15 text-success")}>{t("addresses.default")}</span>}
        </div>
        {address.isDefault ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-success">
            <Check className="size-3.5" />
            {t("addresses.primary")}
          </span>
        ) : (
          <button
            type="button"
            disabled={makeDefault.isPending}
            onClick={() => makeDefault.mutate()}
            className="relative z-10 flex items-center gap-1 text-xs font-medium text-brand-copper underline underline-offset-4 hover:text-secondary disabled:opacity-60"
          >
            {makeDefault.isPending && <Loader2 className="size-3 animate-spin" />}
            {t("addresses.setDefault")}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-0.5 text-sm">
        <h2 className="text-bidi-plain font-semibold text-primary rtl:text-right dark:text-foreground">{address.fullName}</h2>
        <address className="text-bidi-plain flex flex-col text-xs leading-relaxed text-muted-foreground not-italic rtl:text-right">
          <span>{address.street1}</span>
          <span>{[address.street2, address.city].filter(Boolean).join(", ")}</span>
          {/* As in the design: no postal code (UAE addresses mostly use "00000") */}
          <span>
            {[address.state !== address.city ? address.state : null, address.country].filter(Boolean).join(", ")}
          </span>
        </address>
      </div>
      <p className="flex items-center gap-2 text-xs">
        <Phone className="size-3.5 text-muted-foreground" />
        <span dir="ltr">{address.phoneNumber}</span>
      </p>
      {makeDefault.isError && (
        <p role="alert" className="text-xs text-destructive">
          {t("addresses.errors.setDefault")}
        </p>
      )}

      <div className="relative z-10 mt-auto flex items-center gap-4 border-t pt-3 text-xs">
        <button type="button" onClick={onEdit} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <Pencil className="size-3.5" />
          {t("addresses.edit")}
        </button>
        {/* The API won't delete the default address; set another one as default first */}
        {!address.isDefault && (
          <button type="button" onClick={onDelete} className="flex items-center gap-1.5 font-medium text-destructive hover:underline">
            <Trash2 className="size-3.5" />
            {t("addresses.delete")}
          </button>
        )}
      </div>
    </article>
  )
}

function DeleteAddressDialog({ address, onOpenChange }: { address: Address | null; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: (id: string) => deleteAddress(token!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["account", "addresses"] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog
      open={!!address}
      onOpenChange={(open) => {
        if (!open) remove.reset()
        onOpenChange(open)
      }}
    >
      <DialogContent showCloseButton={false} className="grid-cols-[minmax(0,1fr)] gap-5 p-6 text-center sm:max-w-sm">
        {address && (
          <>
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-5 text-destructive" />
            </span>
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="text-lg font-bold text-primary dark:text-foreground">{t("addresses.deleteDialog.title")}</DialogTitle>
              <DialogDescription className="text-xs">
                {t("addresses.deleteDialog.body", { name: address.label ?? address.street1 })}
              </DialogDescription>
            </div>
            {remove.isError && (
              <p role="alert" className="text-xs text-destructive">
                {t("addresses.errors.delete")}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button
                disabled={remove.isPending}
                onClick={() => remove.mutate(address.id)}
                className="h-10 rounded-full bg-destructive text-white hover:bg-destructive/90"
              >
                {remove.isPending && <Loader2 className="animate-spin" />}
                {t("addresses.deleteDialog.confirm")}
              </Button>
              <DialogClose render={<Button variant="link" className="text-xs text-muted-foreground" />}>{t("cancel")}</DialogClose>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
