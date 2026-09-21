import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

const redis = url && token ? new Redis({ url, token }) : null

const reportLimiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "10 m"), prefix: "baha:reports" }) : null
const sosLimiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "10 m"), prefix: "baha:sos" }) : null

export const checkRateLimit = async (kind: "report" | "sos", identifier: string) => {
  const limiter = kind === "report" ? reportLimiter : sosLimiter
  if (!limiter) return { success: true, remaining: 1 }
  return limiter.limit(identifier)
}
