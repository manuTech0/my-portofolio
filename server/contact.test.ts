// @vitest-environment node
import { describe, expect, it, vi, beforeEach, afterEach, beforeAll } from "vitest"
import { MemoryStore } from "./lib/store"
import { RateLimiter, DEFAULT_CONFIG } from "./lib/ratelimit"
import { sha256, clientIdentity, extractClientIp, createApp } from "./routes/contact"
import { signSession } from "./lib/jwt"
import type { Request } from "express"
import request from "supertest"

const viFetch = vi.fn()
Object.defineProperty(globalThis, "fetch", { writable: true, value: viFetch })

const BASE_IP = "127.0.0.1"
const SESSION = "fixed-session"
let sessionJwt: string

beforeAll(async () => {
  sessionJwt = await signSession("test-client", 3600)
})

function turnstileSuccess() {
  viFetch.mockResolvedValue({
    ok: true,
    text: async () => JSON.stringify({ success: true, hostname: "localhost", action: "contact" }),
    json: async () => ({ success: true, hostname: "localhost", action: "contact" }),
  })
}

function turnstileInvalid() {
  viFetch.mockResolvedValue({
    ok: true,
    text: async () => JSON.stringify({ success: false, "error-codes": ["invalid-input"] }),
    json: async () => ({ success: false, "error-codes": ["invalid-input"] }),
  })
}

function turnstileExpired() {
  viFetch.mockResolvedValue({
    ok: true,
    text: async () => JSON.stringify({ success: false, "error-codes": ["timeout-or-expired"] }),
    json: async () => ({ success: false, "error-codes": ["timeout-or-expired"] }),
  })
}

function turnstileUnavailable() {
  viFetch.mockRejectedValue(new Error("network down"))
}

function turnstileTimeout() {
  viFetch.mockRejectedValue(Object.assign(new Error("timeout"), { name: "AbortError" }))
}

function validBody(overrides: Record<string, unknown> = {}) {
  return { name: "John Doe", email: "john@example.com", message: "Hello world this is a test", ...overrides }
}

function headers(idempotencyKey = crypto.randomUUID(), token = "turnstile-token") {
  return {
    "Idempotency-Key": idempotencyKey,
    "X-Turnstile-Token": token,
    "X-Session-Id": SESSION,
    Authorization: `Bearer ${sessionJwt}`,
  }
}

function appForTest() {
  const store = new MemoryStore()
  const { app } = createApp(store, {
    turnstileConfig: { secretKey: "test-secret", expectedHostname: "localhost", expectedAction: "contact", timeoutMs: 5000 },
  })
  return { app: request(app), store }
}

describe("client identity", () => {
  it("extracts IP from X-Forwarded-For when trusting proxy", () => {
    const req = {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
      socket: { remoteAddress: "127.0.0.1" },
      ip: "127.0.0.1",
    } as unknown as Request
    expect(extractClientIp(req, true)).toBe("203.0.113.5")
  })

  it("falls back to X-Real-IP", () => {
    const req = {
      headers: { "x-real-ip": "203.0.113.7" },
      socket: { remoteAddress: "127.0.0.1" },
      ip: "127.0.0.1",
    } as unknown as Request
    expect(extractClientIp(req, true)).toBe("203.0.113.7")
  })

  it("does not trust client headers when proxy is not trusted", () => {
    const req = {
      headers: { "x-forwarded-for": "203.0.113.5" },
      socket: { remoteAddress: "127.0.0.1" },
      ip: "127.0.0.1",
    } as unknown as Request
    expect(extractClientIp(req, false)).toBe("127.0.0.1")
  })

  it("hashes identity and ip separately", () => {
    const { clientId, ipHash } = clientIdentity(BASE_IP, SESSION)
    expect(clientId).toBe(sha256(`${BASE_IP}:${SESSION}`))
    expect(ipHash).toBe(sha256(BASE_IP))
    expect(clientId).not.toBe(ipHash)
  })
})

describe("rate limiting (HTTP)", () => {
  let app: ReturnType<typeof appForTest>["app"]

  beforeEach(() => {
    viFetch.mockReset()
    turnstileSuccess()
    ;({ app } = appForTest())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const post = (overrides: Record<string, unknown> = {}, hdrs: Record<string, string> = {}) =>
    app.post("/api/contact").set(headers(undefined, undefined)).set(hdrs).send(validBody(overrides))

  it("4 requests within 1 hour -> 2 minute penalty", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(1000000000000)
    for (let i = 0; i < 3; i++) {
      expect((await post()).status).toBe(200)
      vi.setSystemTime(1000000000000 + (i + 1) * 15 * 60 * 1000)
    }
    const fourth = await post()
    expect(fourth.status).toBe(429)
    expect(fourth.body.error).toBe("rate_limited")
    expect(fourth.headers["retry-after"]).toBe("120")
  })

  it("4 requests within 10 seconds -> 30 minute penalty", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(1000000000000)
    for (let i = 0; i < 3; i++) {
      await post()
      vi.setSystemTime(1000000000000 + (i + 1) * 1000)
    }
    const fourth = await post()
    expect(fourth.status).toBe(429)
    expect(fourth.headers["retry-after"]).toBe("1800")
  })

  it("8 requests within an hour -> 90 minute base penalty (unit)", async () => {
    const store = new MemoryStore()
    const limiter = new RateLimiter(store, { ...DEFAULT_CONFIG })
    const now = 1000000000000
    const client = "client"
    const ipHash = "hash"
    const key = `hits:${client}:3600000`
    // prime 7 hits in the trailing hour without tripping the block
    for (let i = 0; i < 7; i++) {
      await store.addHit(key, "primed", now - 1000 + i * 1000, 3600000)
    }
    const res = await limiter.checkAndRecord({ clientId: client, ipHash, now })
    expect(res.allowed).toBe(false)
    expect(res.counts["hourly_8"]).toBe(8)
    expect(res.penaltyMs).toBe(5400000)
    expect(res.violationLevel).toBe(1)
  })

  it("20 requests within an hour -> 24 hour base penalty (unit)", async () => {
    const store = new MemoryStore()
    const limiter = new RateLimiter(store, { ...DEFAULT_CONFIG })
    const now = 1000000000000
    const client = "client"
    const ipHash = "hash"
    const key = `hits:${client}:3600000`
    for (let i = 0; i < 19; i++) {
      await store.addHit(key, "primed", now - 1000 + i * 1000, 3600000)
    }
    const res = await limiter.checkAndRecord({ clientId: client, ipHash, now })
    expect(res.allowed).toBe(false)
    expect(res.counts["hourly_20"]).toBe(20)
    expect(res.penaltyMs).toBe(86400000)
    expect(res.violationLevel).toBe(1)
  })

  it("applies the highest penalty when multiple thresholds are exceeded", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(1000000000000)
    for (let i = 0; i < 3; i++) {
      await post()
      vi.setSystemTime(1000000000000 + (i + 1) * 1000)
    }
    const fourth = await post()
    expect(fourth.status).toBe(429)
    // burst (30m) wins over hourly (2m)
    expect(fourth.headers["retry-after"]).toBe("1800")
  })

  it("allows requests again after the penalty expires", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(1000000000000)
    await post(); await post(); await post()
    const blocked = await post()
    expect(blocked.status).toBe(429)

    vi.setSystemTime(1000000000000 + 106 * 60 * 1000) // trailing-hour hits expired
    const allowed = await post()
    expect(allowed.status).toBe(200)
  })

  it("preserves violation history across cooldown expiration (progressive escalation)", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(1000000000000)
    await post(); await post(); await post()
    const r4 = await post()
    expect(r4.status).toBe(429) // level 1, 2 min

    vi.setSystemTime(1000000000000 + 106 * 60 * 1000) // first-burst hits are outside the 1h window now
    await post(); await post(); await post() // at 106, 121, 136 min
    vi.setSystemTime(1000000000000 + 151 * 60 * 1000)
    const r8 = await post() // at 151 min: 4th hit in the trailing hour
    expect(r8.status).toBe(429)
    expect(Number(r8.headers["retry-after"])).toBe(240) // level 2: 2 min * 2
  })

  it("429 response includes retry-after and cooldown information", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(1000000000000)
    await post(); await post(); await post()
    const res = await post()
    expect(res.status).toBe(429)
    expect(res.headers["retry-after"]).toBeDefined()
    expect(res.body.error).toBe("rate_limited")
    expect(typeof res.body.message).toBe("string")
  })
})

describe("rate limiting (unit)", () => {
  it("caps the penalty at the configured maximum", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    const store = new MemoryStore()
    const limiter = new RateLimiter(store, { ...DEFAULT_CONFIG, maxPenaltyMs: 180000 })
    const now = 1000000000000
    const client = "client"
    const ipHash = "hash"

    const penalty = async (level: number, penaltyMs: number, blockExpiresAt: number) => {
      await store.appendAbuse(
        {
          clientId: client,
          ipHash,
          timestamp: now,
          type: "penalty",
          violationLevel: level,
          penaltyMs,
          blockExpiresAt,
        },
        604800000
      )
    }

    // level 1: 120s (not capped); space requests >10s apart so only the hourly threshold fires
    let res = await limiter.checkAndRecord({ clientId: client, ipHash, now })
    await limiter.checkAndRecord({ clientId: client, ipHash, now: now + 11000 })
    await limiter.checkAndRecord({ clientId: client, ipHash, now: now + 22000 })
    res = await limiter.checkAndRecord({ clientId: client, ipHash, now: now + 33000 })
    expect(res.allowed).toBe(false)
    expect(res.penaltyMs).toBe(120000)
    expect(res.violationLevel).toBe(1)
    await penalty(1, 120000, now + 120000)

    // penalty expires; level 2: 240s capped at 180s
    const after = now + 121000
    await limiter.checkAndRecord({ clientId: client, ipHash, now: after })
    await limiter.checkAndRecord({ clientId: client, ipHash, now: after + 11000 })
    await limiter.checkAndRecord({ clientId: client, ipHash, now: after + 22000 })
    res = await limiter.checkAndRecord({ clientId: client, ipHash, now: after + 33000 })
    expect(res.allowed).toBe(false)
    expect(res.penaltyMs).toBe(180000)
    expect(res.violationLevel).toBe(2)
    vi.useRealTimers()
  })
})

describe("idempotency", () => {
  it("returns the original result for the same key and payload", async () => {
    viFetch.mockReset()
    turnstileSuccess()
    const { app } = appForTest()
    const key = crypto.randomUUID()
    const body = validBody()
    const first = await app.post("/api/contact").set({ ...headers(key), "X-Session-Id": SESSION }).send(body)
    expect(first.status).toBe(200)
    expect(first.body.idempotent).toBe(false)

    const second = await app.post("/api/contact").set({ ...headers(key), "X-Session-Id": SESSION }).send(body)
    expect(second.status).toBe(200)
    expect(second.body.idempotent).toBe(true)
    expect(second.body.ok).toBe(first.body.ok)
    expect(second.body.message).toBe(first.body.message)
    expect(second.body.id).toBe(first.body.id)
  })

  it("returns 409 when the same key is reused with a different payload", async () => {
    viFetch.mockReset()
    turnstileSuccess()
    const { app } = appForTest()
    const key = crypto.randomUUID()
    await app.post("/api/contact").set({ ...headers(key), "X-Session-Id": SESSION }).send(validBody())
    const conflict = await app
      .post("/api/contact")
      .set({ ...headers(key), "X-Session-Id": SESSION })
      .send(validBody({ message: "totally different message content here" }))
    expect(conflict.status).toBe(409)
    expect(conflict.body.error).toBe("idempotency_conflict")
  })

  it("prevents concurrent duplicate submissions with the same key", async () => {
    viFetch.mockReset()
    turnstileSuccess()
    const { app, store } = appForTest()
    const key = crypto.randomUUID()
    const body = validBody()

    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        app.post("/api/contact").set({ ...headers(key), "X-Session-Id": SESSION }).send(body)
      )
    )

    for (const r of results) {
      expect(r.status).toBe(200)
      expect(r.body.ok).toBe(true)
    }
    expect((store as unknown as { messages: Map<string, { id: string }> }).messages.size).toBe(1)
  })

  it("supports safe retry after a completed submission", async () => {
    viFetch.mockReset()
    turnstileSuccess()
    const { app } = appForTest()
    const key = crypto.randomUUID()
    const body = validBody()
    const first = await app.post("/api/contact").set({ ...headers(key), "X-Session-Id": SESSION }).send(body)
    expect(first.status).toBe(200)

    const retry = await app.post("/api/contact").set({ ...headers(key), "X-Session-Id": SESSION }).send(body)
    expect(retry.status).toBe(200)
    expect(retry.body.idempotent).toBe(true)
  })

  it("rejects a missing or malformed idempotency key", async () => {
    viFetch.mockReset()
    turnstileSuccess()
    const { app } = appForTest()
    const noKey = await app.post("/api/contact").set({ "X-Session-Id": SESSION, Authorization: `Bearer ${sessionJwt}` }).send(validBody())
    expect(noKey.status).toBe(400)
    expect(noKey.body.error).toBe("idempotency_key_required")

    const badKey = await app
      .post("/api/contact")
      .set({ "Idempotency-Key": "not-a-uuid", "X-Session-Id": SESSION, Authorization: `Bearer ${sessionJwt}` })
      .send(validBody())
    expect(badKey.status).toBe(400)
  })

  it("tracks abuse events with turnstile and idempotency status", async () => {
    viFetch.mockReset()
    turnstileSuccess()
    const { app, store } = appForTest()
    const ipHash = sha256(BASE_IP)
    await app.post("/api/contact").set(headers()).send(validBody())
    const events = await store.getAbuseEvents(ipHash)
    expect(events.length).toBeGreaterThan(0)
    expect(events.at(-1)?.turnstile).toBe("passed")
    expect(events.at(-1)?.idempotency).toBe("miss")
  })
})

describe("turnstile", () => {
  beforeEach(() => {
    viFetch.mockReset()
  })

  it("rejects a missing token", async () => {
    const { app } = appForTest()
    const res = await app
      .post("/api/contact")
      .set({ "Idempotency-Key": crypto.randomUUID(), "X-Session-Id": SESSION, Authorization: `Bearer ${sessionJwt}` })
      .send(validBody())
    expect(res.status).toBe(422)
    expect(res.body.error).toBe("turnstile_required")
  })

  it("rejects an invalid token", async () => {
    turnstileInvalid()
    const { app } = appForTest()
    const res = await app.post("/api/contact").set(headers()).send(validBody())
    expect(res.status).toBe(422)
    expect(res.body.error).toBe("turnstile_invalid")
  })

  it("rejects an expired token", async () => {
    turnstileExpired()
    const { app } = appForTest()
    const res = await app.post("/api/contact").set(headers()).send(validBody())
    expect(res.status).toBe(422)
  })

  it("rejects a reused token", async () => {
    turnstileSuccess()
    const { app } = appForTest()
    const token = "single-use-token"
    const ok = await app.post("/api/contact").set({ ...headers(undefined, token), "X-Session-Id": SESSION }).send(validBody())
    expect(ok.status).toBe(200)
    const reused = await app.post("/api/contact").set({ ...headers(undefined, token), "X-Session-Id": SESSION }).send(validBody())
    expect(reused.status).toBe(422)
    expect(reused.body.error).toBe("turnstile_reused")
  })

  it("returns 503 when the verification service is unavailable", async () => {
    turnstileUnavailable()
    const { app } = appForTest()
    const res = await app.post("/api/contact").set(headers()).send(validBody())
    expect(res.status).toBe(503)
    expect(res.body.error).toBe("turnstile_service_unavailable")
  })

  it("returns 503 when the verification service times out", async () => {
    turnstileTimeout()
    const { app } = appForTest()
    const res = await app.post("/api/contact").set(headers()).send(validBody())
    expect(res.status).toBe(503)
  })

  it("fails closed when verification throws", async () => {
    viFetch.mockRejectedValue(new Error("boom"))
    const { app } = appForTest()
    const res = await app.post("/api/contact").set(headers()).send(validBody())
    expect(res.status).toBe(503)
  })
})

describe("submission", () => {
  beforeEach(() => {
    viFetch.mockReset()
    turnstileSuccess()
  })

  it("accepts a valid submission", async () => {
    const { app } = appForTest()
    const res = await app.post("/api/contact").set(headers()).send(validBody())
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.message).toBe("Message sent successfully")
    expect(res.body.idempotent).toBe(false)
  })

  it("rejects an invalid payload with 400", async () => {
    const { app } = appForTest()
    const res = await app.post("/api/contact").set(headers()).send(validBody({ name: "Ab" }))
    expect(res.status).toBe(400)
    expect(res.body.error).toBe("invalid_payload")
  })

  it("does not leak stack traces or internals in error responses", async () => {
    turnstileUnavailable()
    const { app } = appForTest()
    const res = await app.post("/api/contact").set(headers()).send(validBody())
    expect(JSON.stringify(res.body)).not.toContain("stack")
    expect(JSON.stringify(res.body)).not.toContain("secret")
    expect(res.body.message).not.toContain("at ")
  })
})
