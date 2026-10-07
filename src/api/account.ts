import { queryOptions } from "@tanstack/react-query"

import { endpoints } from "@/api/endpoints"
import { ApiError, request } from "@/api/http"
import { isMocked, mockDelay, readMockStore, writeMockStore } from "@/api/mock"
import type { AuthUser } from "@/lib/auth"

// Account APIs for the profile page — FIGMA_FRONTEND_API_SPEC.md §5 / §14.5.
// Each call has a dummy version (VITE_MOCK_APIS) with the same shapes.

export interface Profile {
  id: string
  username: string
  email: string
  // Full name; may be empty
  name: string
  phoneNumber: string
  address: string
  profilePictureUrl: string | null
  status: string
  roles: string[]
  createdAt: string
  updatedAt: string
}

export interface ProfileUpdate {
  name?: string
  phoneNumber?: string
  address?: string
}

export interface NotificationPreferences {
  emailEnabled: boolean
  pushEnabled: boolean
  smsEnabled: boolean
  updatedAt: string
}

// The "Promotions / Offers" toggle has no API field; it lives in the browser for now
export interface Preferences extends NotificationPreferences {
  promotionsEnabled: boolean
}

export type PreferencesUpdate = Partial<Omit<Preferences, "updatedAt">>

export const MAX_PICTURE_BYTES = 2 * 1024 * 1024

// --- Dummy implementations (stored per signed-in token) ---

function mockProfile(token: string, user: AuthUser | null): Profile {
  const now = new Date().toISOString()
  const fallback: Profile = {
    id: "mock-user",
    username: user?.email ?? "",
    email: user?.email ?? "",
    name: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    phoneNumber: "",
    address: "",
    profilePictureUrl: null,
    status: "ACTIVE",
    roles: ["CUSTOMER"],
    createdAt: now,
    updatedAt: now,
  }
  return readMockStore(`profile:${token}`, fallback)
}

const PROMOTIONS_KEY = "promotions-enabled"

// --- API functions ---

export async function fetchProfile(token: string, user: AuthUser | null): Promise<Profile> {
  if (isMocked("auth")) {
    await mockDelay(300)
    return mockProfile(token, user)
  }
  return request<Profile>(endpoints.auth.me, { token })
}

export async function updateProfile(token: string, user: AuthUser | null, update: ProfileUpdate) {
  if (isMocked("auth")) {
    await mockDelay()
    const profile = { ...mockProfile(token, user), ...update, updatedAt: new Date().toISOString() }
    writeMockStore(`profile:${token}`, profile)
    return { message: "Profile updated successfully" }
  }
  return request<{ message: string }>(endpoints.auth.profile, { method: "PUT", token, body: update })
}

export async function uploadProfilePicture(token: string, user: AuthUser | null, file: File) {
  if (isMocked("auth")) {
    await mockDelay()
    // Keep the image itself so it survives reloads in the dummy store
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new ApiError(400, "Invalid profile picture"))
      reader.readAsDataURL(file)
    })
    writeMockStore(`profile:${token}`, { ...mockProfile(token, user), profilePictureUrl: dataUrl })
    return { message: "Profile picture uploaded", profilePictureUrl: dataUrl }
  }
  const body = new FormData()
  body.append("file", file)
  // Not JSON, so bypass request()'s JSON body handling
  const response = await fetch(endpoints.auth.profilePicture, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  }).catch(() => {
    throw new ApiError(0, "Network error")
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, data?.error ?? "Unable to upload profile picture")
  return data as { message: string; profilePictureUrl: string }
}

// TODO: the spec has no change-password endpoint (only forgot/reset); wire it once one exists
export async function changePassword(currentPassword: string, newPassword: string) {
  if (!isMocked("auth")) throw new ApiError(501, "Password change isn't available yet")
  await mockDelay()
  // Same convention as dummy sign-in: "wrong" is treated as an incorrect password
  if (currentPassword === "wrong") throw new ApiError(400, "Current password is incorrect")
  if (newPassword.length < 8) throw new ApiError(400, "Password does not meet the policy")
  return { message: "Password updated" }
}

function readPromotions() {
  return readMockStore<boolean>(PROMOTIONS_KEY, false)
}

export async function fetchPreferences(token: string): Promise<Preferences> {
  if (isMocked("notifications")) {
    await mockDelay(300)
    // The service creates missing rows with every channel on
    const prefs = readMockStore<NotificationPreferences>(`notification-prefs:${token}`, {
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: true,
      updatedAt: new Date().toISOString(),
    })
    return { ...prefs, promotionsEnabled: readPromotions() }
  }
  const prefs = await request<NotificationPreferences>(endpoints.notifications.preferences, { token })
  return { ...prefs, promotionsEnabled: readPromotions() }
}

export async function updatePreferences(token: string, update: PreferencesUpdate): Promise<Preferences> {
  const { promotionsEnabled, ...channels } = update
  if (promotionsEnabled !== undefined) writeMockStore(PROMOTIONS_KEY, promotionsEnabled)

  if (isMocked("notifications")) {
    await mockDelay()
    const current = await fetchPreferences(token)
    const stored: NotificationPreferences = {
      emailEnabled: channels.emailEnabled ?? current.emailEnabled,
      pushEnabled: channels.pushEnabled ?? current.pushEnabled,
      smsEnabled: channels.smsEnabled ?? current.smsEnabled,
      updatedAt: new Date().toISOString(),
    }
    writeMockStore(`notification-prefs:${token}`, stored)
    return { ...stored, promotionsEnabled: readPromotions() }
  }
  const prefs = await request<NotificationPreferences>(endpoints.notifications.preferences, {
    method: "PUT",
    token,
    body: channels,
  })
  return { ...prefs, promotionsEnabled: readPromotions() }
}

export const profileQueryOptions = (token: string | null, user: AuthUser | null) =>
  queryOptions({
    queryKey: ["account", "profile", token],
    queryFn: () => fetchProfile(token!, user),
    enabled: !!token,
  })

export const preferencesQueryOptions = (token: string | null) =>
  queryOptions({
    queryKey: ["account", "preferences", token],
    queryFn: () => fetchPreferences(token!),
    enabled: !!token,
  })
