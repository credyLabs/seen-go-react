// Dummy APIs for features whose backend isn't ready. VITE_MOCK_APIS lists the
// features to fake (comma-separated, e.g. "auth,notifications"); the rest call
// the real services. Mocks keep the spec's request/response shapes so switching
// a feature to the real API needs no changes in the screens.

// auth: sign-in plus the account APIs (/auth/me, /auth/profile, picture)
// notifications: notification preferences
export type MockableApi = "auth" | "notifications"

const mocked = new Set(
  (import.meta.env.VITE_MOCK_APIS ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
)

export function isMocked(api: MockableApi) {
  return mocked.has(api)
}

// Simulated network latency so loading states are visible
export function mockDelay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Small localStorage-backed store so dummy data survives reloads
export function readMockStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`mock:${key}`)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeMockStore<T>(key: string, value: T) {
  try {
    localStorage.setItem(`mock:${key}`, JSON.stringify(value))
  } catch {
    // Storage full or blocked; the dummy data just won't persist
  }
}
