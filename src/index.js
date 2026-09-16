// @ts-check
import { getClientIp } from './ip.js';
import { determineResponseFormat } from './cli.js';
import { renderHtml } from './html.js';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Accept'
};

const NO_CACHE_HEADER = 'no-cache, no-store, must-revalidate';

export default {
	/**
	 * Cloudflare Worker / Pages fetch handler
	 * @param {Request} request
	 * @param {Record<string, unknown>} [env]
	 * @param {{ waitUntil: (promise: Promise<unknown>) => void }} [ctx]
	 * @returns {Promise<Response>}
	 */
	async fetch(request, env, ctx) {
		const isHead = request.method === 'HEAD';

		// CORS Preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: CORS_HEADERS
			});
		}

		// Only allow GET and HEAD
		if (request.method !== 'GET' && !isHead) {
			return new Response('Method Not Allowed', {
				status: 405,
				headers: {
					...CORS_HEADERS,
					Allow: 'GET, HEAD, OPTIONS'
				}
			});
		}

		const url = new URL(request.url);
		const { ip, version } = getClientIp(request);
		const format = determineResponseFormat(request, url);

		// JSON format (/api, ?format=json, or Accept: application/json)
		if (format === 'json') {
			const body = {
				ip,
				version,
				ipv4: version === 'IPv4' ? ip : null,
				ipv6: version === 'IPv6' ? ip : null
			};

			return new Response(isHead ? null : JSON.stringify(body, null, 2), {
				status: 200,
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json; charset=utf-8',
					'Cache-Control': NO_CACHE_HEADER
				}
			});
		}

		// Plain text format (curl, PowerShell irm, ?format=text)
		if (format === 'text') {
			return new Response(isHead ? null : `${ip}\n`, {
				status: 200,
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'text/plain; charset=utf-8',
					'Cache-Control': NO_CACHE_HEADER
				}
			});
		}

		// Default: Web UI (HTML)
		const html = renderHtml({ ip, version });
		return new Response(isHead ? null : html, {
			status: 200,
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
				'Cache-Control': 'private, no-cache, no-store, must-revalidate'
			}
		});
	}
};
