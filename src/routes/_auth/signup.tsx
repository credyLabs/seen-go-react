import { SocialAuthButtons } from "@/components/auth/social-auth-buttons"
import { useCompleteAuth } from "@/components/auth/use-complete-auth"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Link, createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute("/_auth/signup")({
  component: SignupPage,
})

function SignupPage() {
  const { t } = useTranslation()
  const completeAuth = useCompleteAuth()
  const search = Route.useSearch()
  const [passwordMismatch, setPasswordMismatch] = React.useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (form.get("password") !== form.get("confirmPassword")) {
      setPasswordMismatch(true)
      return
    }
    // TODO: replace with a real API call that returns the token and user
    completeAuth("demo-token", {
      firstName: String(form.get("firstName")),
      lastName: String(form.get("lastName")),
      email: String(form.get("email")),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold sm:text-3xl tracking-tight text-primary">
          {t("auth.createAccountTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.signupSubtitle")}
        </p>
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

          <Field>
            <FieldLabel htmlFor="password">{t("auth.password")}</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder={t("auth.createPasswordPlaceholder")}
              className="h-9 rounded-lg"
              onChange={() => setPasswordMismatch(false)}
            />
          </Field>

          <Field data-invalid={passwordMismatch || undefined}>
            <FieldLabel htmlFor="confirmPassword">
              {t("auth.confirmPassword")}
            </FieldLabel>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder={t("auth.confirmPasswordPlaceholder")}
              className="h-9 rounded-lg"
              aria-invalid={passwordMismatch || undefined}
              aria-describedby={
                passwordMismatch ? "confirmPassword-error" : undefined
              }
              onChange={() => setPasswordMismatch(false)}
            />
            {passwordMismatch && (
              <FieldError id="confirmPassword-error">
                {t("auth.passwordMismatch")}
              </FieldError>
            )}
          </Field>

          <Button
            type="submit"
            className="mt-1 h-9 rounded-full bg-brand-gradient text-white shadow-md hover:opacity-90"
          >
            {t("auth.createAccountButton")}
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
