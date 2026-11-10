import { randomUUID } from "node:crypto"
import type { Store, ClientId, RateLimitResult, RateLimitConfig, RateLimitThreshold } from "./types"

export interface RateLimitInput {
  clientId: ClientId
  ipHash: string
  now: number
}

export const DEFAULT_THRESHOLDS: RateLimitThreshold[] = [
  { max: 4, windowMs: 10 * 1000, penaltyMs: 30 * 60 * 1000, label: "burst_10s" },
  { max: 4, windowMs: 60 * 60 * 1000, penaltyMs: 2 * 60 * 1000, label: "hourly_1h" },
  { max: 8, windowMs: 60 * 60 * 1000, penaltyMs: 90 * 60 * 1000, label: "hourly_8" },
  { max: 20, windowMs: 60 * 60 * 1000, penaltyMs: 24 * 60 * 60 * 1000, label: "hourly_20" },
]

export const DEFAULT_CONFIG: RateLimitConfig = {
  thresholds: DEFAULT_THRESHOLDS,
  maxPenaltyMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  escalationBase: 2,
}

function loadConfig(): RateLimitConfig {
  const thresholds = DEFAULT_THRESHOLDS.map((t) => ({ ...t }))
  return { ...DEFAULT_CONFIG, thresholds }
}

export class RateLimiter {
  private store: Store
  private config: RateLimitConfig

  constructor(store: Store, config?: Partial<RateLimitConfig>) {
    this.store = store
    this.config = { ...loadConfig(), ...config }
  }

  async checkAndRecord(input: RateLimitInput): Promise<RateLimitResult> {
    const { clientId, now } = input
    const block = await this.store.getBlock(`block:${clientId}`)
    let retryAfterMs: number | null = null
    if (block) {
      retryAfterMs = Math.max(0, block - now)
      return {
        allowed: false,
        limited: true,
        retryAfterMs,
        penaltyMs: null,
        violationLevel: 0,
        counts: {},
      }
    }

    const counts: Record<string, number> = {}
    const windowCounts = new Map<number, number>()
    for (const t of this.config.thresholds) {
      if (!windowCounts.has(t.windowMs)) {
        windowCounts.set(
          t.windowMs,
          await this.store.addHit(`hits:${clientId}:${t.windowMs}`, randomUUID(), now, t.windowMs)
        )
      }
      counts[t.label] = windowCounts.get(t.windowMs)!
    }

    const evaluated = this.config.thresholds.map((t) => ({ ...t, count: counts[t.label] }))
    const exceeded = evaluated.filter((h) => h.count >= h.max)
    if (exceeded.length === 0) {
      return { allowed: true, limited: false, retryAfterMs: null, penaltyMs: null, violationLevel: 0, counts }
    }

    // Apply the highest penalty when multiple thresholds are exceeded.
    const basePenalty = exceeded.reduce((max, h) => (h.penaltyMs > max ? h.penaltyMs : max), 0)

    const events = await this.store.getAbuseEvents(clientId, 10)
    const priorPenalties = events.filter((e) => e.type === "penalty").length
    const violationLevel = priorPenalties + 1

    let penaltyMs = basePenalty * Math.pow(this.config.escalationBase, violationLevel - 1)
    penaltyMs = Math.min(penaltyMs, this.config.maxPenaltyMs)

    const unblockAt = now + penaltyMs
    await this.store.setBlock(`block:${clientId}`, unblockAt, penaltyMs)

    return {
      allowed: false,
      limited: true,
      retryAfterMs: penaltyMs,
      penaltyMs,
      violationLevel,
      counts,
    }
  }

  async recordAccepted(clientId: ClientId, now: number): Promise<void> {
    // Separate counter for successfully accepted submissions (informational).
    await this.store.addHit(`accepted:${clientId}`, randomUUID(), now, 60 * 60 * 1000)
  }

  static configFromEnv(): RateLimitConfig {
    return {
      thresholds: [
        { max: 4, windowMs: 10 * 1000, penaltyMs: 30 * 60 * 1000, label: "burst_10s" },
        { max: 4, windowMs: 60 * 60 * 1000, penaltyMs: 2 * 60 * 1000, label: "hourly_1h" },
        { max: 8, windowMs: 60 * 60 * 1000, penaltyMs: 90 * 60 * 1000, label: "hourly_8" },
        { max: 20, windowMs: 60 * 60 * 1000, penaltyMs: 24 * 60 * 60 * 1000, label: "hourly_20" },
      ],
      maxPenaltyMs: Number(process.env.MAX_PENALTY_DURATION_MS) || DEFAULT_CONFIG.maxPenaltyMs,
      escalationBase: Number(process.env.PENALTY_ESCALATION_BASE) || DEFAULT_CONFIG.escalationBase,
    }
  }
}
