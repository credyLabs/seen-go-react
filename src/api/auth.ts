import { endpoints, withQuery } from "@/api/endpoints"
import { ApiError, request } from "@/api/http"
import { isMocked, mockDelay } from "@/api/mock"
import type { AuthTokens, AuthUser } from "@/lib/auth"

// POST /auth/signin on VITE_AUTH_API_URL — FIGMA_FRONTEND_API_SPEC.md §14.1
export interface SignInRequest {
  username: string
  password: string
}

// The deployed (Cognito-backed) response
export interface SignInResponse {
  accessToken: string
  // JWT whose claims carry the profile: name, email, …
  idToken: string
  refreshToken: string
  // Seconds
  expiresIn: number
  username: string
  // User id
  sub: string
  // Often null; the idToken's email claim is used then
  email: string | null
  roles: string[]
}

export function signIn(credentials: SignInRequest) {
  if (isMocked("auth")) return mockSignIn(credentials)
  return request<SignInResponse>(endpoints.auth.signIn, {
    method: "POST",
    body: credentials,
  })
}

// Reads a JWT's payload. Only for display: the backend verifies tokens, the browser doesn't.
function jwtClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    const json = decodeURIComponent(
      [...atob(payload)].map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return {}
  }
}

const claim = (claims: Record<string, unknown>, key: string) =>
  typeof claims[key] === "string" && claims[key] ? (claims[key] as string) : undefined

// The signed-in user for the header, menus and profile, from the response and its idToken
export function userFromSignIn(response: SignInResponse): AuthUser {
  const claims = jwtClaims(response.idToken)
  const email = response.email ?? claim(claims, "email") ?? response.username
  const name =
    claim(claims, "name") ??
    [claim(claims, "given_name"), claim(claims, "family_name")].filter(Boolean).join(" ") ??
    ""
  // No name: greet by the email's local part
  const [firstName = "", ...rest] = (name.trim() || email.split("@")[0]).split(/\s+/)
  return {
    firstName,
    lastName: rest.join(" "),
    email,
    id: response.sub,
    username: response.username,
    roles: response.roles,
  }
}

export function tokensFromSignIn(response: SignInResponse): Omit<AuthTokens, "accessToken"> {
  return {
    idToken: response.idToken,
    refreshToken: response.refreshToken,
    expiresAt: Date.now() + response.expiresIn * 1000,
  }
}

// Dummy sign-in (VITE_MOCK_APIS=auth): any email and password work, except the
// password "wrong", which returns the spec's 401 so the error state can be tried out
async function mockSignIn({ username, password }: SignInRequest): Promise<SignInResponse> {
  await mockDelay()
  if (!username || !password) throw new ApiError(400, "Username and password are required")
  if (password === "wrong") throw new ApiError(401, "Invalid username or password")

  const localPart = username.split("@")[0]
  // "ahmed.al-rashid" -> "Ahmed Al-rashid"
  const name = localPart
    .split(/[._]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ")
  const base64url = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")
  return {
    accessToken: `mock-access-token.${btoa(username)}`,
    idToken: `${base64url({ alg: "none" })}.${base64url({ name, email: username })}.`,
    refreshToken: "mock-refresh-token",
    expiresIn: 3600,
    username,
    sub: `mock-${localPart}`,
    email: null,
    roles: ["CUSTOMER"],
  }
}

// POST /auth/signup — creates the account; the backend emails a confirmation code
export interface SignUpRequest {
  email: string
  password: string
  name: string
}

export interface SignUpResponse {
  message: string
  // Use this for /auth/confirm and the follow-up sign-in
  username: string
}

export async function signUp(details: SignUpRequest): Promise<SignUpResponse> {
  if (isMocked("auth")) {
    await mockDelay()
    // Same "wrong" convention as dummy sign-in, to try the error state
    if (details.password === "wrong") throw new ApiError(400, "Password does not conform to policy")
    return { message: "User registered successfully. Please check your email for confirmation code.", username: details.email }
  }
  return request<SignUpResponse>(endpoints.auth.signUp, { method: "POST", body: details })
}

// POST /auth/confirm?username=…&code=… — verifies the emailed code
export async function confirmSignUp(username: string, code: string) {
  if (isMocked("auth")) {
    await mockDelay()
    // Dummy: any 6-digit code except 000000 works
    if (!/^\d{6}$/.test(code) || code === "000000") throw new ApiError(400, "Invalid verification code provided")
    return { message: "User confirmed successfully" }
  }
  return request<{ message: string }>(withQuery(endpoints.auth.confirm, { username, code }), { method: "POST" })
}

// Forgot password — FIGMA_FRONTEND_API_SPEC.md §2.4. Dummy while
// VITE_MOCK_APIS includes passwordReset (or auth).
const resetMocked = () => isMocked("passwordReset") || isMocked("auth")

// POST /auth/forgot-password?username=… — emails a reset code
export async function forgotPassword(username: string) {
  if (resetMocked()) {
    await mockDelay()
    if (!username.includes("@")) throw new ApiError(400, "Invalid username")
    return { message: "Password reset code sent to your email" }
  }
  return request<{ message: string }>(withQuery(endpoints.auth.forgotPassword, { username }), { method: "POST" })
}

export interface VerifiedResetCode {
  // Seconds the resetToken stays valid
  expiresIn: number
  resetToken: string
  message: string
}

// POST /auth/verify-reset-code — checks the emailed code and returns the token
// that authorises POST /auth/reset-password
export async function verifyResetCode(username: string, confirmationCode: string) {
  if (resetMocked()) {
    await mockDelay()
    // Dummy: any 6-digit code except 000000 works
    if (!/^\d{6}$/.test(confirmationCode) || confirmationCode === "000000") throw new ApiError(400, "Invalid verification code provided")
    return { expiresIn: 600, resetToken: `mock-reset-${Date.now()}`, message: "Password reset code verified" }
  }
  return request<VerifiedResetCode>(endpoints.auth.verifyResetCode, {
    method: "POST",
    body: { username, confirmationCode },
  })
}

// POST /auth/reset-password — the new password, with the token from verifyResetCode
export async function resetPassword(username: string, resetToken: string, newPassword: string) {
  if (resetMocked()) {
    await mockDelay()
    return { message: "Password reset successfully" }
  }
  return request<{ message: string }>(endpoints.auth.resetPassword, {
    method: "POST",
    body: { username, newPassword, resetToken },
  })
}
