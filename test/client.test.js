// @ts-check
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { renderHtml } from '../src/html.js';

console.log('--- [org.elclark.id] Client Script & Sandbox Tests ---');

// 1. Script extraction & syntax
const html = renderHtml({ ip: '203.0.113.1', version: 'IPv4' });
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, 'HTML must contain an inlined <script> block');
const scriptCode = scriptMatch[1];

try {
	new Function(scriptCode);
	console.log('✔ Client script syntax is valid JavaScript');
} catch (err) {
	const msg = err instanceof Error ? err.message : String(err);
	assert.fail(`Client script syntax error: ${msg}`);
}

/**
 * Helper to create simulated DOM sandbox
 * @param {((url?: any) => Promise<any>)} [initialFetch]
 */
function createSandbox(initialFetch = async () => ({ ok: true, text: async () => '2001:db8::1' })) {
	/** @type {Record<string, any>} */
	const elements = {};

	/** @param {string} id */
	function getEl(id) {
		if (!elements[id]) {
			elements[id] = {
				id,
				classList: {
					classes: new Set(),
					/** @param {string} c */
					add(c) {
						this.classes.add(c);
					},
					/** @param {string} c */
					remove(c) {
						this.classes.delete(c);
					},
					/** @param {string} c */
					contains(c) {
						return this.classes.has(c);
					}
				},
				/** @type {Record<string, Function[]>} */
				listeners: {},
				/**
				 * @param {string} event
				 * @param {Function} fn
				 */
				addEventListener(event, fn) {
					this.listeners[event] = this.listeners[event] || [];
					this.listeners[event].push(fn);
				},
				click() {
					if (this.listeners['click']) {
						for (const fn of this.listeners['click']) fn.call(this);
					}
				},
				style: { display: '' },
				innerHTML: '',
				textContent: '',
				className: '',
				disabled: false,
				/** @param {string} attr */
				getAttribute(attr) {
					return this[attr] || null;
				},
				/**
				 * @param {string} attr
				 * @param {any} val
				 */
				setAttribute(attr, val) {
					this[attr] = val;
				}
			};
		}
		return elements[id];
	}

	const doc = {
		/** @param {string} id */
		getElementById: (id) => getEl(id),
		/** @param {string} selector */
		querySelectorAll: (selector) => {
			if (selector === '[data-copy]') {
				return Object.values(elements).filter((el) => el['data-copy']);
			}
			return [];
		},
		/** @param {string} tag */
		createElement: (tag) => ({
			tag,
			style: {},
			value: '',
			select() {},
			parentNode: null
		}),
		body: {
			appendChild() {},
			removeChild() {}
		}
	};

	// Pre-populate standard DOM elements that html.js renders
	getEl('btn-refresh');
	getEl('refresh-icon');
	getEl('refresh-label');
	getEl('btn-copy-primary');
	getEl('primary-ip');
	getEl('hero-protocol-badge');
	getEl('dual-stack-banner');
	getEl('banner-icon');
	getEl('banner-text');
	getEl('v4-status-tag');
	getEl('v4-content');
	getEl('v6-status-tag');
	getEl('v6-content');

	/** @type {Record<string, any>} */
	const win = {};

	const sandbox = {
		window: win,
		document: doc,
		navigator: {
			clipboard: {
				writeText: async () => {}
			}
		},
		fetch: initialFetch,
		AbortController,
		/**
		 * @param {Function} fn
		 * @param {number} [ms]
		 */
		setTimeout: (fn, ms) => setTimeout(fn, ms),
		/** @param {any} id */
		clearTimeout: (id) => clearTimeout(id),
		Date,
		Promise,
		console
	};

	return { sandbox, getEl };
}

// 3. Test escapeHtml exists and functions inside script
{
	const { sandbox } = createSandbox();
	const exposeCode = scriptCode.replace(
		'function escapeHtml',
		'window.escapeHtml = escapeHtml; function escapeHtml'
	);
	const context = vm.createContext(sandbox);
	vm.runInContext(exposeCode, context);

	assert.equal(typeof sandbox.window.escapeHtml, 'function', 'escapeHtml must be defined in script');
	assert.equal(
		sandbox.window.escapeHtml('<script>alert("xss")</script>'),
		'&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
		'escapeHtml must escape dangerous characters'
	);
	console.log('✔ escapeHtml is defined and protects against XSS in browser script');
}

// 4. Test updateStackCard succeeds without ReferenceError and preserves element IDs
{
	const { sandbox, getEl } = createSandbox();
	const exposeCode = scriptCode.replace(
		'function updateStackCard',
		'window.updateStackCard = updateStackCard; function updateStackCard'
	);
	const context = vm.createContext(sandbox);
	vm.runInContext(exposeCode, context);

	// Test IPv6 detected update
	sandbox.window.updateStackCard('v6', 'detected', '2001:db8::cafe');
	const v6Content = getEl('v6-content');
	assert.ok(
		v6Content.innerHTML.includes('2001:db8::cafe'),
		'v6-content innerHTML must include detected IP'
	);
	assert.ok(
		v6Content.innerHTML.includes('id="v6-ip"'),
		'v6-content must preserve id="v6-ip" for DOM lookups'
	);
	assert.equal(getEl('v6-status-tag').textContent, 'Detected');
	assert.equal(getEl('v6-status-tag').className, 'status-tag status-detected');

	// Test IPv4 detected update
	sandbox.window.updateStackCard('v4', 'detected', '198.51.100.42');
	const v4Content = getEl('v4-content');
	assert.ok(
		v4Content.innerHTML.includes('198.51.100.42'),
		'v4-content innerHTML must include detected IP'
	);
	assert.ok(
		v4Content.innerHTML.includes('id="v4-ip"'),
		'v4-content must preserve id="v4-ip" for DOM lookups'
	);
	assert.equal(getEl('v4-status-tag').textContent, 'Detected');

	console.log('✔ updateStackCard executes cleanly and preserves element IDs');
}

// 5. Test updateBanner state transitions
{
	const { sandbox, getEl } = createSandbox();
	const exposeCode = scriptCode
		.replace('var state = {', 'window.state = state = {')
		.replace('function updateBanner', 'window.updateBanner = updateBanner; function updateBanner');
	const context = vm.createContext(sandbox);
	vm.runInContext(exposeCode, context);

	// Ensure probing flag is cleared to test settled banner states
	sandbox.window.state.isProbing = false;

	// Case 5a: Dual-stack detected
	sandbox.window.state.ipv4Status = 'connected';
	sandbox.window.state.ipv6Status = 'detected';
	sandbox.window.updateBanner();
	assert.ok(getEl('banner-text').innerHTML.includes('Dual-Stack Network Detected'));
	assert.equal(getEl('banner-icon').textContent, '✓');

	// Case 5b: IPv4 only
	sandbox.window.state.ipv4Status = 'connected';
	sandbox.window.state.ipv6Status = 'unavailable';
	sandbox.window.updateBanner();
	assert.ok(getEl('banner-text').innerHTML.includes('IPv4 Only Network'));

	// Case 5c: IPv6 only
	sandbox.window.state.ipv4Status = 'unavailable';
	sandbox.window.state.ipv6Status = 'connected';
	sandbox.window.updateBanner();
	assert.ok(getEl('banner-text').innerHTML.includes('IPv6 Only Network'));

	// Case 5d: Neither route detected
	sandbox.window.state.ipv4Status = 'unavailable';
	sandbox.window.state.ipv6Status = 'unavailable';
	sandbox.window.updateBanner();
	assert.ok(
		getEl('banner-text').innerHTML.includes('No Public Route Detected'),
		'Must show No Public Route Detected when both routes fail'
	);

	console.log('✔ updateBanner handles all dual-stack and single-stack states correctly');
}

// 6. Test copyText does not corrupt button content on multiple rapid clicks
{
	const { sandbox } = createSandbox();
	const exposeCode = scriptCode.replace(
		'function copyText',
		'window.copyText = copyText; function copyText'
	);
	const context = vm.createContext(sandbox);
	vm.runInContext(exposeCode, context);

	const btn = {
		innerHTML: '<svg>icon</svg>',
		setAttribute() {},
		getAttribute() {
			return null;
		}
	};

	// First click
	sandbox.window.copyText('test-ip', btn, '✓ Copied!');
	await new Promise((r) => setTimeout(r, 10));
	assert.equal(btn.innerHTML, '✓ Copied!');

	// Second rapid click (before 2s timeout)
	sandbox.window.copyText('test-ip', btn, '✓ Copied!');
	await new Promise((r) => setTimeout(r, 10));
	assert.equal(btn.innerHTML, '✓ Copied!');

	// Wait for timeout to fire
	await new Promise((r) => setTimeout(r, 2100));
	assert.equal(
		btn.innerHTML,
		'<svg>icon</svg>',
		'Button innerHTML must restore original SVG, not get permanently stuck on "✓ Copied!"'
	);

	console.log('✔ copyText safely handles multiple rapid clicks without state corruption');
}

// 7. Test fetchWithTimeout cleans up abort signal listeners (no memory leak)
{
	const { sandbox } = createSandbox();
	const exposeCode = scriptCode.replace(
		'async function fetchWithTimeout',
		'window.fetchWithTimeout = fetchWithTimeout; async function fetchWithTimeout'
	);
	const context = vm.createContext(sandbox);
	vm.runInContext(exposeCode, context);

	const extController = new AbortController();
	let listenerCount = 0;
	const origAdd = extController.signal.addEventListener.bind(extController.signal);
	const origRemove = extController.signal.removeEventListener.bind(extController.signal);

	/**
	 * @param {string} event
	 * @param {any} fn
	 * @param {any} [opts]
	 */
	extController.signal.addEventListener = (event, fn, opts) => {
		listenerCount++;
		origAdd(event, fn, opts);
	};
	/**
	 * @param {string} event
	 * @param {any} fn
	 */
	extController.signal.removeEventListener = (event, fn) => {
		listenerCount--;
		origRemove(event, fn);
	};

	await sandbox.window.fetchWithTimeout(
		'https://ipv4.icanhazip.com',
		1000,
		extController.signal
	);

	assert.equal(
		listenerCount,
		0,
		'Abort listener on external signal must be removed upon fetch completion'
	);
	console.log('✔ fetchWithTimeout cleans up abort listener with zero leaks');
}

// 8. End-to-end probe simulation in VM sandbox
{
	const { sandbox, getEl } = createSandbox(async (url) => {
		if (url && (url.includes('ipv6') || url.includes('v6'))) {
			return { ok: true, text: async () => '2606:4700:4700::1111' };
		}
		return { ok: true, text: async () => '198.51.100.5' };
	});

	const context = vm.createContext(sandbox);
	vm.runInContext(scriptCode, context);

	// Wait for probes to complete
	await new Promise((r) => setTimeout(r, 200));

	const v6Content = getEl('v6-content');
	assert.ok(
		v6Content.innerHTML.includes('2606:4700:4700::1111'),
		'Simulated probe must display detected IPv6'
	);
	assert.ok(
		getEl('banner-text').innerHTML.includes('Dual-Stack Network Detected'),
		'Simulated probe must switch banner to Dual-Stack Network Detected'
	);
	console.log('✔ End-to-end probe simulation in VM sandbox completed successfully');
}

// 9. Test isPrivateIp exists in script and refresh() handles local IP correctly
{
	const { sandbox, getEl } = createSandbox(async (url) => {
		if (url === '/api') {
			return {
				ok: true,
				json: async () => ({ ip: '127.0.0.1', version: 'IPv4', ipv4: '127.0.0.1', ipv6: null })
			};
		}
		if (url && (url.includes('ipv4') || url.includes('v4'))) {
			return { ok: true, text: async () => '203.0.113.77' };
		}
		return { ok: true, text: async () => '2606:4700::1' };
	});

	const exposeCode = scriptCode
		.replace('var state = {', 'window.state = state = {')
		.replace('var isPrivateIp =', 'window.isPrivateIp = isPrivateIp =')
		.replace('async function refresh', 'window.refresh = refresh; async function refresh');

	const context = vm.createContext(sandbox);
	vm.runInContext(exposeCode, context);

	assert.equal(typeof sandbox.window.isPrivateIp, 'function', 'isPrivateIp must be defined in client script');
	assert.equal(sandbox.window.isPrivateIp('127.0.0.1'), true, 'isPrivateIp identifies localhost');
	assert.equal(sandbox.window.isPrivateIp('203.0.113.1'), false, 'isPrivateIp identifies public IP');

	await sandbox.window.refresh();
	assert.equal(sandbox.window.state.isLocal, true, 'state.isLocal must be true for 127.0.0.1');
	assert.equal(getEl('local-badge').style.display, 'inline-block', 'Local badge must be displayed on local IP');

	console.log('✔ isPrivateIp and refresh() with local IP handled correctly in sandbox');
}

// 10. Test refresh() rechecks BOTH IPv4 and IPv6 stacks
{
	const calledUrls = [];
	const { sandbox, getEl } = createSandbox(async (url) => {
		calledUrls.push(url);
		if (url === '/api') {
			return {
				ok: true,
				json: async () => ({ ip: '203.0.113.50', version: 'IPv4', ipv4: '203.0.113.50', ipv6: null })
			};
		}
		if (url && (url.includes('ipv4') || url.includes('v4'))) {
			return { ok: true, text: async () => '203.0.113.50' };
		}
		return { ok: true, text: async () => '2606:4700:4700::1234' };
	});

	const exposeCode = scriptCode
		.replace('var state = {', 'window.state = state = {')
		.replace('async function refresh', 'window.refresh = refresh; async function refresh');

	const context = vm.createContext(sandbox);
	vm.runInContext(exposeCode, context);

	// Clear URLs from initial load
	calledUrls.length = 0;

	// Trigger Re-check
	await sandbox.window.refresh();

	const hasApi = calledUrls.some((u) => u === '/api');
	const hasV4 = calledUrls.some((u) => u && (u.includes('ipv4') || u.includes('v4')));
	const hasV6 = calledUrls.some((u) => u && (u.includes('ipv6') || u.includes('v6')));

	assert.ok(hasApi, 'refresh() must fetch /api');
	assert.ok(hasV4, 'refresh() must probe IPv4 stack even when already connected via IPv4');
	assert.ok(hasV6, 'refresh() must probe IPv6 stack');

	assert.equal(sandbox.window.state.connectedIp, '203.0.113.50', 'state.connectedIp must refresh to new IP');
	assert.equal(getEl('primary-ip').textContent, '203.0.113.50', 'primary-ip element must display new IP');

	// Verify copying primary IP copies the updated IP
	let copiedText = null;
	sandbox.navigator.clipboard.writeText = async (txt) => {
		copiedText = txt;
	};
	getEl('btn-copy-primary').click();
	assert.equal(copiedText, '203.0.113.50', 'btn-copy-primary must copy refreshed connected IP');

	console.log('✔ refresh() rechecks both IPv4 and IPv6 stacks and updates changed connected IP');
}

console.log('All Client Script & Sandbox Tests passed successfully!');

