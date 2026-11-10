export type ClientId = string

export interface RateLimitThreshold {
  max: number
  windowMs: number
  penaltyMs: number
  label: string
}

export interface RateLimitResult {
  allowed: boolean
  limited: boolean
  retryAfterMs: number | null
  penaltyMs: number | null
  violationLevel: number
  counts: Record<string, number>
}

export interface TurnstileVerification {
  success: boolean
  hostname?: string | null
  action?: string | null
  "error-codes"?: string[]
}

export interface IdempotencyRecord {
  key: string
  clientId: ClientId
  payloadHash: string
  status: "processing" | "completed" | "failed"
  response?: { status: number; body: unknown }
  createdAt: number
  updatedAt: number
}

export interface AbuseEvent {
  clientId: ClientId
  ipHash: string
  timestamp: number
  type: "rate_limit" | "turnstile" | "idempotency_conflict" | "validation" | "penalty"
  violationLevel: number
  penaltyMs?: number
  blockExpiresAt?: number
  turnstile?: "skipped" | "failed" | "passed"
  idempotency?: "hit" | "miss" | "conflict"
}

export interface Store {
  // sliding window hits
  addHit(key: string, member: string, now: number, windowMs: number): Promise<number>
  getHits(key: string, now: number, windowMs: number): Promise<number>
  // blocks / penalties
  getBlock(key: string): Promise<number | null>
  setBlock(key: string, unblockAt: number, ttlMs: number): Promise<void>
  delBlock(key: string): Promise<void>
  // idempotency
  getIdempotency(key: string): Promise<IdempotencyRecord | null>
  setIdempotency(key: string, record: IdempotencyRecord, ttlMs: number): Promise<boolean> // false if exists
  updateIdempotency(key: string, record: Partial<IdempotencyRecord>): Promise<void>
  delIdempotency(key: string): Promise<void>
  // used tokens (turnstile replay protection)
  getUsedToken(key: string): Promise<boolean>
  setUsedToken(key: string, ttlMs: number): Promise<boolean>
  // abuse events
  appendAbuse(event: AbuseEvent, ttlMs: number): Promise<void>
  getAbuseEvents(clientId: string, limit?: number): Promise<AbuseEvent[]>
  // messages (accepted submissions)
  appendMessage(message: { id: string; clientId: ClientId; payloadHash: string; createdAt: number }, ttlMs: number): Promise<void>
}

export interface RateLimitConfig {
  thresholds: RateLimitThreshold[]
  maxPenaltyMs: number
  escalationBase: number
}
