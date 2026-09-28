import * as React from "react"

const TOKEN_KEY = "auth-token"
const USER_KEY = "auth-user"

export interface AuthUser {
  firstName: string
  lastName: string
  email: string
}

export interface AuthContext {
  isAuthenticated: boolean
  token: string | null
  user: AuthUser | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

const AuthContext = React.createContext<AuthContext | null>(null)

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? (JSON.parse(stored) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(getStoredToken)
  const [user, setUser] = React.useState<AuthUser | null>(getStoredUser)

  const login = React.useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = React.useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const value = React.useMemo(
    () => ({ isAuthenticated: !!token, token, user, login, logout }),
    [token, user, login, logout]
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
