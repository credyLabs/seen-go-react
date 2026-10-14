import { queryOptions } from "@tanstack/react-query"

import { endpoints } from "@/api/endpoints"
import { ApiError, request } from "@/api/http"
import { isMocked, mockDelay, readMockStore, writeMockStore } from "@/api/mock"

// Saved delivery addresses — FIGMA_FRONTEND_API_SPEC.md §6 / API 17.24–17.28.
// Owned by auth-service, so they're faked along with it (VITE_MOCK_APIS=auth),
// keeping the spec's request and response shapes.

export interface Address {
  id: string
  // e.g. "Home", "Office"; may be null
  label: string | null
  fullName: string
  phoneNumber: string
  street1: string
  street2: string | null
  city: string
  // Emirate
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type AddressInput = Omit<Address, "id" | "createdAt" | "updatedAt">

// --- Dummy implementations (stored per signed-in token) ---

const mockKey = (token: string) => `addresses:${token}`
const readMock = (token: string) => readMockStore<Address[]>(mockKey(token), [])
const writeMock = (token: string, addresses: Address[]) =>
  writeMockStore(mockKey(token), addresses)

// The first address is always the default, and only one can be
function withDefault(addresses: Address[], defaultId?: string) {
  const id =
    defaultId ?? addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id
  return addresses.map((address) => ({
    ...address,
    isDefault: address.id === id,
  }))
}

// --- API functions ---

// The deployed service names the flag `defaultAddress` (the spec says isDefault)
// and adds userId; accept either so the rest of the app sees isDefault
type ApiAddress = Omit<Address, "isDefault"> & { isDefault?: boolean; defaultAddress?: boolean; userId?: string }

function normalizeAddress(raw: ApiAddress): Address {
  const { defaultAddress, isDefault, ...rest } = raw
  return { ...rest, isDefault: isDefault ?? defaultAddress ?? false }
}

// Request body: the spec's isDefault plus the deployed name, so either reading works
const toBody = (input: AddressInput) => ({ ...input, defaultAddress: input.isDefault })

export async function fetchAddresses(token: string): Promise<Address[]> {
  if (isMocked("auth")) {
    await mockDelay(300)
    return readMock(token)
  }
  const list = await request<ApiAddress[]>(endpoints.addresses.list, { token })
  return list.map(normalizeAddress)
}

export async function createAddress(
  token: string,
  input: AddressInput
): Promise<Address> {
  if (isMocked("auth")) {
    await mockDelay()
    const now = new Date().toISOString()
    const address: Address = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    const list = [...readMock(token), address]
    writeMock(
      token,
      withDefault(list, input.isDefault ? address.id : undefined)
    )
    return address
  }
  const created = await request<ApiAddress>(endpoints.addresses.list, {
    method: "POST",
    token,
    body: toBody(input),
  })
  return normalizeAddress(created)
}

export async function updateAddress(
  token: string,
  id: string,
  input: AddressInput
): Promise<Address> {
  if (isMocked("auth")) {
    await mockDelay()
    const list = readMock(token)
    const current = list.find((a) => a.id === id)
    if (!current) throw new ApiError(404, "Address not found")
    const updated: Address = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    }
    writeMock(
      token,
      withDefault(
        list.map((a) => (a.id === id ? updated : a)),
        input.isDefault ? id : undefined
      )
    )
    return updated
  }
  const updated = await request<ApiAddress>(endpoints.addresses.byId(id), {
    method: "PUT",
    token,
    body: toBody(input),
  })
  return normalizeAddress(updated)
}

export async function deleteAddress(token: string, id: string) {
  if (isMocked("auth")) {
    await mockDelay()
    const list = readMock(token)
    const address = list.find((a) => a.id === id)
    if (!address) throw new ApiError(404, "Address not found")
    if (address.isDefault)
      throw new ApiError(400, "Cannot delete the default address")
    writeMock(
      token,
      list.filter((a) => a.id !== id)
    )
    return { message: "Address deleted", addressId: id }
  }
  return request<{ message: string; addressId: string }>(
    endpoints.addresses.byId(id),
    { method: "DELETE", token }
  )
}

export async function setDefaultAddress(token: string, id: string) {
  if (isMocked("auth")) {
    await mockDelay()
    const list = readMock(token)
    if (!list.some((a) => a.id === id))
      throw new ApiError(404, "Address not found")
    writeMock(token, withDefault(list, id))
    return {
      message: "Default address updated",
      addressId: id,
      isDefault: true,
    }
  }
  return request<{ message: string; addressId: string; isDefault: boolean }>(
    endpoints.addresses.setDefault(id),
    {
      method: "PATCH",
      token,
    }
  )
}

export const addressesQueryOptions = (token: string | null) =>
  queryOptions({
    queryKey: ["account", "addresses", token],
    queryFn: () => fetchAddresses(token!),
    enabled: !!token,
    // Default first, then oldest first, as saved
    select: (addresses) =>
      [...addresses].sort(
        (a, b) =>
          Number(b.isDefault) - Number(a.isDefault) ||
          a.createdAt.localeCompare(b.createdAt)
      ),
  })
