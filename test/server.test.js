// @ts-check
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { startServer } from '../server.js';

console.log('--- [org.elclark.id] Server & Integration Tests ---');

// 1. Direct worker.fetch tests
{
	// 1a. CLI curl request via primary domain
	const reqCurl = new Request('https://org.elclark.id', {
		headers: {
			'user-agent': 'curl/8.4.0',
			'cf-connecting-ip': '203.0.113.88'
		}
	});
	const resCurl = await worker.fetch(reqCurl);
	assert.equal(resCurl.status, 200);
	assert.equal(resCurl.headers.get('content-type'), 'text/plain; charset=utf-8');
	assert.equal(resCurl.headers.get('access-control-allow-origin'), '*');
	assert.equal(resCurl.headers.get('cache-control'), 'no-cache, no-store, must-revalidate');
	assert.equal(await resCurl.text(), '203.0.113.88\n');
	console.log('✔ Direct Test 1: curl gets plain text IP with newline via org.elclark.id');

	// 1b. PowerShell 5.1 request
	const reqPs5 = new Request('https://org.elclark.id', {
		headers: {
			'user-agent':
				'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9444',
			'cf-connecting-ip': '203.0.113.88'
		}
	});
	const resPs5 = await worker.fetch(reqPs5);
	assert.equal(resPs5.status, 200);
	assert.equal(resPs5.headers.get('content-type'), 'text/plain; charset=utf-8');
	assert.equal(await resPs5.text(), '203.0.113.88\n');
	console.log('✔ Direct Test 2: Windows PowerShell 5.1 gets plain text IP');

	// 1c. PowerShell 7 (pwsh) request
	const reqPs7 = new Request('https://org.elclark.id', {
		headers: {
			'user-agent':
				'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26200; en-ID) PowerShell/7.6.6',
			'cf-connecting-ip': '203.0.113.88'
		}
	});
	const resPs7 = await worker.fetch(reqPs7);
	assert.equal(resPs7.status, 200);
	assert.equal(await resPs7.text(), '203.0.113.88\n');
	console.log('✔ Direct Test 3: PowerShell 7 gets plain text IP');

	// 1d. IPv6 CLI request
	const reqV6 = new Request('https://org.elclark.id', {
		headers: {
			'user-agent': 'curl/8.4.0',
			'cf-connecting-ip': '2001:db8::1234'
		}
	});
	const resV6 = await worker.fetch(reqV6);
	assert.equal(resV6.status, 200);
	assert.equal(await resV6.text(), '2001:db8::1234\n');
	console.log('✔ Direct Test 4: curl gets IPv6 plain text');

	// 1f. Dedicated JSON /api endpoint
	const reqApi = new Request('https://org.elclark.id/api', {
		headers: { 'cf-connecting-ip': '198.51.100.22' }
	});
	const resApi = await worker.fetch(reqApi);
	assert.equal(resApi.status, 200);
	assert.equal(resApi.headers.get('content-type'), 'application/json; charset=utf-8');
	assert.equal(resApi.headers.get('access-control-allow-origin'), '*');
	const jsonApi = await resApi.json();
	assert.deepEqual(jsonApi, {
		ip: '198.51.100.22',
		version: 'IPv4',
		ipv4: '198.51.100.22',
		ipv6: null
	});
	console.log('✔ Direct Test 5: /api returns valid JSON with CORS');

	// 1f. ?format=json query parameter
	const reqQueryJson = new Request('https://org.elclark.id?format=json', {
		headers: { 'cf-connecting-ip': '2001:db8::cafe' }
	});
	const resQueryJson = await worker.fetch(reqQueryJson);
	assert.equal(resQueryJson.status, 200);
	assert.equal(resQueryJson.headers.get('content-type'), 'application/json; charset=utf-8');
	const dataJson = await resQueryJson.json();
	assert.equal(dataJson.ip, '2001:db8::cafe');
	assert.equal(dataJson.version, 'IPv6');
	assert.equal(dataJson.ipv6, '2001:db8::cafe');
	assert.equal(dataJson.ipv4, null);
	console.log('✔ Direct Test 6: ?format=json returns valid JSON');

	// 1g. CORS preflight OPTIONS
	const reqOptions = new Request('https://org.elclark.id', {
		method: 'OPTIONS'
	});
	const resOptions = await worker.fetch(reqOptions);
	assert.equal(resOptions.status, 204);
	assert.equal(resOptions.headers.get('access-control-allow-origin'), '*');
	console.log('✔ Direct Test 7: OPTIONS returns 204 with CORS');

	// 1h. HEAD request
	const reqHead = new Request('https://org.elclark.id', {
		method: 'HEAD',
		headers: {
			'user-agent': 'curl/8.4.0',
			'cf-connecting-ip': '198.51.100.22'
		}
	});
	const resHead = await worker.fetch(reqHead);
	assert.equal(resHead.status, 200);
	assert.equal(resHead.headers.get('content-type'), 'text/plain; charset=utf-8');
	assert.equal(await resHead.text(), '');
	console.log('✔ Direct Test 8: HEAD request returns 200 with empty body');

	// 1i. Browser navigation (IPv4)
	const reqBrowser4 = new Request('https://org.elclark.id', {
		headers: {
			'user-agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
			accept: 'text/html,application/xhtml+xml',
			'cf-connecting-ip': '203.0.113.99'
		}
	});
	const resBrowser4 = await worker.fetch(reqBrowser4);
	assert.equal(resBrowser4.status, 200);
	assert.equal(resBrowser4.headers.get('content-type'), 'text/html; charset=utf-8');
	assert.equal(
		resBrowser4.headers.get('cache-control'),
		'private, no-cache, no-store, must-revalidate'
	);
	const html4 = await resBrowser4.text();
	assert.ok(html4.includes('What is my IP Address? - Origin'), 'Contains page title with Origin');
	assert.ok(html4.includes('https://org.elclark.id'), 'Contains canonical org.elclark.id');
	assert.ok(html4.includes('203.0.113.99'), 'Contains connected IP in HTML');
	assert.ok(html4.includes('status-connected'), 'IPv4 marked Connected in initial SSR HTML');
	assert.ok(html4.includes('status-checking'), 'IPv6 marked Checking in initial SSR HTML');
	assert.ok(html4.includes('Testing Dual-Stack Reachability'), 'Contains dual stack banner');
	assert.ok(html4.includes('Zero Logging'), 'Contains Zero Logging disclosure');
	assert.ok(html4.includes('Cache-Control: no-store'), 'Mentions Cache-Control: no-store');
	assert.ok(html4.includes('Dual-Stack Probes'), 'Contains Dual-Stack Probes disclosure');
	assert.ok(html4.includes('icanhazip.com'), 'Mentions icanhazip.com');
	assert.ok(!html4.includes('ident.me'), 'Does not mention removed fallback ident.me');
	assert.ok(html4.includes('Zero Tracking'), 'Contains Zero Tracking disclosure');
	assert.ok(html4.includes('Disclaimer'), 'Contains Disclaimer');
	assert.ok(html4.includes('curl org.elclark.id'), 'Contains plain curl org.elclark.id command');
	assert.ok(html4.includes('irm org.elclark.id'), 'Contains irm org.elclark.id command');
	assert.ok(html4.includes('curl org.elclark.id/api'), 'Contains curl org.elclark.id/api command');
	assert.ok(!html4.includes('ip.elclark.id'), 'Does not mention removed alias ip.elclark.id');
	console.log('✔ Direct Test 9: Browser receives complete SSR HTML with IPv4 pre-rendered & updated commands');

	// 1j. Browser navigation (IPv6)
	const reqBrowser6 = new Request('https://org.elclark.id', {
		headers: {
			'user-agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
			accept: 'text/html',
			'cf-connecting-ip': '2001:db8::beef'
		}
	});
	const resBrowser6 = await worker.fetch(reqBrowser6);
	assert.equal(resBrowser6.status, 200);
	const html6 = await resBrowser6.text();
	assert.ok(html6.includes('2001:db8::beef'), 'Contains IPv6 in HTML');
	console.log('✔ Direct Test 10: Browser receives complete SSR HTML with IPv6 pre-rendered');

	// 1k. Local/Dev IP badge
	const reqLocal = new Request('https://org.elclark.id', {
		headers: {
			'user-agent': 'Mozilla/5.0',
			accept: 'text/html',
			'cf-connecting-ip': '127.0.0.1'
		}
	});
	const resLocal = await worker.fetch(reqLocal);
	const htmlLocal = await resLocal.text();
	assert.ok(htmlLocal.includes('Local / Dev'), 'Contains Local / Dev badge');
	console.log('✔ Direct Test 11: Local IP renders Local / Dev badge');

	// 1l. POST returns 405 with CORS headers
	const reqPost = new Request('https://org.elclark.id', {
		method: 'POST',
		body: 'payload'
	});
	const resPost = await worker.fetch(reqPost);
	assert.equal(resPost.status, 405);
	assert.equal(resPost.headers.get('access-control-allow-origin'), '*');
	assert.equal(resPost.headers.get('allow'), 'GET, HEAD, OPTIONS');
	console.log('✔ Direct Test 12: POST returns 405 with CORS headers and Allow');

	// 1m. /ip returns plain text for browser
	const reqDirectIp = new Request('https://org.elclark.id/ip', {
		headers: {
			'user-agent': 'Mozilla/5.0',
			accept: 'text/html',
			'cf-connecting-ip': '203.0.113.55'
		}
	});
	const resDirectIp = await worker.fetch(reqDirectIp);
	assert.equal(resDirectIp.status, 200);
	assert.equal(resDirectIp.headers.get('content-type'), 'text/plain; charset=utf-8');
	assert.equal(await resDirectIp.text(), '203.0.113.55\n');
	console.log('✔ Direct Test 13: Browser to /ip returns plain text IP');

	// 1n. /json returns JSON for browser
	const reqDirectJson = new Request('https://org.elclark.id/json', {
		headers: {
			'user-agent': 'Mozilla/5.0',
			accept: 'text/html',
			'cf-connecting-ip': '203.0.113.55'
		}
	});
	const resDirectJson = await worker.fetch(reqDirectJson);
	assert.equal(resDirectJson.status, 200);
	assert.equal(resDirectJson.headers.get('content-type'), 'application/json; charset=utf-8');
	const jsonOut = await resDirectJson.json();
	assert.equal(jsonOut.ip, '203.0.113.55');
	console.log('✔ Direct Test 14: Browser to /json returns JSON');
}

// 2. Live Node.js HTTP Server integration test
{
	const TEST_PORT = 5829;
	const server = await startServer(TEST_PORT);
	const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
	console.log(`Live test server listening on ${BASE_URL}`);

	try {
		// Test live curl request
		const resCurl = await fetch(BASE_URL, {
			headers: {
				'user-agent': 'curl/8.4.0',
				'cf-connecting-ip': '198.51.100.77'
			}
		});
		assert.equal(resCurl.status, 200);
		assert.equal(resCurl.headers.get('content-type'), 'text/plain; charset=utf-8');
		assert.equal(await resCurl.text(), '198.51.100.77\n');
		console.log('✔ Live Test 1: curl over real TCP socket gets plain text');

		// Test live /api endpoint
		const resApi = await fetch(`${BASE_URL}/api`, {
			headers: { 'cf-connecting-ip': '198.51.100.77' }
		});
		assert.equal(resApi.status, 200);
		assert.equal(resApi.headers.get('content-type'), 'application/json; charset=utf-8');
		const json = await resApi.json();
		assert.equal(json.ip, '198.51.100.77');
		assert.equal(json.version, 'IPv4');
		console.log('✔ Live Test 2: /api over real TCP socket returns JSON');

		// Test live browser request
		const resBrowser = await fetch(BASE_URL, {
			headers: {
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
				accept: 'text/html',
				'cf-connecting-ip': '203.0.113.88'
			}
		});
		assert.equal(resBrowser.status, 200);
		assert.equal(resBrowser.headers.get('content-type'), 'text/html; charset=utf-8');
		const html = await resBrowser.text();
		assert.ok(html.includes('203.0.113.88'));
		assert.ok(html.includes('What is my IP Address? - Origin'));
		console.log('✔ Live Test 3: Browser over real TCP socket receives complete HTML');

		// Test live curl request without any proxy headers (verifies socket remoteAddress fallback)
		const resDirectSocket = await fetch(BASE_URL, {
			headers: {
				'user-agent': 'curl/8.4.0'
			}
		});
		assert.equal(resDirectSocket.status, 200);
		const directText = await resDirectSocket.text();
		assert.ok(
			directText === '127.0.0.1\n' || directText === '::1\n',
			`Must extract loopback IP from socket: got ${directText}`
		);
		console.log('✔ Live Test 4: Direct socket connection extracts socket remoteAddress');
	} finally {
		await new Promise((resolve) => server.close(resolve));
		console.log('Live test server closed.');
	}
}

console.log('All Server & Integration Tests passed successfully!');
