import type { CacheHandlerValue, Handler } from '../cache-handler';

export type ServerCacheHandlerOptions = {
    /**
     * The base URL of the cache store server.
     *
     * @since 1.0.0
     */
    baseUrl: URL | string;
    /**
     * Timeout in milliseconds for remote cache store operations.
     *
     * @since 1.0.0
     */
    timeoutMs?: number;
};

/**
 * Creates a server-based Handler to use with the `@neshca/server` package.
 *
 * This function initializes a Handler for managing cache operations via a server.
 * It includes methods to get, set, and manage cache values and revalidated tags,
 * leveraging server-side storage.
 *
 * @deprecated This Handler is deprecated since @neshca/cache-handler version 1.7.0 and will be removed in the next major release.
 *
 * @param options - The configuration options for the server Handler. See {@link ServerCacheHandlerOptions}.
 *
 * @returns An object representing the cache, with methods for cache operations.
 *
 * @example
 * ```js
 * const serverHandler = createHandler({
 *   baseUrl: 'http://localhost:8080/',
 * });
 * ```
 *
 * @remarks
 * - the `get` method retrieves a value from the server cache. If the server response has status 404, it returns `null`.
 * - the `set` method allows setting a value in the server cache.
 * - the `revalidateTag` methods are used for handling tag-based cache revalidation.
 */
export default function createHandler({ baseUrl, timeoutMs }: ServerCacheHandlerOptions): Handler {
    return {
        name: 'server',
        async get(key, { implicitTags }) {
            const url = new URL('/get', baseUrl);

            url.searchParams.set('key', key);
            url.searchParams.set('implicitTags', JSON.stringify(implicitTags));

            const response = await fetch(url, {
                signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
                // @ts-expect-error -- act as an internal fetch call
                next: {
                    internal: true,
                },
            });

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error(`get error: ${response.status}`);
            }

            const string = await response.text();

            return JSON.parse(string) as CacheHandlerValue;
        },
        async set(key, cacheHandlerValue) {
            const url = new URL('/set', baseUrl);

            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify([key, JSON.stringify(cacheHandlerValue)]),
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
                // @ts-expect-error -- act as an internal fetch call
                next: {
                    internal: true,
                },
            });

            if (!response.ok) {
                throw new Error(`set error: ${response.status}`);
            }
        },
        async revalidateTag(tag) {
            const url = new URL('/revalidateTag', baseUrl);

            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify([tag]),
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
                // @ts-expect-error -- act as an internal fetch call
                next: {
                    internal: true,
                },
            });

            if (!response.ok) {
                throw new Error(`revalidateTag error: ${response.status}`);
            }
        },
        async delete(key) {
            const url = new URL(`/${key}`, baseUrl);

            const response = await fetch(url, {
                method: 'DELETE',
                // @ts-expect-error -- act as an internal fetch call
                next: {
                    internal: true,
                },
            });

            if (!response.ok) {
                throw new Error(`delete error: ${response.status}`);
            }
        },
    };
}
