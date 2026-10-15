import { Check, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { PASSWORD_RULES, checkPassword } from "@/lib/password-rules"
import { cn } from "@/lib/utils"

const STRENGTH_STYLE = {
  weak: { bar: "bg-destructive", text: "text-destructive" },
  fair: { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  strong: { bar: "bg-success", text: "text-success" },
} as const

// Strength meter plus the rule chips under "Password", shown once something is
// typed. `highlight` marks unmet rules in red (after a submit attempt).
export function PasswordStrength({ id, password, highlight = false }: { id: string; password: string; highlight?: boolean }) {
  const { t } = useTranslation()
  const { passed, level, strength } = checkPassword(password)
  const style = STRENGTH_STYLE[strength]
  const missing = PASSWORD_RULES.filter((rule) => !passed.has(rule.key))
  // Nothing until the user starts typing
  if (!password) return null

  return (
    <div id={id} className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div aria-hidden className="grid flex-1 grid-cols-3 gap-1">
          {[1, 2, 3].map((bar) => (
            <span
              key={bar}
              className={cn("h-1.5 rounded-full transition-colors duration-300", bar <= level ? style.bar : "bg-foreground/15")}
            />
          ))}
        </div>
        {/* Announced as it changes */}
        <span aria-live="polite" className={cn("min-w-14 text-end text-xs font-semibold", style.text)}>
          {t(`auth.passwordStrength.${strength}`)}
        </span>
      </div>
      {/* Only the rules still to meet; each chip disappears once its rule is met */}
      {missing.length > 0 && (
        <ul className="flex flex-wrap gap-1 text-[11px] font-medium">
          {missing.map(({ key }) => (
            <li
              key={key}
              className={cn(
                "flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 transition-colors",
                highlight
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-border text-muted-foreground"
              )}
            >
              {highlight && <X className="size-2.5 shrink-0" />}
              {/* Short label on screen; the full rule for screen readers */}
              <span aria-hidden>{t(`auth.passwordRules.${key}`)}</span>
              <span className="sr-only">
                {t(`auth.passwordRulesFull.${key}`)} {t("auth.passwordRuleUnmet")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Live "Passwords match / do not match" under "Confirm Password", once something is typed
export function PasswordMatch({ id, password, confirm }: { id: string; password: string; confirm: string }) {
  const { t } = useTranslation()
  if (!confirm) return null
  const matches = password === confirm
  return (
    <p
      id={id}
      aria-live="polite"
      className={cn("flex items-center gap-1.5 text-xs font-medium", matches ? "text-success" : "text-destructive")}
    >
      {matches ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      {t(matches ? "auth.passwordsMatch" : "auth.passwordMismatch")}
    </p>
  )
}
