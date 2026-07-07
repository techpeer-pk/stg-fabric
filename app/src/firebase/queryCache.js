/**
 * Read-through cache for Firestore list queries.
 *
 * The post-login preloader warms this cache for every app segment, so pages
 * render instantly instead of showing per-page skeletons. Any write clears
 * the whole cache — the next read of each collection refetches fresh data.
 *
 * Entries also expire after TTL_MS so a terminal that sits idle doesn't keep
 * serving stale data written by another terminal.
 */

const TTL_MS = 5 * 60 * 1000

const cache = new Map()

const keyFor = (name, args) => `${name}:${JSON.stringify(args)}`

export const clearQueryCache = () => {
    cache.clear()
}

// ── In-flight tracking ───────────────────────────────────────────────────────
// Lets the post-login overlay hold until every cached read a page kicked off
// has settled, so it never reveals a page that is still fetching.
let inFlightReads = 0
const idleResolvers = []

const trackSettled = () => {
    inFlightReads--
    if (inFlightReads === 0) {
        while (idleResolvers.length) idleResolvers.shift()()
    }
}

export const whenReadsIdle = () =>
    inFlightReads === 0 ? Promise.resolve() : new Promise((resolve) => idleResolvers.push(resolve))

/**
 * Wrap a read function so identical calls (same name + args) within the TTL
 * share one Firestore fetch. In-flight promises are shared too, so the
 * preloader and a mounting page never issue duplicate queries.
 */
export const cachedRead = (name, fn) => {
    const wrapped = (...args) => {
        const key = keyFor(name, args)
        const hit = cache.get(key)
        if (hit && Date.now() - hit.at < TTL_MS) return hit.promise

        const promise = Promise.resolve(fn(...args)).catch((error) => {
            // Don't cache failures
            if (cache.get(key)?.promise === promise) cache.delete(key)
            throw error
        })
        inFlightReads++
        promise.then(trackSettled, trackSettled)
        cache.set(key, { promise, at: Date.now() })
        return promise
    }
    wrapped.__cacheWrapped = true
    return wrapped
}

/**
 * Wrap a write function so it clears the cache when it starts and again when
 * it settles (covers reads that resolved while the write was in flight).
 */
export const invalidating = (fn) => {
    const wrapped = (...args) => {
        clearQueryCache()
        return Promise.resolve(fn(...args)).finally(clearQueryCache)
    }
    wrapped.__cacheWrapped = true
    return wrapped
}
