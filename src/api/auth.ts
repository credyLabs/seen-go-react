import { endpoints } from "@/api/endpoints"
import { ApiError, request } from "@/api/http"
import { isMocked, mockDelay } from "@/api/mock"

// POST /auth/signin — FIGMA_FRONTEND_API_SPEC.md §14.1
export interface SignInRequest {
  username: string
  password: string
}

export interface SignInResponse {
  accessToken: string
  refreshToken: string
  // Seconds
  expiresIn: number
  tokenType: string
  user: {
    id: string
    username: string
    email: string
    // May be an empty string
    name: string
    roles: string[]
  }
}

export function signIn(credentials: SignInRequest) {
  if (isMocked("auth")) return mockSignIn(credentials)
  return request<SignInResponse>(endpoints.auth.signIn, {
    method: "POST",
    body: credentials,
  })
}

// Dummy sign-in: any email and password work, except the password "wrong",
// which returns the spec's 401 so the error state can be tried out
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
  return {
    accessToken: `mock-access-token.${btoa(username)}`,
    refreshToken: "mock-refresh-token",
    expiresIn: 3600,
    tokenType: "Bearer",
    user: { id: `mock-${localPart}`, username, email: username, name, roles: ["CUSTOMER"] },
  }
}
