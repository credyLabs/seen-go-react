import { signIn } from "@/api/auth"
import { ApiError } from "@/api/http"
import { useCompleteAuth } from "@/components/auth/use-complete-auth"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useMutation } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import type * as React from "react"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation()
  const completeAuth = useCompleteAuth()
  const search = Route.useSearch()

  const signInMutation = useMutation({
    mutationFn: signIn,
    onSuccess: ({ accessToken, user }) => {
      // name may be empty; fall back to the email's local part for the greeting
      const [firstName = "", ...rest] = (user.name.trim() || user.email.split("@")[0]).split(/\s+/)
      // TODO: keep refreshToken/expiresIn and renew via POST /auth/refresh once token storage is decided
      completeAuth(accessToken, { firstName, lastName: rest.join(" "), email: user.email })
    },
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    signInMutation.mutate({
      username: String(form.get("email")).trim(),
      password: String(form.get("password")),
    })
  }

  const error = signInMutation.error
  const errorMessage = !error
    ? null
    : error instanceof ApiError && error.status === 0
      ? t("auth.errors.network")
      : error instanceof ApiError && (error.status === 400 || error.status === 401)
        ? t("auth.errors.invalidCredentials")
        : t("auth.errors.generic")

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-start gap-1.5">
        <Badge className="rounded-full bg-blue-50 px-3 font-semibold tracking-wide text-blue-700 uppercase dark:bg-blue-500/15 dark:text-blue-300">
          {t("auth.signInEyebrow")}
        </Badge>
        <h1 className="text-2xl font-bold sm:text-3xl tracking-tight text-primary">
          {t("auth.welcomeBack")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.loginSubtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-4">
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

          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor="password">{t("auth.password")}</FieldLabel>
              {/* TODO: point to the forgot-password route once it exists */}
              <a
                href="#"
                className={buttonVariants({
                  variant: "link",
                  size: "xs",
                  className: "px-0",
                })}
              >
                {t("auth.forgotPassword")}
              </a>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder={t("auth.passwordPlaceholder")}
              className="h-9 rounded-lg"
            />
          </Field>

          {errorMessage && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          <Button
            type="submit"
            disabled={signInMutation.isPending}
            className="mt-1 h-9 rounded-full bg-brand-gradient text-white shadow-md hover:opacity-90"
          >
            {signInMutation.isPending && <Loader2 className="animate-spin" />}
            {t(signInMutation.isPending ? "auth.signingIn" : "auth.signInButton")}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <Link
          to="/signup"
          resetScroll={false}
          search={search}
          className="font-semibold text-secondary underline underline-offset-4 dark:text-foreground"
        >
          {t("auth.createOneFree")}
        </Link>
      </p>
    </div>
  )
}
