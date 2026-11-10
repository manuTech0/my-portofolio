const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

// Node 22 provides a global fetch; importing "node:fetch" is intentionally avoided so the
// server tsconfig does not depend on @types/node module resolution for node:fetch.

export interface TurnstileConfig {
  secretKey: string
  expectedHostname?: string
  expectedAction?: string
  timeoutMs?: number
}

export interface TurnstileResult {
  success: boolean
  reason?: "invalid" | "expired" | "reused" | "service_unavailable" | "misconfigured"
  message: string
  hostname?: string | null
  action?: string | null
  errorCodes?: string[]
}

export function loadTurnstileConfig(): TurnstileConfig {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    throw new Error("TURNSTILE_SECRET_KEY is not configured")
  }
  return {
    secretKey,
    expectedHostname: process.env.TURNSTILE_EXPECTED_HOSTNAME ?? undefined,
    expectedAction: process.env.TURNSTILE_EXPECTED_ACTION ?? "contact",
    timeoutMs: Number(process.env.TURNSTILE_TIMEOUT_MS) || 5000,
  }
}

export async function verifyTurnstile(
  token: string,
  remoteIp: string | undefined,
  config: TurnstileConfig
): Promise<TurnstileResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? 5000)

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: config.secretKey,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }).toString(),
      signal: controller.signal,
    })

    let payload: Record<string, unknown>
    try {
      const text = await res.text()
      payload = text ? JSON.parse(text) : {}
    } catch {
      return { success: false, reason: "service_unavailable", message: "Turnstile verification service returned an invalid response" }
    }

    if (!res.ok || !payload) {
      const codes = Array.isArray(payload["error-codes"]) ? (payload["error-codes"] as unknown as string[]) : []
      return { success: false, reason: "service_unavailable", message: "Turnstile verification service is unavailable", errorCodes: codes }
    }

    if (payload.success === true) {
      const hostnameOk = !config.expectedHostname || payload.hostname === config.expectedHostname
      const actionOk = !config.expectedAction || payload.action === config.expectedAction
      if (!hostnameOk || !actionOk) {
        return {
          success: false,
          reason: "invalid",
          message: "Turnstile token validation failed",
          hostname: (payload.hostname as string | undefined) ?? null,
          action: (payload.action as string | undefined) ?? null,
        }
      }
      return {
        success: true,
        message: "Turnstile token verified",
        hostname: (payload.hostname as string | undefined) ?? null,
        action: (payload.action as string | undefined) ?? null,
      }
    }

    const codes: string[] = Array.isArray(payload["error-codes"]) ? (payload["error-codes"] as unknown as string[]) : []
    const expired = codes.includes("timeout-or-expired") || codes.includes("expired")
    return {
      success: false,
      reason: expired ? "expired" : "invalid",
      message: expired ? "Turnstile token expired" : "Invalid Turnstile token",
      errorCodes: codes,
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { success: false, reason: "service_unavailable", message: "Turnstile verification service timed out" }
    }
    return { success: false, reason: "service_unavailable", message: "Turnstile verification service is unavailable" }
  } finally {
    clearTimeout(timeout)
  }
}
