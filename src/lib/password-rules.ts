// Password rules the auth service (Cognito) enforces on sign-up; checked as
// the user types so the backend's "did not conform with policy" error is rare.

export const PASSWORD_RULES = [
  { key: "length", test: (p: string) => p.length >= 8 },
  { key: "upper", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lower", test: (p: string) => /[a-z]/.test(p) },
  { key: "number", test: (p: string) => /\d/.test(p) },
  { key: "symbol", test: (p: string) => /[^A-Za-z0-9\s]/.test(p) },
] as const

export type PasswordRule = (typeof PASSWORD_RULES)[number]["key"]
export type PasswordStrength = "weak" | "fair" | "strong"

export function checkPassword(password: string) {
  const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).map((rule) => rule.key)
  const score = passed.length
  const strength: PasswordStrength = score === PASSWORD_RULES.length ? "strong" : score >= 3 ? "fair" : "weak"
  return {
    passed: new Set<PasswordRule>(passed),
    // Bars filled: weak 1, fair 2, strong 3
    level: strength === "strong" ? 3 : strength === "fair" ? 2 : 1,
    strength,
    meetsPolicy: score === PASSWORD_RULES.length,
  }
}
