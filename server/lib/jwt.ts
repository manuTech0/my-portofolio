import { createSecretKey } from "node:crypto"
import { SignJWT, jwtVerify, type JWTPayload } from "jose"

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured")
}
const secret = createSecretKey(new TextEncoder().encode(JWT_SECRET))

export interface SessionPayload extends JWTPayload {
  sub: string
  ipHash?: string
  issuedAt?: number
}

export async function signSession(sub: string, ttlSeconds: number, ipHash?: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ sub, ...(ipHash ? { ipHash } : {}) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(secret)
}

export async function verifySession(token: string, ipHash?: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    })
    const session = payload as SessionPayload
    if (ipHash && session.ipHash && session.ipHash !== ipHash) {
      return null
    }
    return session
  } catch {
    return null
  }
}

export function extractBearerToken(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization
  if (typeof auth !== "string") return null
  const match = auth.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

export const SESSION_TTL_SECONDS = 60 * 60 // 1 hour
