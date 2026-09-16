// @ts-check
import { isValidIpv4, isValidIpv6 } from './ip.js';

export const IPV4_PROBE_ENDPOINTS = ['https://ipv4.icanhazip.com'];
export const IPV6_PROBE_ENDPOINTS = ['https://ipv6.icanhazip.com'];

/**
 * @typedef {Response | { ok: boolean, status?: number, text: () => Promise<string> }} ProbeResponse
 * @typedef {(url: string, init?: RequestInit) => Promise<ProbeResponse>} FetchFn
 */

/**
 * Fetch an IP with an explicit abort timeout and optional external abort signal.
 * Ensures timeout covers the complete operation including streaming the response body.
 * @param {string} url
 * @param {number} [timeoutMs=3500]
 * @param {FetchFn} [customFetch=fetch]
 * @param {AbortSignal | null} [externalSignal=null]
 * @returns {Promise<string|null>}
 */
export async function fetchWithTimeout(
	url,
	timeoutMs = 3500,
	customFetch = fetch,
	externalSignal = null
) {
	if (externalSignal?.aborted) return null;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	/** @type {(() => void) | null} */
	let onAbort = null;
	if (externalSignal) {
		onAbort = () => controller.abort();
		externalSignal.addEventListener('abort', onAbort, { once: true });
	}

	try {
		const res = await customFetch(url, {
			signal: controller.signal,
			cache: 'no-store'
		});
		if (!res || !res.ok) return null;

		const textPromise = res.text();
		// Prevent unhandled promise rejection if aborted early while stream is pending
		textPromise.catch(() => {});

		const text = await new Promise((resolve, reject) => {
			if (controller.signal.aborted) {
				return reject(new Error('Aborted'));
			}
			const handleAbort = () => reject(new Error('Aborted'));
			controller.signal.addEventListener('abort', handleAbort, { once: true });
			textPromise.then(
				(val) => {
					controller.signal.removeEventListener('abort', handleAbort);
					resolve(val);
				},
				(err) => {
					controller.signal.removeEventListener('abort', handleAbort);
					reject(err);
				}
			);
		});

		return typeof text === 'string' ? text.trim() : null;
	} catch {
		return null;
	} finally {
		clearTimeout(timeoutId);
		if (externalSignal && onAbort) {
			externalSignal.removeEventListener('abort', onAbort);
		}
	}
}

/**
 * Probes for IPv4 connectivity using single-stack IPv4-only public endpoints with fallback.
 * Bounded by a strict cumulative deadline across all endpoints.
 * @param {number} [timeoutMs=3500]
 * @param {FetchFn} [customFetch=fetch]
 * @param {AbortSignal | null} [signal=null]
 * @returns {Promise<string|null>} Valid IPv4 address or null if unreachable
 */
export async function probeIpv4(timeoutMs = 3500, customFetch = fetch, signal = null) {
	if (signal?.aborted) return null;
	const deadline = Date.now() + timeoutMs;

	for (const endpoint of IPV4_PROBE_ENDPOINTS) {
		if (signal?.aborted) return null;
		const remainingMs = deadline - Date.now();
		if (remainingMs <= 0) break;

		const result = await fetchWithTimeout(endpoint, remainingMs, customFetch, signal);
		if (result && isValidIpv4(result)) {
			return result;
		}
	}
	return null;
}

/**
 * Probes for IPv6 connectivity using single-stack IPv6-only public endpoints with fallback.
 * Bounded by a strict cumulative deadline across all endpoints.
 * @param {number} [timeoutMs=3500]
 * @param {FetchFn} [customFetch=fetch]
 * @param {AbortSignal | null} [signal=null]
 * @returns {Promise<string|null>} Valid IPv6 address or null if unreachable
 */
export async function probeIpv6(timeoutMs = 3500, customFetch = fetch, signal = null) {
	if (signal?.aborted) return null;
	const deadline = Date.now() + timeoutMs;

	for (const endpoint of IPV6_PROBE_ENDPOINTS) {
		if (signal?.aborted) return null;
		const remainingMs = deadline - Date.now();
		if (remainingMs <= 0) break;

		const result = await fetchWithTimeout(endpoint, remainingMs, customFetch, signal);
		if (result && isValidIpv6(result)) {
			return result;
		}
	}
	return null;
}
