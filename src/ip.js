// @ts-check
/**
 * Pure, isomorphic IP utilities for org.elclark.id.
 */

/**
 * Validates whether a string is a valid IPv4 address.
 * @param {string | null | undefined} [ip]
 * @returns {boolean}
 */
export function isValidIpv4(ip) {
	if (!ip || typeof ip !== 'string') return false;
	const parts = ip.trim().split('.');
	if (parts.length !== 4) return false;
	return parts.every((part) => {
		if (!/^\d{1,3}$/.test(part)) return false;
		const num = Number(part);
		return num >= 0 && num <= 255 && String(num) === part;
	});
}

/**
 * Validates whether a string is a valid IPv6 address.
 * Conforms to RFC 4291 / RFC 5952 format specifications.
 * @param {string | null | undefined} [ip]
 * @returns {boolean}
 */
export function isValidIpv6(ip) {
	if (!ip || typeof ip !== 'string') return false;
	const trimmed = ip.trim();
	if (!trimmed.includes(':') || trimmed.includes(':::')) return false;

	// Check double-colon compression (at most one allowed)
	const doubleColonMatches = trimmed.match(/::/g);
	if (doubleColonMatches && doubleColonMatches.length > 1) return false;

	// Colons at boundaries must be part of ::
	if (trimmed.startsWith(':') && !trimmed.startsWith('::')) return false;
	if (trimmed.endsWith(':') && !trimmed.endsWith('::')) return false;

	// Handle potential IPv4-mapped IPv6 suffix e.g. ::ffff:192.0.2.1
	if (trimmed.includes('.')) {
		const lastColon = trimmed.lastIndexOf(':');
		const v4Part = trimmed.slice(lastColon + 1);
		if (!isValidIpv4(v4Part)) return false;
		const v6Part = trimmed.slice(0, lastColon);
		if (!v6Part) return false;
		const v6Parts = v6Part.split(':').filter((p) => p !== '');
		if (doubleColonMatches) {
			if (v6Parts.length >= 7) return false;
		} else {
			if (v6Parts.length !== 6) return false;
		}
		return v6Parts.every((seg) => /^[0-9a-fA-F]{1,4}$/.test(seg));
	}

	const parts = trimmed.split(':');
	const segments = parts.filter((p) => p !== '');

	if (doubleColonMatches) {
		if (segments.length >= 8) return false;
	} else {
		if (segments.length !== 8) return false;
	}

	return segments.every((seg) => /^[0-9a-fA-F]{1,4}$/.test(seg));
}

/**
 * Determines whether an IP is a private, loopback, link-local, or local address.
 * Covers RFC 1918, RFC 3927, RFC 4193, RFC 4291, RFC 6598.
 * @param {string | null | undefined} [ip]
 * @returns {boolean}
 */
export function isPrivateIp(ip) {
	if (!ip || typeof ip !== 'string') return false;
	const trimmed = ip.trim().toLowerCase();

	if (
		trimmed === 'localhost' ||
		trimmed === '::' ||
		trimmed === '::1' ||
		/^0*(:0*){7}1$/.test(trimmed) ||
		/^::0*1$/.test(trimmed) ||
		/^0*::1$/.test(trimmed) ||
		/^0*(:0*){7}0$/.test(trimmed)
	) {
		return true;
	}

	// IPv4 Loopback (127.0.0.0/8) and Current Network (0.0.0.0/8)
	if (/^(127|0)\./.test(trimmed)) {
		return true;
	}

	// IPv4 RFC 1918 Private: 10.0.0.0/8, 192.168.0.0/16
	if (trimmed.startsWith('10.') || trimmed.startsWith('192.168.')) {
		return true;
	}

	// IPv4 RFC 1918 Private: 172.16.0.0 - 172.31.255.255
	if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(trimmed)) {
		return true;
	}

	// IPv4 Link-Local (RFC 3927): 169.254.0.0/16
	if (trimmed.startsWith('169.254.')) {
		return true;
	}

	// IPv4 Carrier-Grade NAT (RFC 6598): 100.64.0.0/10 (100.64.0.0 - 100.127.255.255)
	if (/^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./.test(trimmed)) {
		return true;
	}

	// IPv6 Unique Local (RFC 4193): fc00::/7 (covers fc00::/8 and fd00::/8)
	if (/^f[cd][0-9a-f]{2}:/i.test(trimmed)) {
		return true;
	}

	// IPv6 Link-Local (RFC 4291): fe80::/10 (fe80:: - febf::)
	if (/^fe[89ab][0-9a-f]:/i.test(trimmed)) {
		return true;
	}

	return false;
}

/**
 * Extracts and normalizes client IP and IP version from a request.
 * Compatible with Cloudflare Workers/Pages (CF-Connecting-IP), standard reverse proxies, and local development.
 * Correctly strips ports and brackets from IPv4 and IPv6 addresses.
 *
 * @param {Request} request
 * @param {string} [fallbackIp='127.0.0.1']
 * @returns {{ ip: string, version: 'IPv4' | 'IPv6' }}
 */
export function getClientIp(request, fallbackIp = '127.0.0.1') {
	const headers = request.headers;
	let rawIp =
		headers.get('cf-connecting-ip') ||
		headers.get('x-real-ip') ||
		headers.get('x-forwarded-for')?.split(',')[0].trim() ||
		fallbackIp;

	let ip = rawIp.trim();

	// Handle bracketed IPv6 addresses with optional port, e.g. [2001:db8::1]:8080 or [2001:db8::1]
	if (ip.startsWith('[') && ip.includes(']')) {
		const closingIdx = ip.indexOf(']');
		ip = ip.slice(1, closingIdx);
	}

	// Normalize IPv4-mapped IPv6 address (e.g. ::ffff:192.0.2.1 or ::FFFF:192.0.2.1)
	if (ip.toLowerCase().startsWith('::ffff:')) {
		ip = ip.slice(7);
	}

	// Remove port from IPv4 if present (e.g. 192.0.2.1:12345)
	if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(ip)) {
		ip = ip.split(':')[0];
	}

	const version = ip.includes(':') ? 'IPv6' : 'IPv4';

	return { ip, version };
}
