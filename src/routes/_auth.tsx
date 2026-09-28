import loginSignupPanel from "@/assets/login-signup-panel.png"
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useMatchRoute,
} from "@tanstack/react-router"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Lock, ShieldCheck, ShieldHalf } from "lucide-react"
import { useTranslation } from "react-i18next"

interface AuthSearch {
  redirect?: string
}

// Pathless layout for guest-only pages (login, signup) under src/routes/_auth/.
// Logged-in users are sent on to where they were going.
export const Route = createFileRoute("/_auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect || "/dashboard" })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  const { t } = useTranslation()
  const search = Route.useSearch()
  const matchRoute = useMatchRoute()
  const isSignup = !!matchRoute({ to: "/signup" })

  const tabClassName =
    "flex h-7 items-center text-xs sm:h-8 justify-center rounded-full font-medium text-muted-foreground transition-colors hover:text-foreground"
  const activeTabClassName =
    "bg-brand-gradient text-white shadow-sm hover:text-white"

  // Desktop sizes follow the design at 1920px: 1132x606 card, ~51% image column,
  // ~106px above the card, ~50px to the trust row, ~96px below it
  return (
    <div className="site-container py-6 sm:py-10 lg:pt-[106px] lg:pb-24">
      <Card className="mx-auto grid max-w-md gap-0 rounded-none py-0 shadow-lg lg:max-w-[1132px] lg:grid-cols-[51%_minmax(0,1fr)]">
        {/* Image fills the column; overflow is cropped from the bottom/right only, so the logo and
            headline in the top-left always stay visible (e.g. on the taller signup form) */}
        <aside className="relative hidden min-h-[606px] bg-brand-navy lg:block">
          <img
            src={loginSignupPanel}
            alt={t("auth.panelAlt")}
            className="absolute inset-0 size-full object-cover object-left-top"
          />
        </aside>

        <div className="flex min-w-0 flex-col px-5 py-5 sm:px-8 lg:px-10">
          <div className="flex justify-end">
            <Link
              to="/"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "rounded-full text-xs text-secondary hover:text-secondary dark:text-brand-copper dark:hover:text-brand-copper",
              })}
            >
              <ArrowLeft className="size-3.5 rtl:rotate-180" />
              {t("auth.backToSite")}
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center py-6 lg:py-4">
            <div className="flex w-full max-w-sm flex-col gap-5 lg:max-w-xs">
              <nav className="grid grid-cols-2 rounded-full bg-accent p-1">
                <Link
                  to="/login"
                  resetScroll={false}
                  search={search}
                  className={tabClassName}
                  activeProps={{ className: activeTabClassName }}
                >
                  {t("auth.login")}
                </Link>
                <Link
                  to="/signup"
                  resetScroll={false}
                  search={search}
                  className={tabClassName}
                  activeProps={{ className: activeTabClassName }}
                >
                  {t("auth.signUp")}
                </Link>
              </nav>

              <Outlet />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 text-[0.6875rem] text-muted-foreground">
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
              {[
                t("auth.sslEncrypted"),
                t("auth.uaeDataProtected"),
                isSignup ? t("auth.secureRegistration") : t("auth.secureLogin"),
              ].map((label) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-success" />
                  {label}
                </li>
              ))}
            </ul>
            <p className="opacity-70">
              {t("auth.copyright", { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </Card>

      <ul className="mt-6 flex lg:mt-[50px] flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <ShieldCheck className="size-4" />
          {t("auth.secureLogin")}
        </li>
        <li className="flex items-center gap-2">
          <ShieldHalf className="size-4" />
          {t("auth.uaeDataProtection")}
        </li>
        <li className="flex items-center gap-2">
          <Lock className="size-4" />
          {t("auth.encryption")}
        </li>
      </ul>
    </div>
  )
}
