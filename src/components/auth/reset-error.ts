import { ApiError } from "@/api/http"

// Translation key for a forgot / reset password failure (Cognito's messages,
// passed through by the backend)
export function resetErrorKey(error: unknown) {
  if (!(error instanceof ApiError)) return "auth.errors.generic"
  if (error.status === 0) return "auth.errors.network"
  // Checked before "code" and "password": e.g. "Invalid or expired reset token"
  if (/token|expired/i.test(error.message)) return "auth.errors.resetExpired"
  if (/code/i.test(error.message)) return "auth.errors.invalidCode"
  if (/password|policy/i.test(error.message)) return "auth.errors.passwordPolicy"
  if (/user|username|exist|found/i.test(error.message)) return "auth.errors.unknownEmail"
  return "auth.errors.generic"
}

// The reset token, or the code behind it, is no longer accepted: start again from a new code
export function needsNewCode(error: unknown) {
  const key = resetErrorKey(error)
  return key === "auth.errors.resetExpired" || key === "auth.errors.invalidCode"
}
