// @ts-check
/**
 * CLI detection and format negotiation.
 */

const CLI_UA_REGEX =
	/(curl|wget|httpie|libcurl|powershell|windowspowershell|aiohttp|python-requests|python-urllib|go-http-client|reqwest|axios|node-fetch|undici|bun\/|deno\/)/i;

/**
 * Determines whether a User-Agent represents a command-line tool, script, or developer utility.
 * @param {string | null | undefined} [userAgent]
 * @returns {boolean}
 */
export function isCliUserAgent(userAgent) {
	if (!userAgent || typeof userAgent !== 'string') return false;
	return CLI_UA_REGEX.test(userAgent);
}

/**
 * Evaluates the request URL and headers to determine if JSON, plain text, or HTML should be returned.
 * @param {Request} request
 * @param {URL} url
 * @returns {'json' | 'text' | 'html'}
 */
export function determineResponseFormat(request, url) {
	const pathname = url.pathname;
	const format = url.searchParams.get('format')?.toLowerCase();
	const hasJsonFlag = url.searchParams.has('json');
	const hasTextFlag = url.searchParams.has('text');
	const accept = (request.headers.get('accept') || '').toLowerCase();
	const userAgent = request.headers.get('user-agent') || '';

	// Explicit /api or /ip.json or /json or query params
	if (
		pathname === '/api' ||
		pathname === '/api/' ||
		pathname === '/ip.json' ||
		pathname === '/json' ||
		format === 'json' ||
		hasJsonFlag
	) {
		return 'json';
	}

	// Explicit text endpoints (/ip, /raw) or text flag
	if (
		pathname === '/ip' ||
		pathname === '/raw' ||
		format === 'text' ||
		hasTextFlag
	) {
		return 'text';
	}

	// Content negotiation via Accept header
	const acceptsHtml = accept.includes('text/html');
	const acceptsJson = accept.includes('application/json');
	const acceptsText = accept.includes('text/plain');

	if (acceptsJson && !acceptsHtml) {
		return 'json';
	}

	if (acceptsText && !acceptsHtml) {
		return 'text';
	}

	// CLI User-Agents (curl, irm PowerShell, etc.) get plain text by default unless they explicitly request HTML
	if (isCliUserAgent(userAgent) && !acceptsHtml) {
		return 'text';
	}

	// Default to Web UI HTML
	return 'html';
}
