// Thin fetch wrapper for the backend services. Services reply with plain JSON
// (no success envelope) and errors as {"error": "message"}; both become an
// ApiError so screens can show `error.message` and branch on `error.status`.

export class ApiError extends Error {
  // HTTP status, or 0 when the request never got a response (offline, CORS, server down)
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  // Serialised as JSON
  body?: unknown
  token?: string | null
}

// Free ngrok tunnels answer browser requests with an HTML warning page unless
// this header is sent. The backend's CORS config must allow it.
function isNgrok(url: string) {
  return /\.ngrok(-free)?\.(app|dev|io)$/.test(new URL(url).hostname)
}

export async function request<T>(url: string, { body, token, headers, ...init }: RequestOptions = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(isNgrok(url) && { "ngrok-skip-browser-warning": "true" }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, "Network error")
  }

  const text = await response.text()
  let data: unknown = null
  let isJson = true
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      // Non-JSON body, e.g. a proxy's or tunnel's HTML page
      isJson = false
    }
  }

  // A 2xx HTML page isn't the API answering; don't hand the caller `null`
  if (response.ok && !isJson) {
    throw new ApiError(response.status, "Unexpected response from server")
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : response.statusText || `Request failed (${response.status})`
    throw new ApiError(response.status, message)
  }
  return data as T
}
