import * as React from "react"

// The signed-in session lives in sessionStorage: it survives reloads but ends
// when the tab is closed, and is dropped once the access token expires.
const SESSION_KEY = "auth-session"
// Older builds kept the token in localStorage; cleared on load
const LEGACY_KEYS = ["auth-token", "auth-user"]

export interface AuthUser {
  firstName: string
  lastName: string
  email: string
  // Cognito subject (user id), username and roles from POST /auth/signin
  id?: string
  username?: string
  roles?: string[]
}

export interface AuthTokens {
  accessToken: string
  idToken?: string
  refreshToken?: string
  // Epoch milliseconds when the access token stops working
  expiresAt?: number
}

interface StoredSession {
  tokens: AuthTokens
  user: AuthUser
}

export interface AuthContext {
  isAuthenticated: boolean
  token: string | null
  tokens: AuthTokens | null
  user: AuthUser | null
  login: (token: string, user: AuthUser, extra?: Omit<AuthTokens, "accessToken">) => void
  // Changes the shown name/email (e.g. after editing the profile) without a new sign-in
  updateUser: (user: AuthUser) => void
  logout: () => void
}

const AuthContext = React.createContext<AuthContext | null>(null)

const isExpired = (tokens: AuthTokens) => tokens.expiresAt !== undefined && tokens.expiresAt <= Date.now()

function readSession(): StoredSession | null {
  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key))
    const raw = sessionStorage.getItem(SESSION_KEY)
    const session = raw ? (JSON.parse(raw) as StoredSession) : null
    if (!session?.tokens?.accessToken || isExpired(session.tokens)) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

function writeSession(session: StoredSession | null) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // Storage blocked; the session just won't survive a reload
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<StoredSession | null>(readSession)

  const login = React.useCallback((token: string, user: AuthUser, extra?: Omit<AuthTokens, "accessToken">) => {
    const next = { tokens: { ...extra, accessToken: token }, user }
    writeSession(next)
    setSession(next)
  }, [])

  const updateUser = React.useCallback((user: AuthUser) => {
    setSession((current) => {
      if (!current) return current
      const next = { ...current, user }
      writeSession(next)
      return next
    })
  }, [])

  const logout = React.useCallback(() => {
    writeSession(null)
    setSession(null)
  }, [])

  // Sign out when the access token expires (POST /auth/refresh isn't wired yet)
  const expiresAt = session?.tokens.expiresAt
  React.useEffect(() => {
    if (expiresAt === undefined) return
    const timer = window.setTimeout(logout, Math.max(0, expiresAt - Date.now()))
    return () => window.clearTimeout(timer)
  }, [expiresAt, logout])

  const value = React.useMemo(
    () => ({
      isAuthenticated: !!session,
      token: session?.tokens.accessToken ?? null,
      tokens: session?.tokens ?? null,
      user: session?.user ?? null,
      login,
      updateUser,
      logout,
    }),
    [session, login, updateUser, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
