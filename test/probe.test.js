// @ts-check
import assert from 'node:assert/strict';
import {
	fetchWithTimeout,
	probeIpv4,
	probeIpv6,
	IPV4_PROBE_ENDPOINTS,
	IPV6_PROBE_ENDPOINTS
} from '../src/probe.js';

console.log('--- [org.elclark.id] Unit Tests: Probe Logic ---');

// 1. Endpoint constants
assert.deepEqual(IPV4_PROBE_ENDPOINTS, ['https://ipv4.icanhazip.com', 'https://v4.ident.me']);
assert.deepEqual(IPV6_PROBE_ENDPOINTS, ['https://ipv6.icanhazip.com', 'https://v6.ident.me']);
console.log('✔ Probe endpoints configured correctly');

// 2. fetchWithTimeout tests
{
	// 2a. Successful fetch
	const mockFetchOk = async () => new Response(' 203.0.113.10 \n', { status: 200 });
	const textOk = await fetchWithTimeout('https://example.com', 1000, mockFetchOk);
	assert.equal(textOk, '203.0.113.10', 'Should trim whitespace and newline');

	// 2b. HTTP error status
	const mockFetch500 = async () => new Response('Server Error', { status: 500 });
	const text500 = await fetchWithTimeout('https://example.com', 1000, mockFetch500);
	assert.equal(text500, null, '500 status should return null');

	// 2c. Network throw
	const mockFetchThrow = async () => {
		throw new Error('Connection refused');
	};
	const textThrow = await fetchWithTimeout('https://example.com', 1000, mockFetchThrow);
	assert.equal(textThrow, null, 'Network error should return null');

	// 2d. Abort timeout
	/** @type {import('../src/probe.js').FetchFn} */
	const mockFetchHanging = async (_url, init) => {
		return new Promise((resolve, reject) => {
			init?.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
		});
	};
	const textTimeout = await fetchWithTimeout('https://example.com', 50, mockFetchHanging);
	assert.equal(textTimeout, null, 'Timeout should abort and return null');

	// 2e. Timeout covers hanging res.text() body stream
	/** @type {import('../src/probe.js').FetchFn} */
	const mockFetchHangingBody = async () => {
		return {
			ok: true,
			text: () => new Promise(() => {}) // never resolves
		};
	};
	const textHangingBody = await fetchWithTimeout('https://example.com', 50, mockFetchHangingBody);
	assert.equal(textHangingBody, null, 'Timeout must abort even if res.text() stalls');

	// 2f. External signal cancels fetch immediately
	const extController = new AbortController();
	extController.abort();
	const textPreAborted = await fetchWithTimeout(
		'https://example.com',
		1000,
		mockFetchOk,
		extController.signal
	);
	assert.equal(textPreAborted, null, 'Pre-aborted external signal should return null immediately');

	// 2g. Abort during streaming body does not trigger unhandled rejection
	/** @type {any} */
	let unhandledError = null;
	/** @param {any} err */
	const unhandledListener = (err) => {
		unhandledError = err;
	};
	process.on('unhandledRejection', unhandledListener);

	const ctrlG = new AbortController();
	/** @type {import('../src/probe.js').FetchFn} */
	const mockFetchAbortMidway = async () => {
		ctrlG.abort();
		return {
			ok: true,
			text: () =>
				new Promise((_, reject) => setTimeout(() => reject(new Error('stream aborted')), 20))
		};
	};
	const textAbortedStream = await fetchWithTimeout(
		'https://example.com',
		1000,
		mockFetchAbortMidway,
		ctrlG.signal
	);
	assert.equal(textAbortedStream, null, 'Should return null when stream is aborted midway');
	await new Promise((r) => setTimeout(r, 50));
	process.removeListener('unhandledRejection', unhandledListener);
	assert.equal(unhandledError, null, 'Must not produce unhandled promise rejection on stream abort');

	console.log('✔ fetchWithTimeout handles success, errors, hanging bodies, and external aborts');
}

// 3. probeIpv4 tests
{
	// 3a. Primary endpoint succeeds
	/** @type {string[]} */
	const callsA = [];
	/** @param {string} url */
	const mockFetchPrimary = async (url) => {
		callsA.push(url);
		return new Response('198.51.100.1\n', { status: 200 });
	};
	const resA = await probeIpv4(1000, mockFetchPrimary);
	assert.equal(resA, '198.51.100.1');
	assert.equal(callsA.length, 1);
	assert.equal(callsA[0], 'https://ipv4.icanhazip.com');

	// 3b. Primary fails, fallback succeeds
	/** @type {string[]} */
	const callsB = [];
	/** @param {string} url */
	const mockFetchFallback = async (url) => {
		callsB.push(url);
		if (url === 'https://ipv4.icanhazip.com') {
			throw new Error('Timeout');
		}
		return new Response('198.51.100.2\n', { status: 200 });
	};
	const resB = await probeIpv4(1000, mockFetchFallback);
	assert.equal(resB, '198.51.100.2');
	assert.equal(callsB.length, 2);
	assert.equal(callsB[1], 'https://v4.ident.me');

	// 3c. Primary returns invalid IP, fallback succeeds
	/** @type {string[]} */
	const callsC = [];
	/** @param {string} url */
	const mockFetchInvalidFirst = async (url) => {
		callsC.push(url);
		if (url === 'https://ipv4.icanhazip.com') {
			return new Response('<html>Error</html>', { status: 200 });
		}
		return new Response('198.51.100.3\n', { status: 200 });
	};
	const resC = await probeIpv4(1000, mockFetchInvalidFirst);
	assert.equal(resC, '198.51.100.3');
	assert.equal(callsC.length, 2);

	// 3d. Both endpoints fail
	const mockFetchAllFail = async () => {
		throw new Error('No route to host');
	};
	const resD = await probeIpv4(1000, mockFetchAllFail);
	assert.equal(resD, null, 'Should return null when both endpoints fail');

	// 3e. Strict cumulative deadline
	/** @type {string[]} */
	const callsE = [];
	/** @type {import('../src/probe.js').FetchFn} */
	const mockFetchHanging = async (url, init) => {
		callsE.push(String(url));
		return new Promise((resolve, reject) => {
			init?.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
		});
	};
	const startE = Date.now();
	const resE = await probeIpv4(80, mockFetchHanging);
	const elapsedE = Date.now() - startE;
	assert.equal(resE, null);
	assert.equal(callsE.length, 1, 'Should not try fallback if deadline expired on primary');
	assert.ok(elapsedE < 200, `Total probe time (${elapsedE}ms) must not exceed deadline`);

	// 3f. External signal cancels probe
	const controllerF = new AbortController();
	controllerF.abort();
	const resF = await probeIpv4(1000, mockFetchPrimary, controllerF.signal);
	assert.equal(resF, null, 'Cancelled signal should return null');

	console.log('✔ probeIpv4 primary, fallback, deadline enforcement, and aborts passed');
}

// 4. probeIpv6 tests
{
	// 4a. Primary endpoint succeeds
	/** @type {string[]} */
	const callsA = [];
	/** @param {string} url */
	const mockFetchPrimary = async (url) => {
		callsA.push(url);
		return new Response('2001:db8::1234\n', { status: 200 });
	};
	const resA = await probeIpv6(1000, mockFetchPrimary);
	assert.equal(resA, '2001:db8::1234');
	assert.equal(callsA.length, 1);
	assert.equal(callsA[0], 'https://ipv6.icanhazip.com');

	// 4b. Primary fails, fallback succeeds
	/** @type {string[]} */
	const callsB = [];
	/** @param {string} url */
	const mockFetchFallback = async (url) => {
		callsB.push(url);
		if (url === 'https://ipv6.icanhazip.com') {
			return new Response('503 Service Unavailable', { status: 503 });
		}
		return new Response('2001:db8::5678\n', { status: 200 });
	};
	const resB = await probeIpv6(1000, mockFetchFallback);
	assert.equal(resB, '2001:db8::5678');
	assert.equal(callsB.length, 2);
	assert.equal(callsB[1], 'https://v6.ident.me');

	// 4c. Primary returns IPv4 instead of IPv6, fallback succeeds
	/** @type {string[]} */
	const callsC = [];
	/** @param {string} url */
	const mockFetchWrongType = async (url) => {
		callsC.push(url);
		if (url === 'https://ipv6.icanhazip.com') {
			return new Response('192.0.2.1', { status: 200 });
		}
		return new Response('2606:4700:4700::1111', { status: 200 });
	};
	const resC = await probeIpv6(1000, mockFetchWrongType);
	assert.equal(resC, '2606:4700:4700::1111');
	assert.equal(callsC.length, 2);

	// 4d. Both fail
	const mockFetchAllFail = async () => {
		throw new Error('IPv6 network unreachable');
	};
	const resD = await probeIpv6(1000, mockFetchAllFail);
	assert.equal(resD, null, 'Should return null when IPv6 is unreachable');

	// 4e. Strict cumulative deadline
	/** @type {string[]} */
	const callsE = [];
	/** @type {import('../src/probe.js').FetchFn} */
	const mockFetchHanging = async (url, init) => {
		callsE.push(String(url));
		return new Promise((resolve, reject) => {
			init?.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
		});
	};
	const startE = Date.now();
	const resE = await probeIpv6(80, mockFetchHanging);
	const elapsedE = Date.now() - startE;
	assert.equal(resE, null);
	assert.equal(callsE.length, 1, 'Should not try fallback if deadline expired on primary');
	assert.ok(elapsedE < 200, `Total probe time (${elapsedE}ms) must not exceed deadline`);

	// 4f. External signal cancels probe
	const controllerF = new AbortController();
	controllerF.abort();
	const resF = await probeIpv6(1000, mockFetchPrimary, controllerF.signal);
	assert.equal(resF, null, 'Cancelled signal should return null');

	console.log('✔ probeIpv6 primary, fallback, deadline enforcement, and aborts passed');
}

// 5. Edge case response formats
{
	const mockEmptyFetch = async () => new Response('', { status: 200 });
	assert.equal(await probeIpv4(1000, mockEmptyFetch), null);
	assert.equal(await probeIpv6(1000, mockEmptyFetch), null);

	const mockBadIpFetch = async () => new Response('999.999.999.999', { status: 200 });
	assert.equal(await probeIpv4(1000, mockBadIpFetch), null);

	const mockBadIpv6Fetch = async () => new Response('2001:xyz::1', { status: 200 });
	assert.equal(await probeIpv6(1000, mockBadIpv6Fetch), null);

	console.log('✔ Probe edge case formats passed');
}

console.log('All Probe Tests passed successfully!');
