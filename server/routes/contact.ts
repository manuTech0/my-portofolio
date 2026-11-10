import express from "express"
import { randomUUID, createHash } from "node:crypto"
import type { Request, Response, NextFunction } from "express"
import { Router } from "express"
import { MemoryStore } from "../lib/store"
import { createRedisStore } from "../lib/store"
import { RateLimiter, DEFAULT_CONFIG } from "../lib/ratelimit"
import { verifyTurnstile, loadTurnstileConfig, type TurnstileConfig } from "../lib/turnstile"
import { AbuseTracker } from "../lib/abuse"
import { signSession, extractBearerToken, verifySession, SESSION_TTL_SECONDS, type SessionPayload } from "../lib/jwt"
import { z } from "zod"
import type { Store } from "../lib/types"

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback
}

function parseBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (raw === undefined) return fallback
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase())
}

function parseCorsOrigins(): string[] {
  return (process.env.ALLOW_DOMAIN ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
}

const APP_ENV = optionalEnv("APP_ENV", "development")
const IS_PROD = APP_ENV === "production"
const TRUST_PROXY = parseBool("TRUST_PROXY", false)
const CORs_ORIGINS = parseCorsOrigins()
const MAX_BODY_BYTES = Number(optionalEnv("MAX_BODY_BYTES", "65536"))
const IDEMPOTENCY_TTL_MS = Number(optionalEnv("IDEMPIOTENCY_TTL_MS", "86400000"))
const TURNSTILE_TOKEN_TTL_MS = Number(optionalEnv("TURNSTILE_TOKEN_TTL_MS", "300000"))
const TURNSTILE_DISABLED = parseBool("TURNSTILE_DISABLED", false)
const SESSION_COOKIE_NAME = optionalEnv("SESSION_COOKIE_NAME", "mp_sid")
const SESSION_TTL_MS = (() => {
  const raw = optionalEnv("SESSION_TTL_MS", "2592000000")
  return Number(raw) || 30 * 24 * 60 * 60 * 1000
})()

const contactSchema = z.object({
  name: z.string().trim().min(5, "Name must contain at least 5 characters").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email address").max(200),
  message: z.string().trim().min(8, "Message must contain at least 8 characters").max(4000),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function extractClientIp(req: Request, trustProxy: boolean = TRUST_PROXY): string {
  if (trustProxy) {
    const forwarded = req.headers["x-forwarded-for"]
    if (typeof forwarded === "string") {
      const first = forwarded.split(",")[0].trim()
      if (first) return first
    }
    const realIp = req.headers["x-real-ip"]
    if (typeof realIp === "string" && realIp.trim()) return realIp.trim()
  }
  return req.socket.remoteAddress ?? req.ip ?? "unknown"
}

export function getSessionId(req: Request): string {
  const cookie = req.headers.cookie
  if (typeof cookie === "string") {
    const match = cookie.match(/(?:^|;\s*)mp_sid=([^;]+)/)
    if (match?.[1]) return match[1]
  }
  return randomUUID()
}

export function setSessionCookie(res: Response, sessionId: string): void {
  const secure = IS_PROD || parseBool("FORCE_SECURE_COOKIE", false)
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`
  )
}

export function clientIdentity(ip: string, sessionId: string): { clientId: string; ipHash: string } {
  return {
    clientId: createHash("sha256").update(`${ip}:${sessionId}`).digest("hex"),
    ipHash: createHash("sha256").update(ip).digest("hex"),
  }
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin
  const allowed = CORs_ORIGINS.includes("*") || (origin && CORs_ORIGINS.includes(origin))
  const reflect = allowed ? origin : (CORs_ORIGINS[0] ?? "*")
  res.setHeader("Vary", "Origin")
  res.setHeader("Access-Control-Allow-Origin", reflect ?? "*")
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key, Authorization, X-Turnstile-Token")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Max-Age", "86400")
  if (req.method === "OPTIONS") {
    res.status(204).end()
    return
  }
  next()
}

function sendToTelegram(name: string, email: string, message: string): void {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const text = `New portfolio message\nName: ${escapeHtml(name)}\nEmail: ${escapeHtml(email)}\nMessage: ${escapeHtml(message)}`
  void fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch((err) => {
    console.error("[contact] telegram forward failed", err instanceof Error ? err.message : err)
  })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function jsonError(res: Response, status: number, code: string, message: string, headers?: Record<string, string>): Response {  if (headers) Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v))
  return res.status(status).json({ ok: false, error: code, message })
}

// ---------------------------------------------------------------------------
// Router factory (one router per store instance for test isolation)
// ---------------------------------------------------------------------------

// JWT authentication middleware (HS256 via jose).
async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
  const token = extractBearerToken(req)
  if (!token) {
    return jsonError(res, 401, "unauthorized", "Missing or invalid Authorization header")
  }
  const ipHash = createHash("sha256").update(extractClientIp(req)).digest("hex")
  const payload = await verifySession(token, ipHash)
  if (!payload) {
    return jsonError(res, 401, "unauthorized", "Invalid or expired session token")
  }
  // Attach session info to request for downstream use
  ;(req as Request & { session?: SessionPayload }).session = payload
  return next()
}

interface ContactRouterOptions {
  store: Store
  turnstileConfig: TurnstileConfig | null
  rateLimiter: RateLimiter
  abuseTracker: AbuseTracker
}

export function createContactRouter({ store, turnstileConfig, rateLimiter, abuseTracker }: ContactRouterOptions): Router {
  const router = Router()

  router.post("/contact", requireAuth, async (req, res) => {
    const now = Date.now()

    // 2. Extract trusted client identity.
    const ip = extractClientIp(req)
    const sessionId = getSessionId(req)
    const { clientId, ipHash } = clientIdentity(ip, sessionId)

    // 3. Check existing idempotency records.
    const idempotencyKey = req.headers["idempotency-key"]
    if (!idempotencyKey || typeof idempotencyKey !== "string" || !/^[0-9a-fA-F-]{36}$/.test(idempotencyKey)) {
      return jsonError(res, 400, "idempotency_key_required", "Idempotency-Key header (UUID) is required")
    }

    const turnstileResult = { turnstile: "skipped" as "skipped" | "failed" | "passed" }

    const existing = await store.getIdempotency(idempotencyKey)
    if (existing && existing.status === "completed") {
      const payloadHash = sha256(JSON.stringify(req.body))
      if (existing.payloadHash === payloadHash) {
        setSessionCookie(res, sessionId)
        return res
          .status(existing.response!.status)
          .json({ ...(existing.response!.body as Record<string, unknown>), idempotent: true })
      }
      await abuseTracker.idempotencyConflict({ clientId: ipHash, ipHash, violationLevel: 0 })
      return jsonError(res, 409, "idempotency_conflict", "This Idempotency-Key was already used with a different payload")
    }

    // 4. Check active rate-limit penalties (keyed on server-controlled IP hash).
    const block = await store.getBlock(`block:${ipHash}`)
    if (block) {
      const retryAfterMs = Math.max(0, block - now)
      await abuseTracker.rateLimitRejected({ clientId: ipHash, ipHash, violationLevel: 0, turnstile: turnstileResult.turnstile })
      return jsonError(res, 429, "rate_limited", "Too many requests. Please try again later.", {
        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
      })
    }

    // 5. Evaluate rate-limit thresholds atomically (keyed on server-controlled IP hash).
    const rateLimit = await rateLimiter.checkAndRecord({ clientId: ipHash, ipHash, now })
    if (!rateLimit.allowed) {
      await abuseTracker.penaltyEvent({
        clientId: ipHash,
        ipHash,
        violationLevel: rateLimit.violationLevel,
        penaltyMs: rateLimit.penaltyMs ?? 0,
        blockExpiresAt: now + (rateLimit.retryAfterMs ?? 0),
        turnstile: turnstileResult.turnstile,
        idempotency: "miss",
      })
      return jsonError(res, 429, "rate_limited", "Too many requests. Please try again later.", {
        "Retry-After": String(Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000)),
      })
    }

    // 6. Validate the Turnstile token server-side.
    let turnstilePayload: { success: boolean; reason?: string; message: string } = { success: true, message: "skipped" }

    if (TURNSTILE_DISABLED) {
      turnstileResult.turnstile = "skipped"
    } else if (turnstileConfig) {
      const token = req.headers["x-turnstile-token"]
      const turnstileToken = Array.isArray(token) ? token[0] : token
      if (!turnstileToken || typeof turnstileToken !== "string") {
        await abuseTracker.turnstileFailed({ clientId, ipHash, violationLevel: rateLimit.violationLevel })
        return jsonError(res, 422, "turnstile_required", "Turnstile verification token is required")
      }
      const tokenHash = sha256(`turnstile:${turnstileToken}`)
      const alreadyUsed = await store.getUsedToken(tokenHash)
      if (alreadyUsed) {
        await abuseTracker.turnstileFailed({ clientId, ipHash, violationLevel: rateLimit.violationLevel })
        return jsonError(res, 422, "turnstile_reused", "Turnstile token has already been used")
      }
      turnstilePayload = await verifyTurnstile(turnstileToken, ip, turnstileConfig)
      turnstileResult.turnstile = turnstilePayload.success ? "passed" : "failed"
      if (!turnstilePayload.success) {
        await abuseTracker.turnstileFailed({ clientId, ipHash, violationLevel: rateLimit.violationLevel })
        return jsonError(
          res,
          turnstilePayload.reason === "service_unavailable" ? 503 : 422,
          turnstilePayload.reason === "service_unavailable" ? "turnstile_service_unavailable" : "turnstile_invalid",
          turnstilePayload.message
        )
      }
      await store.setUsedToken(tokenHash, TURNSTILE_TOKEN_TTL_MS)
    } else {
      return jsonError(res, 503, "turnstile_service_unavailable", "Turnstile verification is not configured")
    }

    // 7. Reserve the idempotency key (atomic; rejects concurrent duplicates).
    const payloadHash = sha256(JSON.stringify(req.body))
    const reserved = await store.setIdempotency(idempotencyKey, {
      key: idempotencyKey,
      clientId,
      payloadHash,
      status: "processing",
      createdAt: now,
      updatedAt: now,
    }, IDEMPOTENCY_TTL_MS)

    if (!reserved) {
      const resolved = await waitForResolution(store, idempotencyKey, payloadHash, 2000)
      if (resolved === "completed-same") {
        const record = await store.getIdempotency(idempotencyKey)
        setSessionCookie(res, sessionId)
        return res
          .status(record!.response!.status)
          .json({ ...(record!.response!.body as Record<string, unknown>), idempotent: true })
      }
      if (resolved === "completed-diff") {
        await abuseTracker.idempotencyConflict({ clientId, ipHash, violationLevel: rateLimit.violationLevel })
        return jsonError(res, 409, "idempotency_conflict", "This Idempotency-Key was already used with a different payload")
      }
      return jsonError(res, 409, "idempotency_conflict", "Concurrent submission with the same Idempotency-Key is in progress")
    }

    // 8. Process and persist the message.
    let responseBody: unknown
    let status = 200
    try {
      const parsed = contactSchema.safeParse(req.body)
      if (!parsed.success) {
        await store.delIdempotency(idempotencyKey)
        await abuseTracker.log({
          clientId: ipHash,
          ipHash,
          timestamp: now,
          type: "validation",
          violationLevel: 0,
          turnstile: turnstileResult.turnstile,
          idempotency: "miss",
        })
        return jsonError(res, 400, "invalid_payload", "Invalid submission payload")
      }

      await store.appendMessage(
        {
          id: randomUUID(),
          clientId,
          payloadHash,
          createdAt: now,
        },
        IDEMPOTENCY_TTL_MS
      )

      await rateLimiter.recordAccepted(ipHash, now)

      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        void sendToTelegram(parsed.data.name, parsed.data.email, parsed.data.message)
      }

      responseBody = { ok: true, message: "Message sent successfully", id: idempotencyKey }
      status = 200
    } catch (err) {
      await store.delIdempotency(idempotencyKey)
      console.error("[contact] processing error", err instanceof Error ? err.message : err)
      return jsonError(res, 500, "internal_error", "Failed to process submission")
    }

    // 9. Persist the final idempotency response.
    await store.updateIdempotency(idempotencyKey, {
      status: "completed",
      response: { status, body: responseBody },
      updatedAt: Date.now(),
    })

    await abuseTracker.log({
      clientId: ipHash,
      ipHash,
      timestamp: now,
      type: "rate_limit",
      violationLevel: 0,
      turnstile: turnstileResult.turnstile,
      idempotency: "miss",
    })

    // 10. Return the result.
    setSessionCookie(res, sessionId)
    return res.status(status).json({ ...(responseBody as object), idempotent: false })
  })

  return router
}

// Session router: issues HS256 JWT (via jose) that the frontend must send
// with every /api/contact request. Rate-limited per IP and bound to IP.
export function createSessionRouter(): Router {
  const router = Router()
  router.post("/session", async (req, res) => {
    const ip = extractClientIp(req)
    const ipHash = createHash("sha256").update(ip).digest("hex")

    // Rate-limit session issuance per IP (server-controlled).
    const sessionLimit = await sessionRateLimiter.checkAndRecord({
      clientId: ipHash,
      ipHash,
      now: Date.now(),
    })
    if (!sessionLimit.allowed) {
      return jsonError(res, 429, "session_rate_limited", "Too many session requests. Please try again later.", {
        "Retry-After": String(Math.ceil((sessionLimit.retryAfterMs ?? 0) / 1000)),
      })
    }

    const token = await signSession("contact-client", SESSION_TTL_SECONDS, ipHash)
    res.json({ ok: true, token, ttlSeconds: SESSION_TTL_SECONDS })
  })
  return router
}

async function waitForResolution(
  store: Store,
  key: string,
  payloadHash: string,
  timeoutMs: number
): Promise<"completed-same" | "completed-diff" | "timeout"> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 50))
    const record = await store.getIdempotency(key)
    if (record && record.status === "completed") {
      return record.payloadHash === payloadHash ? "completed-same" : "completed-diff"
    }
  }
  return "timeout"
}

// ---------------------------------------------------------------------------
// Default app (production entry point reuses the factory)
// ---------------------------------------------------------------------------

let defaultTurnstileConfig: TurnstileConfig | null = null
try {
  if (!TURNSTILE_DISABLED) defaultTurnstileConfig = loadTurnstileConfig()
} catch {
  if (IS_PROD) throw new Error("TURNSTILE_SECRET_KEY is required in production")
}

let defaultStore: Store = new MemoryStore()
if (process.env.REDIS_URL) {
  createRedisStore(process.env.REDIS_URL, IDEMPOTENCY_TTL_MS).then((s) => {
    defaultStore = s
  })
}

export const rateLimiter = new RateLimiter(defaultStore)
export const abuseTracker = new AbuseTracker(defaultStore, Number(optionalEnv("ABUSE_RETENTION_MS", "604800000")))

// Separate rate limiter for session token issuance, keyed on IP only (server-controlled).
export const sessionRateLimiter = new RateLimiter(defaultStore, {
  ...DEFAULT_CONFIG,
  thresholds: [
    { max: 30, windowMs: 60 * 1000, penaltyMs: 5 * 60 * 1000, label: "session_per_minute" },
  ],
})

export function createApp(store?: Store, opts?: { turnstileConfig?: TurnstileConfig | null }): { app: express.Application; store: Store } {
  const app = express()
  app.set("trust proxy", TRUST_PROXY)
  app.use(express.json({ limit: MAX_BODY_BYTES }))
  app.use(corsMiddleware)
  app.use("/api", createContactRouter({
    store: store ?? defaultStore,
    turnstileConfig: opts?.turnstileConfig ?? defaultTurnstileConfig,
    rateLimiter: store ? new RateLimiter(store) : rateLimiter,
    abuseTracker: store ? new AbuseTracker(store, Number(optionalEnv("ABUSE_RETENTION_MS", "604800000"))) : abuseTracker,
  }))
  app.use("/api", createSessionRouter())
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "contact", env: APP_ENV, turnstile: !!defaultTurnstileConfig })
  })
  app.use((_req, res) => {
    jsonError(res, 404, "not_found", "Endpoint not found")
  })
  app.use((err: Error, _req: express.Request, res: express.Response) => {
    console.error("[contact] unhandled error", err.message)
    jsonError(res, 500, "internal_error", "Internal processing error")
  })
  return { app, store: store ?? defaultStore }
}

const { app } = createApp()

export { app, defaultTurnstileConfig as turnstileConfig }
