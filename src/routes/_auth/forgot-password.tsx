import { useMutation } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { CheckCircle2, Clock, KeyRound, Loader2, MailCheck } from "lucide-react"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { forgotPassword, resetPassword, verifyResetCode } from "@/api/auth"
import { CODE_LENGTH, CodeInput } from "@/components/auth/code-input"
import { PasswordMatch, PasswordStrength } from "@/components/auth/password-feedback"
import { needsNewCode, resetErrorKey } from "@/components/auth/reset-error"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { checkPassword } from "@/lib/password-rules"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_auth/forgot-password")({
  // Prefills the email step with what was typed on the login page, if anything
  validateSearch: (search: Record<string, unknown>): { email?: string } => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  component: ForgotPasswordPage,
})

// Forgot password on VITE_AUTH_API_URL:
//   1. email -> POST /auth/forgot-password?username=…  (emails a code)
//   2. code -> POST /auth/verify-reset-code, which returns a resetToken
//   3. new password + confirm -> POST /auth/reset-password with that resetToken
// A rejected resetToken (e.g. it expired) sends the page back to step 2.

type Step = "email" | "code" | "password" | "done"

// How long the emailed code can be entered for, from when it was sent
const CODE_TTL_SECONDS = 60

const errorKey = resetErrorKey

function ForgotPasswordPage() {
  const { email: prefill = "" } = Route.useSearch()
  const [step, setStep] = React.useState<Step>("email")
  const [email, setEmail] = React.useState(prefill)
  const [code, setCode] = React.useState("")
  // When the current code was sent; starts its expiry timer
  const [sentAt, setSentAt] = React.useState(0)
  const [resetToken, setResetToken] = React.useState("")
  // A rejected resetToken sends the user back to the code step with this message
  const [codeError, setCodeError] = React.useState<string | null>(null)

  if (step === "done") return <ResetDone email={email} />
  if (step === "password")
    return (
      <PasswordStep
        email={email}
        resetToken={resetToken}
        onTokenRejected={(message) => {
          setCode("")
          setCodeError(message)
          setStep("code")
        }}
        onDone={() => setStep("done")}
      />
    )
  if (step === "email")
    return (
      <EmailStep
        email={email}
        onSent={(sentTo) => {
          setEmail(sentTo)
          setCode("")
          setCodeError(null)
          setSentAt(Date.now())
          setStep("code")
        }}
      />
    )
  return (
    <CodeStep
      email={email}
      code={code}
      sentAt={sentAt}
      error={codeError}
      onChange={(value) => {
        setCode(value)
        setCodeError(null)
      }}
      onResent={() => {
        setCode("")
        setCodeError(null)
        setSentAt(Date.now())
      }}
      onVerified={(token) => {
        setResetToken(token)
        setStep("password")
      }}
      onChangeEmail={() => setStep("email")}
    />
  )
}

function StepHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">{icon}</span>
      <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {children}
    </p>
  )
}

// Step 1: the account's email
function EmailStep({ email, onSent }: { email: string; onSent: (email: string) => void }) {
  const { t } = useTranslation()
  const [value, setValue] = React.useState(email)
  const send = useMutation({
    mutationFn: (username: string) => forgotPassword(username),
    onSuccess: (_, username) => onSent(username),
  })

  return (
    <div className="flex flex-col gap-5">
      <StepHeader
        icon={<KeyRound className="size-6 text-brand-copper" />}
        title={t("auth.forgot.title")}
        subtitle={t("auth.forgot.subtitle")}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault()
          send.mutate(value.trim())
        }}
      >
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="email">{t("auth.email")}</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                send.reset()
              }}
              placeholder={t("auth.emailPlaceholder")}
              className="h-9 rounded-lg"
            />
          </Field>
          {send.isError && <ErrorLine>{t(errorKey(send.error))}</ErrorLine>}
          <Button
            type="submit"
            disabled={send.isPending}
            className="h-9 rounded-full bg-brand-gradient text-white shadow-md hover:opacity-90"
          >
            {send.isPending && <Loader2 className="animate-spin" />}
            {t(send.isPending ? "auth.forgot.sending" : "auth.forgot.sendCode")}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}

// Whole seconds left until `deadline` (a timestamp), ticking once a second
function useSecondsLeft(deadline: number) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const timer = window.setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= deadline) window.clearInterval(timer)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [deadline])
  // Capped at the full duration until the first tick after a new deadline
  return Math.max(0, Math.min(CODE_TTL_SECONDS, Math.ceil((deadline - now) / 1000)))
}

// Step 2: the emailed code, accepted for CODE_TTL_SECONDS after it was sent
function CodeStep({
  email,
  code,
  sentAt,
  error,
  onChange,
  onResent,
  onVerified,
  onChangeEmail,
}: {
  email: string
  code: string
  sentAt: number
  error: string | null
  onChange: (code: string) => void
  onResent: () => void
  onVerified: (resetToken: string) => void
  onChangeEmail: () => void
}) {
  const { t } = useTranslation()
  const secondsLeft = useSecondsLeft(sentAt + CODE_TTL_SECONDS * 1000)
  const expired = secondsLeft === 0
  const complete = code.length === CODE_LENGTH

  const verify = useMutation({
    mutationFn: () => verifyResetCode(email, code),
    onSuccess: (response) => onVerified(response.resetToken),
  })
  const resend = useMutation({
    mutationFn: () => forgotPassword(email),
    onSuccess: () => {
      verify.reset()
      onResent()
    },
  })

  const message = expired
    ? t("auth.forgot.expired")
    : verify.isError
      ? t(errorKey(verify.error))
      : resend.isError
        ? t(errorKey(resend.error))
        : error

  return (
    <div className="flex flex-col gap-5">
      <StepHeader
        icon={<MailCheck className="size-6 text-brand-copper" />}
        title={t("auth.confirmTitle")}
        subtitle={
          <>
            {t("auth.forgot.codeSent")} <span className="font-semibold text-foreground">{email}</span>
          </>
        }
      />
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (complete && !expired) verify.mutate()
        }}
      >
        <FieldGroup className="gap-4">
          <Field data-invalid={!!message || undefined}>
            <FieldLabel htmlFor="code">{t("auth.forgot.code")}</FieldLabel>
            <CodeInput
              id="code"
              value={code}
              onChange={(value) => {
                verify.reset()
                onChange(value)
              }}
              invalid={!!message}
            />
            {!expired && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                {t("auth.forgot.expiresIn", {
                  time: `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`,
                })}
              </p>
            )}
            {message && <FieldError className="text-center">{message}</FieldError>}
          </Field>
          <Button
            type="submit"
            disabled={!complete || expired || verify.isPending}
            className="h-9 rounded-full bg-brand-gradient text-white shadow-md hover:opacity-90"
          >
            {verify.isPending && <Loader2 className="animate-spin" />}
            {t(verify.isPending ? "auth.forgot.verifying" : "auth.forgot.continue")}
          </Button>
        </FieldGroup>
      </form>
      <div className="flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          disabled={resend.isPending}
          onClick={() => resend.mutate()}
          className="font-medium text-secondary hover:underline disabled:opacity-60 dark:text-foreground"
        >
          {t(resend.isPending ? "auth.forgot.sending" : resend.isSuccess ? "auth.forgot.resent" : "auth.forgot.resend")}
        </button>
        <button type="button" onClick={onChangeEmail} className="text-muted-foreground hover:text-foreground hover:underline">
          {t("auth.useDifferentEmail")}
        </button>
      </div>
    </div>
  )
}

// Step 3: new password, same rules and feedback as sign-up
function PasswordStep({
  email,
  resetToken,
  onTokenRejected,
  onDone,
}: {
  email: string
  resetToken: string
  onTokenRejected: (message: string) => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  // Set by a submit attempt, so unmet rules and a mismatch show in red only then
  const [submitted, setSubmitted] = React.useState(false)
  const meetsPolicy = checkPassword(password).meetsPolicy
  const passwordMismatch = submitted && password !== confirmPassword

  const reset = useMutation({
    mutationFn: () => resetPassword(email, resetToken, password),
    onSuccess: onDone,
    onError: (error) => {
      // The token (or the code behind it) is no longer accepted: a new code is needed
      if (needsNewCode(error)) onTokenRejected(t(errorKey(error)))
    },
  })

  return (
    <div className="flex flex-col gap-5">
      <StepHeader
        icon={<KeyRound className="size-6 text-brand-copper" />}
        title={t("auth.forgot.newTitle")}
        subtitle={t("auth.forgot.newSubtitle")}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
          if (!meetsPolicy || password !== confirmPassword) return
          reset.mutate()
        }}
      >
        <FieldGroup className="gap-4">
          <Field data-invalid={(submitted && !meetsPolicy) || undefined}>
            <FieldLabel htmlFor="password">{t("auth.forgot.newPassword")}</FieldLabel>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              autoFocus
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
            {confirmPassword ? (
              <PasswordMatch id="confirmPassword-match" password={password} confirm={confirmPassword} />
            ) : (
              passwordMismatch && <FieldError id="confirmPassword-match">{t("auth.passwordMismatch")}</FieldError>
            )}
          </Field>
          {reset.isError && !needsNewCode(reset.error) && (
            <ErrorLine>{t(errorKey(reset.error))}</ErrorLine>
          )}
          <Button
            type="submit"
            disabled={reset.isPending}
            className="h-9 rounded-full bg-brand-gradient text-white shadow-md hover:opacity-90"
          >
            {reset.isPending && <Loader2 className="animate-spin" />}
            {t(reset.isPending ? "auth.forgot.resetting" : "auth.forgot.reset")}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}

function ResetDone({ email }: { email: string }) {
  const { t } = useTranslation()
  const search = Route.useSearch()
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <CheckCircle2 className="size-14 text-success" strokeWidth={1.5} />
      <h1 className="text-2xl font-bold tracking-tight text-primary">{t("auth.forgot.doneTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("auth.forgot.doneBody", { email })}</p>
      <Link
        to="/login"
        search={search}
        className={cn(buttonVariants(), "mt-2 h-9 w-full rounded-full bg-brand-gradient text-white shadow-md hover:opacity-90")}
      >
        {t("auth.forgot.signInNow")}
      </Link>
    </div>
  )
}
