// @ts-check
import assert from 'node:assert/strict';
import { isValidIpv4, isValidIpv6, isPrivateIp, getClientIp } from '../src/ip.js';
import { isCliUserAgent, determineResponseFormat } from '../src/cli.js';

console.log('--- [org.elclark.id] Unit Tests: IP & CLI ---');

// 1. isValidIpv4 tests
assert.equal(isValidIpv4('125.162.193.154'), true, 'Valid IPv4');
assert.equal(isValidIpv4('127.0.0.1'), true, 'Valid loopback IPv4');
assert.equal(isValidIpv4('0.0.0.0'), true, 'Valid 0.0.0.0');
assert.equal(isValidIpv4('255.255.255.255'), true, 'Valid 255.255.255.255');
assert.equal(isValidIpv4('256.0.0.1'), false, 'Out of range octet');
assert.equal(isValidIpv4('1.2.3'), false, 'Incomplete IPv4');
assert.equal(isValidIpv4('1.2.3.4.5'), false, 'Too many octets');
assert.equal(isValidIpv4('01.02.03.04'), false, 'Leading zeros rejected');
assert.equal(isValidIpv4('abc.def.ghi.jkl'), false, 'Non-numeric IPv4');
assert.equal(isValidIpv4(''), false, 'Empty string IPv4');
assert.equal(isValidIpv4(null), false, 'Null IPv4');
assert.equal(isValidIpv4(undefined), false, 'Undefined IPv4');
console.log('✔ isValidIpv4 tests passed');

// 2. isValidIpv6 tests
assert.equal(isValidIpv6('2001:448a:7070:dd94:8963:dd88:a6d5:acae'), true, 'Valid full IPv6');
assert.equal(isValidIpv6('::1'), true, 'Valid loopback IPv6');
assert.equal(isValidIpv6('::'), true, 'Valid unspecified IPv6');
assert.equal(isValidIpv6('2606:4700:4700::1111'), true, 'Valid compressed IPv6');
assert.equal(isValidIpv6('fe80::1'), true, 'Valid link-local IPv6');
assert.equal(isValidIpv6('1:2:3:4:5:6:7:8'), true, 'Valid 8-group IPv6');
assert.equal(isValidIpv6('::ffff:192.0.2.1'), true, 'Valid IPv4-mapped IPv6');
assert.equal(isValidIpv6('127.0.0.1'), false, 'IPv4 is not IPv6');
assert.equal(isValidIpv6('hello:world'), false, 'Non-hex chars in IPv6');
assert.equal(isValidIpv6(''), false, 'Empty IPv6');
assert.equal(isValidIpv6(null), false, 'Null IPv6');
assert.equal(isValidIpv6(':::'), false, 'Triple colon rejected');
assert.equal(isValidIpv6(':::::'), false, 'Multiple colons rejected');
assert.equal(isValidIpv6('12345::1'), false, '5-digit hex group rejected');
assert.equal(isValidIpv6('1:2:3:4:5:6:7:8:9'), false, 'Too many groups without compression rejected');
assert.equal(isValidIpv6('2001::1::2'), false, 'Multiple double-colons rejected');
assert.equal(isValidIpv6(':1'), false, 'Leading single colon rejected');
assert.equal(isValidIpv6('1:'), false, 'Trailing single colon rejected');
console.log('✔ isValidIpv6 tests passed');

// 3. isPrivateIp tests
assert.equal(isPrivateIp('127.0.0.1'), true, '127.0.0.1 is private/loopback');
assert.equal(isPrivateIp('127.0.0.2'), true, '127.0.0.2 is private/loopback');
assert.equal(isPrivateIp('127.255.255.254'), true, '127.x is private/loopback');
assert.equal(isPrivateIp('0.0.0.0'), true, '0.0.0.0 is private/current network');
assert.equal(isPrivateIp('::1'), true, '::1 is private/loopback');
assert.equal(isPrivateIp('::0001'), true, '::0001 is loopback');
assert.equal(isPrivateIp('0:0:0:0:0:0:0:1'), true, '0:0:0:0:0:0:0:1 is loopback');
assert.equal(isPrivateIp('0::1'), true, '0::1 is loopback');
assert.equal(isPrivateIp('0:0:0:0:0:0:0:0'), true, '0:0:0:0:0:0:0:0 is unspecified/private');
assert.equal(isPrivateIp('::'), true, ':: is unspecified/private');
assert.equal(isPrivateIp('10.0.0.1'), true, '10.0.0.1 is RFC 1918');
assert.equal(isPrivateIp('192.168.1.1'), true, '192.168.1.1 is RFC 1918');
assert.equal(isPrivateIp('172.16.0.1'), true, '172.16.0.1 is RFC 1918');
assert.equal(isPrivateIp('172.31.255.255'), true, '172.31.255.255 is RFC 1918');
assert.equal(isPrivateIp('172.32.0.1'), false, '172.32.0.1 is public');
assert.equal(isPrivateIp('169.254.1.1'), true, '169.254.1.1 is Link-Local RFC 3927');
assert.equal(isPrivateIp('100.64.0.1'), true, '100.64.0.1 is CGNAT RFC 6598');
assert.equal(isPrivateIp('100.127.255.255'), true, '100.127.255.255 is CGNAT RFC 6598');
assert.equal(isPrivateIp('100.128.0.1'), false, '100.128.0.1 is not CGNAT');
assert.equal(isPrivateIp('fc00::1'), true, 'fc00:: is unique local RFC 4193');
assert.equal(isPrivateIp('fd00::1'), true, 'fd00:: is unique local RFC 4193');
assert.equal(isPrivateIp('fe80::1'), true, 'fe80:: is link local RFC 4291');
assert.equal(isPrivateIp('125.162.193.154'), false, 'Public IPv4 is not private');
assert.equal(isPrivateIp('2001:448a:7070::1'), false, 'Public IPv6 is not private');
console.log('✔ isPrivateIp tests passed');

// 4. getClientIp tests
{
	// CF-Connecting-IP priority (org.elclark.id)
	const reqCf = new Request('https://org.elclark.id', {
		headers: {
			'cf-connecting-ip': '203.0.113.195',
			'x-forwarded-for': '198.51.100.1'
		}
	});
	assert.deepEqual(getClientIp(reqCf), { ip: '203.0.113.195', version: 'IPv4' });

	// IPv6
	const reqCf6 = new Request('https://org.elclark.id', {
		headers: { 'cf-connecting-ip': '2001:db8:85a3::8a2e:370:7334' }
	});
	assert.deepEqual(getClientIp(reqCf6), { ip: '2001:db8:85a3::8a2e:370:7334', version: 'IPv6' });

	// X-Real-IP fallback
	const reqReal = new Request('https://org.elclark.id', {
		headers: { 'x-real-ip': '198.51.100.22' }
	});
	assert.deepEqual(getClientIp(reqReal), { ip: '198.51.100.22', version: 'IPv4' });

	// X-Forwarded-For multi-hop
	const reqFwd = new Request('https://org.elclark.id', {
		headers: { 'x-forwarded-for': '  203.0.113.50 , 10.0.0.1, 10.0.0.2 ' }
	});
	assert.deepEqual(getClientIp(reqFwd), { ip: '203.0.113.50', version: 'IPv4' });

	// IPv4 with port stripping
	const reqV4Port = new Request('https://org.elclark.id', {
		headers: { 'cf-connecting-ip': '203.0.113.50:43210' }
	});
	assert.deepEqual(getClientIp(reqV4Port), { ip: '203.0.113.50', version: 'IPv4' });

	// Bracketed IPv6 with and without port
	const reqBracket = new Request('https://org.elclark.id', {
		headers: { 'cf-connecting-ip': '[2001:db8::1]' }
	});
	assert.deepEqual(getClientIp(reqBracket), { ip: '2001:db8::1', version: 'IPv6' });

	const reqBracketPort = new Request('https://org.elclark.id', {
		headers: { 'cf-connecting-ip': '[2001:db8::1]:8443' }
	});
	assert.deepEqual(getClientIp(reqBracketPort), { ip: '2001:db8::1', version: 'IPv6' });

	// IPv4-mapped IPv6 normalization (lowercase)
	const reqMapped = new Request('https://org.elclark.id', {
		headers: { 'cf-connecting-ip': '::ffff:203.0.113.88' }
	});
	assert.deepEqual(getClientIp(reqMapped), { ip: '203.0.113.88', version: 'IPv4' });

	// IPv4-mapped IPv6 normalization (uppercase ::FFFF:)
	const reqMappedUpper = new Request('https://org.elclark.id', {
		headers: { 'cf-connecting-ip': '::FFFF:203.0.113.88' }
	});
	assert.deepEqual(getClientIp(reqMappedUpper), { ip: '203.0.113.88', version: 'IPv4' });

	// Bracketed uppercase IPv4-mapped IPv6 with port
	const reqMappedBracket = new Request('https://org.elclark.id', {
		headers: { 'cf-connecting-ip': '[::FFFF:203.0.113.88]:8080' }
	});
	assert.deepEqual(getClientIp(reqMappedBracket), { ip: '203.0.113.88', version: 'IPv4' });

	// Fallback when no headers present
	const reqEmpty = new Request('https://org.elclark.id');
	assert.deepEqual(getClientIp(reqEmpty), { ip: '127.0.0.1', version: 'IPv4' });

	console.log('✔ getClientIp tests passed');
}

// 5. CLI User-Agent detection tests
{
	const cliList = [
		'curl/7.68.0',
		'curl/8.4.0',
		'Wget/1.21.2',
		'HTTPie/3.2.1',
		'libcurl-agent/1.0',
		'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9444',
		'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.6',
		'Python-requests/2.28.1',
		'Python-urllib/3.11',
		'Go-http-client/1.1',
		'reqwest/0.11.14',
		'axios/1.6.0',
		'node-fetch/3.3.0',
		'undici',
		'Bun/1.0.0',
		'Deno/1.37.0'
	];

	for (const ua of cliList) {
		assert.equal(isCliUserAgent(ua), true, `Must detect CLI for ${ua}`);
	}

	const browserUAs = [
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
		'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0'
	];

	for (const ua of browserUAs) {
		assert.equal(isCliUserAgent(ua), false, `Must NOT detect CLI for browser ${ua}`);
	}

	assert.equal(isCliUserAgent(''), false, 'Empty UA is not CLI');
	assert.equal(isCliUserAgent(null), false, 'Null UA is not CLI');
	assert.equal(isCliUserAgent(undefined), false, 'Undefined UA is not CLI');
	assert.equal(isCliUserAgent('CURL/8.4.0'), true, 'Case insensitive CLI detection');
	console.log('✔ CLI User-Agent detection tests passed');
}

// 6. User-Agent and format negotiation tests
{
	// CLI defaults to text
	const reqCurl = new Request('https://org.elclark.id', {
		headers: { 'user-agent': 'curl/8.4.0', accept: '*/*' }
	});
	assert.equal(determineResponseFormat(reqCurl, new URL(reqCurl.url)), 'text');

	// PowerShell defaults to text
	const reqPs = new Request('https://org.elclark.id', {
		headers: {
			'user-agent': 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9444',
			accept: '*/*'
		}
	});
	assert.equal(determineResponseFormat(reqPs, new URL(reqPs.url)), 'text');

	// Browser defaults to html
	const reqBrowser = new Request('https://org.elclark.id', {
		headers: {
			'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
			accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
		}
	});
	assert.equal(determineResponseFormat(reqBrowser, new URL(reqBrowser.url)), 'html');

	// /api path returns json
	const reqApi = new Request('https://org.elclark.id/api');
	assert.equal(determineResponseFormat(reqApi, new URL(reqApi.url)), 'json');

	// /ip.json returns json
	const reqIpJson = new Request('https://org.elclark.id/ip.json');
	assert.equal(determineResponseFormat(reqIpJson, new URL(reqIpJson.url)), 'json');

	// /json returns json
	const reqJson = new Request('https://org.elclark.id/json');
	assert.equal(determineResponseFormat(reqJson, new URL(reqJson.url)), 'json');

	// /ip returns text even for browser
	const reqIpPath = new Request('https://org.elclark.id/ip', {
		headers: { accept: 'text/html' }
	});
	assert.equal(determineResponseFormat(reqIpPath, new URL(reqIpPath.url)), 'text');

	// /raw returns text even for browser
	const reqRawPath = new Request('https://org.elclark.id/raw', {
		headers: { accept: 'text/html' }
	});
	assert.equal(determineResponseFormat(reqRawPath, new URL(reqRawPath.url)), 'text');

	// ?format=json returns json
	const reqQueryJson = new Request('https://org.elclark.id?format=json', {
		headers: { 'user-agent': 'curl/8.4.0' }
	});
	assert.equal(determineResponseFormat(reqQueryJson, new URL(reqQueryJson.url)), 'json');

	// ?format=text returns text even for browser
	const reqQueryText = new Request('https://org.elclark.id?format=text', {
		headers: {
			'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
			accept: 'text/html'
		}
	});
	assert.equal(determineResponseFormat(reqQueryText, new URL(reqQueryText.url)), 'text');

	// Accept: application/json returns json
	const reqAcceptJson = new Request('https://org.elclark.id', {
		headers: { accept: 'application/json' }
	});
	assert.equal(determineResponseFormat(reqAcceptJson, new URL(reqAcceptJson.url)), 'json');

	console.log('✔ Response format negotiation tests passed');
}

console.log('All Unit Tests passed successfully!');
