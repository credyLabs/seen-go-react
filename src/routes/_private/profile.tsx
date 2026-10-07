import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Camera, Check, Loader2, RotateCw } from "lucide-react"
import { useRef, useState, type FormEvent, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

import {
  MAX_PICTURE_BYTES,
  changePassword,
  preferencesQueryOptions,
  profileQueryOptions,
  updatePreferences,
  updateProfile,
  uploadProfilePicture,
  type Preferences,
  type Profile,
} from "@/api/account"
import { ApiError } from "@/api/http"
import { ServiceHighlights } from "@/components/home/service-highlights"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_private/profile")({
  component: ProfilePage,
})

// Lenient: digits with optional +, spaces and dashes, e.g. "+971 50 123 4567"
const PHONE_PATTERN = /^\+?[\d\s-]{7,20}$/
const MIN_PASSWORD_LENGTH = 8

const PREFERENCE_KEYS = [
  { key: "emailEnabled", label: "email" },
  { key: "smsEnabled", label: "sms" },
  { key: "pushEnabled", label: "orderUpdates" },
  { key: "promotionsEnabled", label: "promotions" },
] as const

const INPUT_CLASS = "h-10 rounded-lg bg-card"
const SECONDARY_BUTTON =
  "h-9 rounded-full bg-muted px-5 text-xs font-semibold text-foreground hover:bg-accent"

function ProfilePage() {
  const { t } = useTranslation()
  const { token, user } = useAuth()
  const profileQuery = useQuery(profileQueryOptions(token, user))
  const preferencesQuery = useQuery(preferencesQueryOptions(token))
  const failed = profileQuery.isError || preferencesQuery.isError

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/" />}>
                  {t("home")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/dashboard" />}>
                  {t("orders.myAccount")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t("profile.title")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            {t("profile.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("profile.subtitle")}
          </p>
        </div>

        {failed ? (
          <div
            role="alert"
            className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-2xl border bg-card py-16 text-center"
          >
            <h2 className="text-lg font-semibold">{t("profile.loadError")}</h2>
            <Button
              onClick={() => {
                void profileQuery.refetch()
                void preferencesQuery.refetch()
              }}
              className="rounded-full"
            >
              <RotateCw />
              {t("landing.error.retry")}
            </Button>
          </div>
        ) : profileQuery.data && preferencesQuery.data ? (
          <ProfileForm
            profile={profileQuery.data}
            preferences={preferencesQuery.data}
          />
        ) : (
          <div
            role="status"
            aria-label={t("profile.loading")}
            className="mx-auto h-[640px] w-full max-w-2xl animate-pulse rounded-2xl bg-muted"
          />
        )}
      </div>
      <ServiceHighlights />
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t pt-6">
      <h2 className="text-sm font-semibold text-primary">{title}</h2>
      {children}
    </section>
  )
}

function FormField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string | null
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

function splitName(name: string) {
  const [first = "", ...rest] = name.trim().split(/\s+/)
  return { firstName: first, lastName: rest.join(" ") }
}

function ProfileForm({
  profile,
  preferences,
}: {
  profile: Profile
  preferences: Preferences
}) {
  const { t } = useTranslation()
  const { token, user, login } = useAuth()
  const queryClient = useQueryClient()

  const initial = {
    ...splitName(profile.name),
    phoneNumber: profile.phoneNumber,
    preferences: {
      emailEnabled: preferences.emailEnabled,
      smsEnabled: preferences.smsEnabled,
      pushEnabled: preferences.pushEnabled,
      promotionsEnabled: preferences.promotionsEnabled,
    },
  }
  const [form, setForm] = useState(initial)
  const [showErrors, setShowErrors] = useState(false)

  const errors = {
    firstName: form.firstName.trim()
      ? null
      : t("profile.errors.firstNameRequired"),
    phoneNumber:
      !form.phoneNumber.trim() || PHONE_PATTERN.test(form.phoneNumber.trim())
        ? null
        : t("profile.errors.phoneInvalid"),
  }
  const isDirty = JSON.stringify(form) !== JSON.stringify(initial)

  const save = useMutation({
    mutationFn: async () => {
      const name = [form.firstName.trim(), form.lastName.trim()]
        .filter(Boolean)
        .join(" ")
      await Promise.all([
        updateProfile(token!, user, {
          name,
          phoneNumber: form.phoneNumber.trim(),
        }),
        updatePreferences(token!, form.preferences),
      ])
    },
    onSuccess: async () => {
      // Keep the header's name in step with the profile
      login(token!, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: profile.email,
      })
      await queryClient.invalidateQueries({ queryKey: ["account"] })
    },
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setShowErrors(true)
    if (errors.firstName || errors.phoneNumber) return
    save.mutate()
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border bg-card p-5 shadow-xs sm:p-8">
      <PhotoSection profile={profile} />

      {/* Separate forms so Enter in a password field changes the password, not the
          profile; the footer's Save button submits this one via form="profile-form" */}
      <form id="profile-form" onSubmit={submit} noValidate>
        <Section title={t("profile.personalInfo")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="firstName"
              label={t("profile.firstName")}
              error={showErrors ? errors.firstName : null}
            >
              <Input
                id="firstName"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(event) =>
                  setForm({ ...form, firstName: event.target.value })
                }
                aria-invalid={showErrors && !!errors.firstName}
                className={INPUT_CLASS}
              />
            </FormField>
            <FormField id="lastName" label={t("profile.lastName")}>
              <Input
                id="lastName"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(event) =>
                  setForm({ ...form, lastName: event.target.value })
                }
                className={INPUT_CLASS}
              />
            </FormField>
          </div>
          {/* The email is the sign-in username; PUT /auth/profile can't change it */}
          <FormField
            id="email"
            label={t("profile.email")}
            hint={t("profile.emailHint")}
          >
            <Input
              id="email"
              type="email"
              value={profile.email}
              readOnly
              className={cn(INPUT_CLASS, "bg-muted/60 text-muted-foreground")}
            />
          </FormField>
          <FormField
            id="phone"
            label={t("profile.phone")}
            error={showErrors ? errors.phoneNumber : null}
          >
            <Input
              id="phone"
              type="tel"
              dir="ltr"
              autoComplete="tel"
              placeholder="+971 50 123 4567"
              value={form.phoneNumber}
              onChange={(event) =>
                setForm({ ...form, phoneNumber: event.target.value })
              }
              aria-invalid={showErrors && !!errors.phoneNumber}
              className={cn(INPUT_CLASS, "rtl:text-right")}
            />
          </FormField>
        </Section>
      </form>

      <PasswordSection />

      <Section title={t("profile.notifications")}>
        <ul className="flex flex-col gap-4">
          {PREFERENCE_KEYS.map(({ key, label }) => (
            <li key={key} className="flex items-center justify-between gap-4">
              <Label
                htmlFor={`pref-${key}`}
                className="flex flex-col items-start gap-0.5 text-sm font-medium"
              >
                {t(`profile.preferences.${label}.title`)}
                <span className="text-xs font-normal text-muted-foreground">
                  {t(`profile.preferences.${label}.description`)}
                </span>
              </Label>
              <Switch
                id={`pref-${key}`}
                checked={form.preferences[key]}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    preferences: { ...form.preferences, [key]: checked },
                  })
                }
                className="data-checked:bg-secondary"
              />
            </li>
          ))}
        </ul>
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-6">
        {save.isError && (
          <p role="alert" className="me-auto text-xs text-destructive">
            {t("profile.saveError")}
          </p>
        )}
        {save.isSuccess && !isDirty && (
          <p
            role="status"
            className="me-auto flex items-center gap-1 text-xs font-medium text-success"
          >
            <Check className="size-3.5" />
            {t("profile.saved")}
          </p>
        )}
        <Button
          type="button"
          variant="ghost"
          disabled={!isDirty || save.isPending}
          onClick={() => {
            setForm(initial)
            setShowErrors(false)
            save.reset()
          }}
          className="rounded-full"
        >
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          form="profile-form"
          disabled={!isDirty || save.isPending}
          className="h-10 rounded-full bg-secondary px-6 text-secondary-foreground hover:bg-secondary/90"
        >
          {save.isPending && <Loader2 className="animate-spin" />}
          {t("profile.saveChanges")}
        </Button>
      </div>
    </div>
  )
}

function PhotoSection({ profile }: { profile: Profile }) {
  const { t } = useTranslation()
  const { token, user } = useAuth()
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const initials = profile.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")

  const upload = useMutation({
    mutationFn: (file: File) => uploadProfilePicture(token!, user, file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["account", "profile"] }),
    onError: () => setError(t("profile.photoError")),
  })

  const onFile = (file: File | undefined) => {
    setError(null)
    if (!file) return
    if (!file.type.startsWith("image/")) return setError(t("profile.photoType"))
    if (file.size > MAX_PICTURE_BYTES)
      return setError(
        t("profile.photoSize", { size: MAX_PICTURE_BYTES / 1024 / 1024 })
      )
    upload.mutate(file)
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        {profile.profilePictureUrl && (
          <AvatarImage src={profile.profilePictureUrl} alt="" />
        )}
        <AvatarFallback className="bg-brand-navy text-lg font-semibold text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start gap-1.5">
        <p className="text-lg font-semibold text-bidi-plain">
          {profile.name || profile.email}
        </p>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            onFile(event.target.files?.[0])
            // Allow picking the same file again after an error
            event.target.value = ""
          }}
        />
        <Button
          type="button"
          disabled={upload.isPending}
          onClick={() => fileInput.current?.click()}
          className={SECONDARY_BUTTON}
        >
          {upload.isPending ? <Loader2 className="animate-spin" /> : <Camera />}
          {t("profile.changePhoto")}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}

function PasswordSection() {
  const { t } = useTranslation()
  const [fields, setFields] = useState({ current: "", next: "", confirm: "" })
  const [showErrors, setShowErrors] = useState(false)

  const errors = {
    current: fields.current ? null : t("profile.errors.currentRequired"),
    next:
      fields.next.length >= MIN_PASSWORD_LENGTH
        ? null
        : t("profile.errors.passwordLength", { count: MIN_PASSWORD_LENGTH }),
    confirm:
      fields.confirm === fields.next
        ? null
        : t("profile.errors.passwordMismatch"),
  }

  const update = useMutation({
    mutationFn: () => changePassword(fields.current, fields.next),
    onSuccess: () => {
      setFields({ current: "", next: "", confirm: "" })
      setShowErrors(false)
    },
  })

  const updateError =
    update.error instanceof ApiError
      ? update.error.status === 501
        ? t("profile.passwordUnavailable")
        : update.error.status === 400 &&
            update.error.message.includes("incorrect")
          ? t("profile.errors.currentIncorrect")
          : t("profile.passwordError")
      : null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setShowErrors(true)
    if (errors.current || errors.next || errors.confirm) return
    update.mutate()
  }

  const set = (key: keyof typeof fields) => (value: string) => {
    setFields({ ...fields, [key]: value })
    if (update.isSuccess || update.isError) update.reset()
  }

  return (
    <form onSubmit={submit} noValidate>
      <Section title={t("profile.changePassword")}>
        <FormField
          id="currentPassword"
          label={t("profile.currentPassword")}
          error={showErrors ? errors.current : null}
        >
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={fields.current}
            onChange={(event) => set("current")(event.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField
          id="newPassword"
          label={t("profile.newPassword")}
          error={showErrors ? errors.next : null}
        >
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder={t("profile.newPasswordPlaceholder", {
              count: MIN_PASSWORD_LENGTH,
            })}
            value={fields.next}
            onChange={(event) => set("next")(event.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField
          id="confirmPassword"
          label={t("profile.confirmPassword")}
          error={showErrors ? errors.confirm : null}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder={t("profile.confirmPasswordPlaceholder")}
            value={fields.confirm}
            onChange={(event) => set("confirm")(event.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={update.isPending}
            className={SECONDARY_BUTTON}
          >
            {update.isPending && <Loader2 className="animate-spin" />}
            {t("profile.updatePassword")}
          </Button>
          {update.isSuccess && (
            <p
              role="status"
              className="flex items-center gap-1 text-xs font-medium text-success"
            >
              <Check className="size-3.5" />
              {t("profile.passwordUpdated")}
            </p>
          )}
          {updateError && (
            <p role="alert" className="text-xs text-destructive">
              {updateError}
            </p>
          )}
        </div>
      </Section>
    </form>
  )
}
