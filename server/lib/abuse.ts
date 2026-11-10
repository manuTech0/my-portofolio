import type { Store, AbuseEvent, ClientId } from "./types"

export class AbuseTracker {
  private store: Store
  private abuseTtlMs: number

  constructor(store: Store, abuseTtlMs: number) {
    this.store = store
    this.abuseTtlMs = abuseTtlMs
  }

  async log(event: Omit<AbuseEvent, "timestamp"> & { timestamp?: number }): Promise<void> {
    await this.store.appendAbuse(
      {
        ...event,
        timestamp: event.timestamp ?? Date.now(),
      },
      this.abuseTtlMs
    )
  }

  async penaltyEvent(params: {
    clientId: ClientId
    ipHash: string
    violationLevel: number
    penaltyMs: number
    blockExpiresAt: number
    turnstile?: AbuseEvent["turnstile"]
    idempotency?: AbuseEvent["idempotency"]
  }): Promise<void> {
    await this.log({
      clientId: params.clientId,
      ipHash: params.ipHash,
      type: "penalty",
      violationLevel: params.violationLevel,
      penaltyMs: params.penaltyMs,
      blockExpiresAt: params.blockExpiresAt,
      turnstile: params.turnstile,
      idempotency: params.idempotency,
    })
  }

  async rateLimitRejected(params: {
    clientId: ClientId
    ipHash: string
    violationLevel: number
    turnstile?: AbuseEvent["turnstile"]
    idempotency?: AbuseEvent["idempotency"]
  }): Promise<void> {
    await this.log({
      clientId: params.clientId,
      ipHash: params.ipHash,
      type: "rate_limit",
      violationLevel: params.violationLevel,
      turnstile: params.turnstile,
      idempotency: params.idempotency,
    })
  }

  async turnstileFailed(params: { clientId: ClientId; ipHash: string; violationLevel: number }): Promise<void> {
    await this.log({
      clientId: params.clientId,
      ipHash: params.ipHash,
      type: "turnstile",
      violationLevel: params.violationLevel,
      turnstile: "failed",
    })
  }

  async idempotencyConflict(params: { clientId: ClientId; ipHash: string; violationLevel: number }): Promise<void> {
    await this.log({
      clientId: params.clientId,
      ipHash: params.ipHash,
      type: "idempotency_conflict",
      violationLevel: params.violationLevel,
    })
  }

  async getEvents(clientId: ClientId, limit = 50): Promise<AbuseEvent[]> {
    return this.store.getAbuseEvents(clientId, limit)
  }
}
