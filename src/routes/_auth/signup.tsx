import { useMutation } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Loader2, MailCheck } from "lucide-react"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { confirmSignUp, signIn, signUp, tokensFromSignIn, userFromSignIn } from "@/api/auth"
import { ApiError } from "@/api/http"
import { PasswordMatch, PasswordStrength } from "@/components/auth/password-feedback"
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons"
import { useCompleteAuth } from "@/components/auth/use-complete-auth"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { checkPassword } from "@/lib/password-rules"

export const Route = createFileRoute("/_auth/signup")({
  component: SignupPage,
})

// Two steps on VITE_AUTH_API_URL: POST /auth/signup with the details, then
// POST /auth/confirm with the code the backend emails. Once confirmed the
// account is signed in with the same password (POST /auth/signin).
interface PendingAccount {
  username: string
  // Kept in memory only, for the sign-in right after confirming
  password: string
}

function errorKey(error: unknown) {
  if (!(error instanceof ApiError)) return "auth.errors.generic"
  if (error.status === 0) return "auth.errors.network"
  // Cognito's messages, passed through by the backend as {"error": "..."}
  if (/exist/i.test(error.message)) return "auth.errors.emailTaken"
  if (/password|policy/i.test(error.message)) return "auth.errors.passwordPolicy"
  if (/code/i.test(error.message)) return "auth.errors.invalidCode"
  return "auth.errors.generic"
}

function SignupPage() {
  const [pending, setPending] = React.useState<PendingAccount | null>(null)
  return pending ? (
    <ConfirmStep account={pending} onBack={() => setPending(null)} />
  ) : (
    <DetailsStep onRegistered={setPending} />
  )
}

function DetailsStep({ onRegistered }: { onRegistered: (account: PendingAccount) => void }) {
  const { t } = useTranslation()
  const search = Route.useSearch()
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  // Set by a submit attempt, so unmet rules and a mismatch show in red only then
  const [submitted, setSubmitted] = React.useState(false)
  const meetsPolicy = checkPassword(password).meetsPolicy
  const passwordMismatch = submitted && password !== confirmPassword

  const register = useMutation({
    mutationFn: signUp,
    onSuccess: (response, details) => onRegistered({ username: response.username, password: details.password }),
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitted(true)
    if (!meetsPolicy || password !== confirmPassword) return
    register.mutate({
      email: String(form.get("email")).trim(),
      password,
      name: [form.get("firstName"), form.get("lastName")].map((part) => String(part ?? "").trim()).filter(Boolean).join(" "),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">{t("auth.createAccountTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("auth.signupSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="firstName">{t("auth.firstName")}</FieldLabel>
              <Input
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                required
                placeholder={t("auth.firstNamePlaceholder")}
                className="h-9 rounded-lg"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName">{t("auth.lastName")}</FieldLabel>
              <Input
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                required
                placeholder={t("auth.lastNamePlaceholder")}
                className="h-9 rounded-lg"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="email">{t("auth.email")}</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t("auth.emailPlaceholder")}
              className="h-9 rounded-lg"
            />
          </Field>

          <Field data-invalid={(submitted && !meetsPolicy) || undefined}>
            <FieldLabel htmlFor="password">{t("auth.password")}</FieldLabel>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              placeholder={t("auth.createPasswordPlaceholder")}
              className="h-9 rounded-lg"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={(submitted && !meetsPolicy) || undefined}
              aria-describedby="password-strength"
            />
            <PasswordStrength id="password-strength" password={password} highlight={submitted && !meetsPolicy} />
          </Field>

          <Field data-invalid={passwordMismatch || undefined}>
            <FieldLabel htmlFor="confirmPassword">{t("auth.confirmPassword")}</FieldLabel>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              placeholder={t("auth.confirmPasswordPlaceholder")}
              className="h-9 rounded-lg"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              aria-invalid={passwordMismatch || undefined}
              aria-describedby="confirmPassword-match"
            />
            {/* Live while typing; after a submit an empty confirmation is flagged too */}
            {confirmPassword ? (
              <PasswordMatch id="confirmPassword-match" password={password} confirm={confirmPassword} />
            ) : (
              passwordMismatch && <FieldError id="confirmPassword-match">{t("auth.passwordMismatch")}</FieldError>
            )}
          </Field>

          {register.isError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t(errorKey(register.error))}
            </p>
          )}

          <Button
            type="submit"
            disabled={register.isPending}
            className="mt-1 h-9 rounded-full bg-brand-gradient text-white shadow-md hover:opacity-90"
          >
            {register.isPending && <Loader2 className="animate-spin" />}
            {t(register.isPending ? "auth.creatingAccount" : "auth.createAccountButton")}
          </Button>
        </FieldGroup>
      </form>

      <SocialAuthButtons dividerLabel={t("auth.orSignUpWith")} />

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.haveAccount")}{" "}
        <Link
          to="/login"
          resetScroll={false}
          search={search}
          className="font-semibold text-secondary hover:underline dark:text-foreground"
        >
          {t("auth.signIn")}
        </Link>
      </p>
    </div>
  )
}

function ConfirmStep({ account, onBack }: { account: PendingAccount; onBack: () => void }) {
  const { t } = useTranslation()
  const search = Route.useSearch()
  const completeAuth = useCompleteAuth()
  const [code, setCode] = React.useState("")
  // Set once /auth/confirm succeeds, so a retry only repeats the sign-in
  const [confirmed, setConfirmed] = React.useState(false)

  const confirm = useMutation({
    mutationFn: async () => {
      if (!confirmed) {
        await confirmSignUp(account.username, code.trim())
        setConfirmed(true)
      }
      return signIn({ username: account.username, password: account.password })
    },
    onSuccess: (response) => completeAuth(response.accessToken, userFromSignIn(response), tokensFromSignIn(response)),
  })
  // Confirmed but the automatic sign-in failed: offer the login page instead
  const confirmedOnly = confirm.isError && confirmed

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <MailCheck className="size-6 text-brand-copper" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">{t("auth.confirmTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.confirmSubtitle")} <span className="font-semibold text-foreground">{account.username}</span>
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          confirm.mutate()
        }}
      >
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="code">{t("auth.confirmCode")}</FieldLabel>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              autoFocus
              maxLength={10}
              dir="ltr"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\s/g, ""))}
              placeholder="483921"
              className="h-11 rounded-lg text-center text-lg tracking-[0.4em]"
            />
          </Field>

          {confirm.isError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {confirmedOnly ? t("auth.errors.confirmedSignIn") : t(errorKey(confirm.error))}
            </p>
          )}

          <Button
            type="submit"
            disabled={confirm.isPending || !code.trim()}
            className="h-9 rounded-full bg-brand-gradient text-white shadow-md hover:opacity-90"
          >
            {confirm.isPending && <Loader2 className="animate-spin" />}
            {t(confirm.isPending ? "auth.confirming" : "auth.confirmButton")}
          </Button>
        </FieldGroup>
      </form>

      <div className="flex flex-col items-center gap-2 text-sm">
        {confirmedOnly && (
          <Link to="/login" search={search} className="font-semibold text-secondary hover:underline dark:text-foreground">
            {t("auth.signIn")}
          </Link>
        )}
        <button type="button" onClick={onBack} className="text-muted-foreground hover:text-foreground hover:underline">
          {t("auth.useDifferentEmail")}
        </button>
      </div>
    </div>
  )
}
