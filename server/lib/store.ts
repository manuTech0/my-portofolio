import { createHash } from "node:crypto"
import Redis from "ioredis"
import type { Store, IdempotencyRecord, AbuseEvent } from "./types"

export function hashValue(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

export function hashIp(ip: string, sessionId: string): string {
  return hashValue(`${ip}:${sessionId}`)
}

// ---------------------------------------------------------------------------
// In-memory store (single instance, dev / no Redis)
// ---------------------------------------------------------------------------

interface HitEntry {
  member: string
  ts: number
}

export class MemoryStore implements Store {
  private hits = new Map<string, HitEntry[]>()
  private blocks = new Map<string, number>() // key -> unblockAt
  private idempotency = new Map<string, IdempotencyRecord>()
  private locks = new Map<string, Promise<void>>()
  private usedTokens = new Map<string, number>() // key -> expiry
  private abuse = new Map<string, AbuseEvent[]>()
  private messages = new Map<string, { id: string; clientId: string; payloadHash: string; createdAt: number }>()

  private prune(key: string, now: number, windowMs: number): void {
    const entries = this.hits.get(key)
    if (!entries) return
    const cutoff = now - windowMs
    const filtered = entries.filter((e) => e.ts > cutoff)
    if (filtered.length === 0) this.hits.delete(key)
    else this.hits.set(key, filtered)
  }

  async addHit(key: string, member: string, now: number, windowMs: number): Promise<number> {
    const entries = (this.hits.get(key) ?? []).filter((e) => e.ts > now - windowMs)
    entries.push({ member, ts: now })
    this.hits.set(key, entries)
    return entries.length
  }

  async getHits(key: string, now: number, windowMs: number): Promise<number> {
    this.prune(key, now, windowMs)
    return (this.hits.get(key) ?? []).length
  }

  async getBlock(key: string): Promise<number | null> {
    const unblockAt = this.blocks.get(key)
    if (!unblockAt) return null
    return Date.now() < unblockAt ? unblockAt : (this.blocks.delete(key), null)
  }

  async setBlock(key: string, unblockAt: number, ttlMs: number): Promise<void> {
    this.blocks.set(key, unblockAt)
    setTimeout(() => {
      if (this.blocks.get(key) === unblockAt) this.blocks.delete(key)
    }, ttlMs).unref()
  }

  async delBlock(key: string): Promise<void> {
    this.blocks.delete(key)
  }

  private async lock(key: string, fn: () => Promise<void>): Promise<void> {
    const chain = this.locks.get(key) ?? Promise.resolve()
    const next = chain.then(() => fn())
    this.locks.set(key, next)
    await next
  }

  async getIdempotency(key: string): Promise<IdempotencyRecord | null> {
    return this.idempotency.get(key) ?? null
  }

  async setIdempotency(key: string, record: IdempotencyRecord, ttlMs: number): Promise<boolean> {
    await this.lock(key, async () => {
      if (this.idempotency.has(key)) return
      this.idempotency.set(key, { ...record })
      setTimeout(() => this.idempotency.delete(key), ttlMs).unref()
    })
    // Re-read after lock to report whether we actually inserted
    const existing = this.idempotency.get(key)
    return existing!.createdAt === record.createdAt && existing!.status === record.status
  }

  async updateIdempotency(key: string, patch: Partial<IdempotencyRecord>): Promise<void> {
    await this.lock(key, async () => {
      const existing = this.idempotency.get(key)
      if (existing) this.idempotency.set(key, { ...existing, ...patch, updatedAt: Date.now() })
    })
  }

  async delIdempotency(key: string): Promise<void> {
    this.locks.delete(key)
    this.idempotency.delete(key)
  }

  async getUsedToken(key: string): Promise<boolean> {
    const expiry = this.usedTokens.get(key)
    if (!expiry) return false
    if (Date.now() > expiry) { this.usedTokens.delete(key); return false }
    return true
  }

  async setUsedToken(key: string, ttlMs: number): Promise<boolean> {
    const existing = await this.getUsedToken(key)
    if (existing) return false
    this.usedTokens.set(key, Date.now() + ttlMs)
    setTimeout(() => this.usedTokens.delete(key), ttlMs).unref()
    return true
  }

  async appendAbuse(event: AbuseEvent, ttlMs: number): Promise<void> {
    const list = (this.abuse.get(event.clientId) ?? [])
    list.push(event)
    if (list.length > 1000) list.splice(0, list.length - 1000)
    this.abuse.set(event.clientId, list)
    setTimeout(() => {
      const current = this.abuse.get(event.clientId)
      if (current) this.abuse.set(event.clientId, current.filter((e) => e.timestamp !== event.timestamp || e !== event))
    }, ttlMs).unref()
  }

  async getAbuseEvents(clientId: string, limit = 50): Promise<AbuseEvent[]> {
    return (this.abuse.get(clientId) ?? []).slice(-limit)
  }

  async appendMessage(message: { id: string; clientId: string; payloadHash: string; createdAt: number }, ttlMs: number): Promise<void> {
    this.messages.set(message.id, message)
    setTimeout(() => this.messages.delete(message.id), ttlMs).unref()
  }
}

// ---------------------------------------------------------------------------
// Redis store (distributed)
// ---------------------------------------------------------------------------

export async function createRedisStore(redisUrl: string, idempotencyTtlMs: number): Promise<Store> {
  const redis = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  })
  await redis.connect()

  const HITS_PREFIX = "rl:hits:"
  const BLOCK_PREFIX = "rl:block:"
  const IDEMP_PREFIX = "rl:idem:"
  const TOKEN_PREFIX = "rl:token:"
  const ABUSE_PREFIX = "rl:abuse:"
  const MSG_PREFIX = "rl:msg:"

  const luaAddHit = `
    local key = KEYS[1]
    local member = ARGV[1]
    local now = tonumber(ARGV[2])
    local window = tonumber(ARGV[3])
    redis.call('ZADD', key, now, member)
    redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
    local count = redis.call('ZCARD', key)
    redis.call('EXPIRE', key, math.ceil(window / 1000))
    return count
  `

  return {
    async addHit(key, member, now, windowMs) {
      return Number(await redis.eval(luaAddHit, 1, `${HITS_PREFIX}${key}`, member, String(now), String(windowMs)))
    },
    async getHits(key, now, windowMs) {
      await redis.zremrangebyscore(`${HITS_PREFIX}${key}`, 0, now - windowMs)
      return Number(await redis.zcard(`${HITS_PREFIX}${key}`))
    },
    async getBlock(key) {
      const raw = await redis.get(`${BLOCK_PREFIX}${key}`)
      if (!raw) return null
      const unblockAt = Number(raw)
      return Date.now() < unblockAt ? unblockAt : null
    },
    async setBlock(key, unblockAt, ttlMs) {
      await redis.set(`${BLOCK_PREFIX}${key}`, String(unblockAt), "PX", ttlMs)
    },
    async delBlock(key) {
      await redis.del(`${BLOCK_PREFIX}${key}`)
    },
    async getIdempotency(key) {
      const raw = await redis.get(`${IDEMP_PREFIX}${key}`)
      if (!raw) return null
      return JSON.parse(raw) as IdempotencyRecord
    },
    async setIdempotency(key, record, ttlMs) {
      const set = await redis.set(`${IDEMP_PREFIX}${key}`, JSON.stringify(record), "PX", ttlMs, "NX")
      return set === "OK"
    },
    async updateIdempotency(key: string, patch: Partial<IdempotencyRecord>): Promise<void> {
      const raw = await redis.get(`${IDEMP_PREFIX}${key}`)
      if (!raw) return
      const record = JSON.parse(raw) as IdempotencyRecord
      await redis.set(`${IDEMP_PREFIX}${key}`, JSON.stringify({ ...record, ...patch, updatedAt: Date.now() }), "PX", idempotencyTtlMs)
    },
    async delIdempotency(key) {
      await redis.del(`${IDEMP_PREFIX}${key}`)
    },
    async getUsedToken(key) {
      return Number(await redis.exists(`${TOKEN_PREFIX}${key}`)) === 1
    },
    async setUsedToken(key, ttlMs) {
      const set = await redis.set(`${TOKEN_PREFIX}${key}`, "1", "PX", ttlMs, "NX")
      return set === "OK"
    },
    async appendAbuse(event, ttlMs) {
      const key = `${ABUSE_PREFIX}${event.clientId}`
      await redis.rpush(key, JSON.stringify(event))
      await redis.ltrim(key, -999, -1)
      await redis.expire(key, Math.ceil(ttlMs / 1000))
    },
    async getAbuseEvents(clientId, limit = 50) {
      const raw = await redis.lrange(`${ABUSE_PREFIX}${clientId}`, -limit, -1)
      const events: AbuseEvent[] = []
      for (const item of raw) {
        try { events.push(JSON.parse(item)) } catch { /* ignore malformed */ }
      }
      return events
    },
    async appendMessage(message, ttlMs) {
      await redis.set(`${MSG_PREFIX}${message.id}`, JSON.stringify(message), "PX", ttlMs)
    },
  }
}
