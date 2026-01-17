/**
 * Rate Limiter Utility
 * Simple in-memory rate limiter for API endpoints
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class RateLimiter {
    private store: Map<string, RateLimitEntry> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Clean up expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            const entries = Array.from(this.store.entries());
            for (const [key, entry] of entries) {
                if (now > entry.resetTime) {
                    this.store.delete(key);
                }
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Check if request is within rate limit
     * @param identifier - Unique identifier (e.g., IP address)
     * @param limit - Maximum requests allowed
     * @param windowMs - Time window in milliseconds
     * @returns Object with allowed status and rate limit info
     */
    check(
        identifier: string,
        limit: number = 10,
        windowMs: number = 60 * 1000 // 1 minute default
    ): {
        allowed: boolean;
        remaining: number;
        resetTime: number;
        retryAfter?: number;
    } {
        const now = Date.now();
        const entry = this.store.get(identifier);

        if (!entry || now > entry.resetTime) {
            // New window - allow request
            const resetTime = now + windowMs;
            this.store.set(identifier, {
                count: 1,
                resetTime,
            });

            return {
                allowed: true,
                remaining: limit - 1,
                resetTime,
            };
        }

        // Within existing window
        if (entry.count >= limit) {
            // Rate limit exceeded
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime,
                retryAfter: Math.ceil((entry.resetTime - now) / 1000),
            };
        }

        // Increment count and allow
        entry.count++;
        this.store.set(identifier, entry);

        return {
            allowed: true,
            remaining: limit - entry.count,
            resetTime: entry.resetTime,
        };
    }

    /**
     * Reset rate limit for a specific identifier
     */
    reset(identifier: string): void {
        this.store.delete(identifier);
    }

    /**
     * Clear all rate limit data
     */
    clear(): void {
        this.store.clear();
    }

    /**
     * Clean up interval on shutdown
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.clear();
    }
}

// Singleton instance
const rateLimiter = new RateLimiter();

export default rateLimiter;

/**
 * Get client IP address from request headers
 */
export function getClientIp(request: Request): string {
    // Check common headers for real IP (when behind proxy)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback to 'unknown' for local development
    return 'unknown';
}
