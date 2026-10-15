import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useState, type FormEvent, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

import {
  createAddress,
  updateAddress,
  type Address,
  type AddressInput,
} from "@/api/addresses"
import { ApiError } from "@/api/http"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

// Quick picks for the label; anything else can be typed
const ADDRESS_LABELS = ["Home", "Office", "Family"] as const

// The UAE's seven emirates for the "Emirate" (state) field
const EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
]
const DEFAULT_COUNTRY = "United Arab Emirates"

// Lenient: digits with optional +, spaces and dashes, e.g. "+971 50 123 4567"
const PHONE_PATTERN = /^\+?[\d\s-]{7,20}$/

const INPUT_CLASS = "h-10 rounded-lg bg-card"

type FormState = Record<
  | "label"
  | "fullName"
  | "phoneNumber"
  | "street1"
  | "street2"
  | "city"
  | "state"
  | "postalCode"
  | "country",
  string
> & { isDefault: boolean }

function toForm(address: Address | null, isFirst: boolean): FormState {
  return {
    label: address?.label ?? ADDRESS_LABELS[0],
    fullName: address?.fullName ?? "",
    phoneNumber: address?.phoneNumber ?? "",
    street1: address?.street1 ?? "",
    street2: address?.street2 ?? "",
    city: address?.city ?? "",
    state: address?.state ?? EMIRATES[1],
    postalCode: address?.postalCode ?? "",
    country: address?.country ?? DEFAULT_COUNTRY,
    // A first address becomes the default anyway
    isDefault: address?.isDefault ?? isFirst,
  }
}

// Add / edit an address. `address` null with open adds a new one.
export function AddressFormDialog({
  open,
  address,
  isFirst,
  onOpenChange,
}: {
  open: boolean
  address: Address | null
  // No saved addresses yet, so this one will be the default
  isFirst: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto p-6 sm:max-w-lg">
        <div className="flex flex-col gap-1">
          <DialogTitle className="text-lg font-bold text-primary dark:text-foreground">
            {t(
              address ? "addresses.form.editTitle" : "addresses.form.addTitle"
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t("addresses.form.description")}
          </DialogDescription>
        </div>
        {/* Remount per address so the fields start from it */}
        {open && (
          <AddressForm
            key={address?.id ?? "new"}
            address={address}
            isFirst={isFirst}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function AddressForm({
  address,
  isFirst,
  onDone,
}: {
  address: Address | null
  isFirst: boolean
  onDone: () => void
}) {
  const { t } = useTranslation()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(() => toForm(address, isFirst))
  const [showErrors, setShowErrors] = useState(false)
  const set = (patch: Partial<FormState>) =>
    setForm((current) => ({ ...current, ...patch }))

  const required = t("addresses.form.required")
  const errors: Partial<Record<keyof FormState, string>> = {
    fullName: form.fullName.trim() ? undefined : required,
    phoneNumber: !form.phoneNumber.trim()
      ? required
      : PHONE_PATTERN.test(form.phoneNumber.trim())
        ? undefined
        : t("addresses.form.phoneInvalid"),
    street1: form.street1.trim() ? undefined : required,
    city: form.city.trim() ? undefined : required,
    state: form.state.trim() ? undefined : required,
    postalCode: form.postalCode.trim() ? undefined : required,
    country: form.country.trim() ? undefined : required,
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const errorFor = (field: keyof FormState) =>
    showErrors ? errors[field] : undefined

  const save = useMutation({
    mutationFn: () => {
      const input: AddressInput = {
        label: form.label.trim() || null,
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        street1: form.street1.trim(),
        street2: form.street2.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim(),
        isDefault: form.isDefault,
      }
      return address
        ? updateAddress(token!, address.id, input)
        : createAddress(token!, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["account", "addresses"],
      })
      onDone()
    },
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setShowErrors(true)
    if (!hasErrors) save.mutate()
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="address-label" className="text-xs">
          {t("addresses.form.label")}
        </Label>
        <div className="flex flex-wrap gap-2">
          {ADDRESS_LABELS.map((label) => (
            <button
              key={label}
              type="button"
              aria-pressed={form.label === label}
              onClick={() => set({ label })}
              className={cn(
                "h-8 rounded-full border px-3.5 text-xs font-medium transition-colors",
                form.label === label
                  ? "border-foreground bg-foreground text-background"
                  : "hover:border-foreground/40"
              )}
            >
              {t(`addresses.labels.${label.toLowerCase()}`)}
            </button>
          ))}
        </div>
        <Input
          id="address-label"
          value={form.label}
          maxLength={40}
          placeholder={t("addresses.form.labelPlaceholder")}
          onChange={(event) => set({ label: event.target.value })}
          className={INPUT_CLASS}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="fullName"
          label={t("addresses.form.fullName")}
          error={errorFor("fullName")}
        >
          <Input
            id="fullName"
            autoComplete="name"
            value={form.fullName}
            onChange={(e) => set({ fullName: e.target.value })}
            aria-invalid={!!errorFor("fullName")}
            className={INPUT_CLASS}
          />
        </Field>
        <Field
          id="phoneNumber"
          label={t("addresses.form.phone")}
          error={errorFor("phoneNumber")}
        >
          <Input
            id="phoneNumber"
            type="tel"
            dir="ltr"
            autoComplete="tel"
            placeholder="+971 50 123 4567"
            value={form.phoneNumber}
            onChange={(e) => set({ phoneNumber: e.target.value })}
            aria-invalid={!!errorFor("phoneNumber")}
            className={INPUT_CLASS}
          />
        </Field>
      </div>
      <Field
        id="street1"
        label={t("addresses.form.street1")}
        error={errorFor("street1")}
      >
        <Input
          id="street1"
          autoComplete="address-line1"
          placeholder={t("addresses.form.street1Placeholder")}
          value={form.street1}
          onChange={(e) => set({ street1: e.target.value })}
          aria-invalid={!!errorFor("street1")}
          className={INPUT_CLASS}
        />
      </Field>
      <Field id="street2" label={t("addresses.form.street2")}>
        <Input
          id="street2"
          autoComplete="address-line2"
          placeholder={t("addresses.form.street2Placeholder")}
          value={form.street2}
          onChange={(e) => set({ street2: e.target.value })}
          className={INPUT_CLASS}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="city"
          label={t("addresses.form.city")}
          error={errorFor("city")}
        >
          <Input
            id="city"
            autoComplete="address-level2"
            value={form.city}
            onChange={(e) => set({ city: e.target.value })}
            aria-invalid={!!errorFor("city")}
            className={INPUT_CLASS}
          />
        </Field>
        <Field
          id="state"
          label={t("addresses.form.emirate")}
          error={errorFor("state")}
        >
          <select
            id="state"
            autoComplete="address-level1"
            value={form.state}
            onChange={(e) => set({ state: e.target.value })}
            className="h-10 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* Keep a saved value that isn't one of the emirates */}
            {!EMIRATES.includes(form.state) && form.state && (
              <option value={form.state}>{form.state}</option>
            )}
            {EMIRATES.map((emirate) => (
              <option key={emirate} value={emirate}>
                {emirate}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="postalCode"
          label={t("addresses.form.postalCode")}
          error={errorFor("postalCode")}
        >
          <Input
            id="postalCode"
            dir="ltr"
            autoComplete="postal-code"
            placeholder="00000"
            value={form.postalCode}
            onChange={(e) => set({ postalCode: e.target.value })}
            aria-invalid={!!errorFor("postalCode")}
            className={INPUT_CLASS}
          />
        </Field>
        <Field
          id="country"
          label={t("addresses.form.country")}
          error={errorFor("country")}
        >
          <Input
            id="country"
            autoComplete="country-name"
            value={form.country}
            onChange={(e) => set({ country: e.target.value })}
            aria-invalid={!!errorFor("country")}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={form.isDefault}
          // The default can't be unset here; set another address as default instead
          disabled={isFirst || !!address?.isDefault}
          onChange={(e) => set({ isDefault: e.target.checked })}
          className="size-4 accent-secondary"
        />
        {t("addresses.form.makeDefault")}
      </label>

      {save.isError && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {save.error instanceof ApiError && save.error.status === 409
            ? t("addresses.errors.limit")
            : t("addresses.errors.save")}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <DialogClose
          render={
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full px-6"
            />
          }
        >
          {t("cancel")}
        </DialogClose>
        <Button
          type="submit"
          disabled={save.isPending}
          className="h-10 rounded-full bg-brand-gradient px-6 text-white shadow-md hover:opacity-90"
        >
          {save.isPending && <Loader2 className="animate-spin" />}
          {t(address ? "addresses.form.saveChanges" : "addresses.form.save")}
        </Button>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
