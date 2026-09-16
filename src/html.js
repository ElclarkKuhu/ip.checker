// @ts-check
import { isPrivateIp, isValidIpv4, isValidIpv6 } from './ip.js';
import { IPV4_PROBE_ENDPOINTS, IPV6_PROBE_ENDPOINTS } from './probe.js';

/**
 * Escapes HTML characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
	if (!str) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Renders the web UI HTML page.
 *
 * @param {{ ip: string, version: 'IPv4' | 'IPv6' }} clientInfo
 * @returns {string}
 */
export function renderHtml({ ip, version }) {
	const safeIp = escapeHtml(ip);
	const isLocal = isPrivateIp(ip);
	const isV4 = version === 'IPv4';
	const isV6 = version === 'IPv6';

	const v4Status = isV4 && !isLocal ? 'connected' : 'checking';
	const v6Status = isV6 && !isLocal ? 'connected' : 'checking';
	const v4Ip = isV4 && !isLocal ? safeIp : '';
	const v6Ip = isV6 && !isLocal ? safeIp : '';

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>What is my IP Address? - Elclark Origin</title>
  <meta name="description" content="Elclark Origin - Lightweight IP and dual-stack IPv4/IPv6 diagnostics on the edge.">
  <meta property="og:title" content="What is my IP Address? - Elclark Origin">
  <meta property="og:description" content="Elclark Origin - Inspect your public IP address and verify IPv4 and IPv6 dual-stack reachability. Zero-logging, tracker-free.">
  <meta property="og:url" content="https://org.elclark.id">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="What is my IP Address? - Elclark Origin">
  <meta name="twitter:description" content="Elclark Origin - Inspect your public IP address and verify IPv4 and IPv6 dual-stack reachability. Zero-logging, tracker-free.">
  <link rel="canonical" href="https://org.elclark.id">
  <link rel="icon" type="image/png" href="https://elclark.id/favicon.png">
  <link rel="alternate icon" href="https://elclark.id/favicon.ico">
  <style>
    :root {
      --bg: #090b0e;
      --bg-card: #11141a;
      --bg-card-subtle: #161a22;
      --border: #222734;
      --border-subtle: #1a1e28;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --text-dim: #6b7280;
      --accent-ipv4: #10b981;
      --accent-ipv4-bg: rgba(16, 185, 129, 0.12);
      --accent-ipv6: #6366f1;
      --accent-ipv6-bg: rgba(99, 102, 241, 0.12);
      --accent-checking: #f59e0b;
      --accent-checking-bg: rgba(245, 158, 11, 0.12);
      --code-bg: #0d1017;
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .container {
      max-width: 54rem;
      margin: 0 auto;
      padding: 2.5rem 1.25rem 4rem;
      width: 100%;
      flex: 1;
    }

    /* Header */
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      font-family: var(--font-mono);
      font-size: 0.8rem;
    }

    .brand {
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: color 0.15s;
    }

    .brand:hover {
      color: var(--text);
    }

    .brand-tag {
      color: var(--text-dim);
      letter-spacing: 0.05em;
    }

    .page-title {
      font-size: clamp(1.85rem, 4vw, 2.5rem);
      font-weight: 750;
      letter-spacing: -0.025em;
      margin-bottom: 0.5rem;
      color: var(--text);
    }

    .page-subtitle {
      color: var(--text-muted);
      font-size: clamp(0.95rem, 2vw, 1.05rem);
      margin-bottom: 2rem;
    }

    /* Hero Card */
    .hero-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.75rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    }

    .hero-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .hero-meta {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
      font-size: 0.875rem;
    }

    .status-pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }

    .status-pulse.ipv4 {
      background: var(--accent-ipv4);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
    }

    .status-pulse.ipv6 {
      background: var(--accent-ipv6);
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.6);
    }

    .meta-label {
      color: var(--text-muted);
    }

    .protocol-badge {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .protocol-badge.ipv4 {
      background: var(--accent-ipv4-bg);
      color: var(--accent-ipv4);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }

    .protocol-badge.ipv6 {
      background: var(--accent-ipv6-bg);
      color: var(--accent-ipv6);
      border: 1px solid rgba(99, 102, 241, 0.25);
    }

    .local-badge {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      background: rgba(245, 158, 11, 0.15);
      color: var(--accent-checking);
      border: 1px solid rgba(245, 158, 11, 0.25);
    }

    .btn-refresh {
      background: var(--bg-card-subtle);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      font-family: var(--font-sans);
      font-size: 0.825rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      transition: all 0.15s ease;
    }

    .btn-refresh:hover:not(:disabled) {
      background: #1c212c;
      color: var(--text);
      border-color: #333a4c;
    }

    .btn-refresh:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .icon-refresh {
      width: 15px;
      height: 15px;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .hero-body {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      flex-wrap: wrap;
    }

    .primary-ip-display {
      font-family: var(--font-mono);
      font-size: clamp(1.2rem, 3.2vw, 1.85rem);
      font-weight: 700;
      letter-spacing: -0.025em;
      color: var(--text);
      word-break: break-all;
      line-height: 1.25;
    }

    .btn-copy {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 0.55rem 1.15rem;
      border-radius: 7px;
      font-family: var(--font-sans);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background-color 0.15s, transform 0.1s;
    }

    .btn-copy:hover {
      background: #1d4ed8;
    }

    .btn-copy:active {
      transform: scale(0.98);
    }

    .btn-copy.copied {
      background: #059669;
    }

    .btn-copy-icon {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
    }

    /* Dual Stack Status Banner */
    .dual-stack-banner {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.85rem 1.25rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }

    .dual-stack-banner.active {
      border-color: rgba(16, 185, 129, 0.35);
      background: linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%);
    }

    .banner-icon {
      font-size: 0.85rem;
      line-height: 1;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-card-subtle);
      border: 1px solid var(--border);
      flex-shrink: 0;
    }

    .dual-stack-banner.active .banner-icon {
      background: var(--accent-ipv4-bg);
      border-color: rgba(16, 185, 129, 0.3);
      color: var(--accent-ipv4);
    }

    /* Stack Breakdown Grid */
    .stack-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }

    .stack-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.15rem 1.25rem;
      display: flex;
      flex-direction: column;
      transition: border-color 0.15s ease;
    }

    .stack-card:hover {
      border-color: #2b3547;
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.85rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pill {
      font-family: var(--font-mono);
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      letter-spacing: 0.02em;
    }

    .pill.ipv4 {
      background: var(--accent-ipv4-bg);
      color: var(--accent-ipv4);
    }

    .pill.ipv6 {
      background: var(--accent-ipv6-bg);
      color: var(--accent-ipv6);
    }

    .status-tag {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
    }

    .status-connected {
      background: var(--accent-ipv4-bg);
      color: var(--accent-ipv4);
    }

    .status-detected {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }

    .status-checking {
      background: var(--accent-checking-bg);
      color: var(--accent-checking);
    }

    .status-unavailable {
      background: rgba(107, 114, 128, 0.15);
      color: var(--text-dim);
    }

    .card-content {
      flex: 1;
      min-height: 2.75rem;
      display: flex;
      align-items: center;
    }

    .ip-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 0.75rem;
    }

    .ip-text {
      font-family: var(--font-mono);
      font-size: clamp(0.76rem, 1.35vw, 0.835rem);
      font-weight: 600;
      letter-spacing: -0.025em;
      color: var(--text);
      word-break: break-all;
      line-height: 1.35;
    }

    .btn-icon-copy {
      background: var(--bg-card-subtle);
      border: 1px solid var(--border);
      color: var(--text-muted);
      border-radius: 6px;
      width: 30px;
      height: 30px;
      padding: 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }

    .btn-icon-copy:hover {
      background: #1c212c;
      color: var(--text);
      border-color: #384256;
    }

    .btn-icon-copy svg {
      width: 14px;
      height: 14px;
    }

    .loading-placeholder {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      color: var(--text-dim);
      font-size: 0.85rem;
    }

    .dot-flashing {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent-checking);
      animation: pulse 1s infinite alternate;
    }

    @keyframes pulse {
      0% { opacity: 0.3; transform: scale(0.85); }
      100% { opacity: 1; transform: scale(1.15); }
    }

    .unavailable-note {
      font-size: 0.825rem;
      color: var(--text-dim);
    }

    .card-footer {
      margin-top: 0.75rem;
      padding-top: 0.6rem;
      border-top: 1px solid var(--border-subtle);
      font-size: 0.725rem;
      color: var(--text-dim);
      font-family: var(--font-mono);
    }

    /* CLI Section */
    .cli-section {
      margin-bottom: 2.75rem;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.35rem;
      color: var(--text);
    }

    .section-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
    }

    .commands-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 0.85rem;
    }

    .command-block {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .command-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .command-desc {
      font-size: 0.75rem;
      color: var(--text-dim);
      font-family: var(--font-mono);
    }

    .btn-snippet-copy {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-muted);
      border-radius: 4px;
      padding: 0.15rem 0.45rem;
      font-size: 0.7rem;
      font-family: var(--font-mono);
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-snippet-copy:hover {
      background: var(--bg-card-subtle);
      color: var(--text);
    }

    pre {
      font-family: var(--font-mono);
      font-size: 0.825rem;
      color: #93c5fd;
      overflow-x: auto;
      white-space: nowrap;
    }

    /* Diagnostics & Notes Section */
    .notes-section {
      margin-bottom: 2.5rem;
    }

    .notes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 1rem;
    }

    .notes-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.15rem;
    }

    .notes-card h3 {
      font-size: 0.95rem;
      font-weight: 650;
      margin-bottom: 0.4rem;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .notes-card p {
      font-size: 0.825rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .inline-code {
      font-family: var(--font-mono);
      font-size: 0.775rem;
      background: var(--code-bg);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      border: 1px solid var(--border);
      color: #cbd5e1;
    }

    /* Footer */
    footer {
      border-top: 1px solid var(--border-subtle);
      padding: 1.75rem 1.25rem;
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-dim);
    }

    footer a {
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.15s;
    }

    footer a:hover {
      color: var(--text);
    }

    @media (max-width: 640px) {
      .container {
        padding: 1.5rem 1rem 3rem;
      }
      .hero-card {
        padding: 1.25rem;
      }
      .hero-body {
        flex-direction: column;
        align-items: flex-start;
      }
      .btn-copy {
        width: 100%;
        justify-content: center;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="top-bar">
      <a href="https://elclark.id" class="brand">
        <span>&larr; elclark.id</span>
      </a>
      <span class="brand-tag">Elclark Origin</span>
    </div>

    <header>
      <h1 class="page-title">What is my IP Address?</h1>
      <p class="page-subtitle">Elclark Origin - Lightweight, zero-logging network diagnostics running at the Cloudflare edge.</p>
    </header>

    <!-- Primary Connected IP Hero Card -->
    <section class="hero-card" aria-label="Connected IP Information">
      <div class="hero-header">
        <div class="hero-meta">
          <span id="hero-pulse" class="status-pulse ${version.toLowerCase()}" aria-hidden="true"></span>
          <span class="meta-label">Currently Connected Via</span>
          <span id="hero-protocol-badge" class="protocol-badge ${version.toLowerCase()}">${version}</span>
          <span id="local-badge" class="local-badge"${isLocal ? '' : ' style="display: none;"'}>Local / Dev</span>
        </div>
        <button type="button" id="btn-refresh" class="btn-refresh" aria-label="Refresh and re-check IP address">
          <svg class="icon-refresh" id="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span id="refresh-label">Re-check</span>
        </button>
      </div>

      <div class="hero-body">
        <div class="primary-ip-display">
          <span id="primary-ip">${safeIp}</span>
        </div>
        <button type="button" id="btn-copy-primary" class="btn-copy" aria-label="Copy connected IP address">
          <svg class="btn-copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span id="copy-primary-text">Copy IP</span>
        </button>
      </div>
    </section>

    <!-- Dual Stack Status Banner -->
    <div id="dual-stack-banner" class="dual-stack-banner" role="status">
      <span id="banner-icon" class="banner-icon">&bull;</span>
      <span id="banner-text">
        <strong>Testing Dual-Stack Reachability</strong> - Probing alternate IP stack from your browser...
      </span>
    </div>

    <!-- Dual Stack Breakdown (IPv4 & IPv6 Cards) -->
    <div class="stack-grid">
      <!-- IPv4 Card -->
      <div class="stack-card">
        <div class="card-top">
          <div class="card-title">
            <span class="pill ipv4">IPv4</span>
          </div>
          <div id="v4-status-tag" class="status-tag status-${v4Status}">
            ${v4Status === 'connected' ? 'Connected' : 'Checking&hellip;'}
          </div>
        </div>

        <div id="v4-content" class="card-content">
          ${
						v4Status === 'connected'
							? `<div class="ip-row">
              <span id="v4-ip" class="ip-text font-mono">${v4Ip}</span>
              <button type="button" class="btn-icon-copy" data-copy="${v4Ip}" aria-label="Copy IPv4 address" title="Copy IPv4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>`
							: `<div class="loading-placeholder">
              <span class="dot-flashing"></span>
              <span>Testing IPv4 route&hellip;</span>
            </div>`
					}
        </div>
      </div>

      <!-- IPv6 Card -->
      <div class="stack-card">
        <div class="card-top">
          <div class="card-title">
            <span class="pill ipv6">IPv6</span>
          </div>
          <div id="v6-status-tag" class="status-tag status-${v6Status}">
            ${v6Status === 'connected' ? 'Connected' : 'Checking&hellip;'}
          </div>
        </div>

        <div id="v6-content" class="card-content">
          ${
						v6Status === 'connected'
							? `<div class="ip-row">
              <span id="v6-ip" class="ip-text font-mono">${v6Ip}</span>
              <button type="button" class="btn-icon-copy" data-copy="${v6Ip}" aria-label="Copy IPv6 address" title="Copy IPv6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>`
							: `<div class="loading-placeholder">
              <span class="dot-flashing"></span>
              <span>Testing IPv6 route&hellip;</span>
            </div>`
					}
        </div>
      </div>
    </div>

    <!-- CLI & API Access Section -->
    <section class="cli-section" aria-labelledby="cli-heading">
      <h2 id="cli-heading" class="section-title">CLI &amp; API Access</h2>
      <p class="section-desc">Access your IP directly from terminal or automation scripts via <code>org.elclark.id</code>:</p>

      <div class="commands-grid">
        <div class="command-block">
          <div class="command-meta">
            <span class="command-desc">Plain text IP</span>
            <button type="button" class="btn-snippet-copy" data-copy="curl org.elclark.id">Copy</button>
          </div>
          <pre><code>curl org.elclark.id</code></pre>
        </div>

        <div class="command-block">
          <div class="command-meta">
            <span class="command-desc">JSON format</span>
            <button type="button" class="btn-snippet-copy" data-copy="curl org.elclark.id/api">Copy</button>
          </div>
          <pre><code>curl org.elclark.id/api</code></pre>
        </div>

        <div class="command-block">
          <div class="command-meta">
            <span class="command-desc">Force IPv4</span>
            <button type="button" class="btn-snippet-copy" data-copy="curl -4 org.elclark.id">Copy</button>
          </div>
          <pre><code>curl -4 org.elclark.id</code></pre>
        </div>

        <div class="command-block">
          <div class="command-meta">
            <span class="command-desc">Force IPv6</span>
            <button type="button" class="btn-snippet-copy" data-copy="curl -6 org.elclark.id">Copy</button>
          </div>
          <pre><code>curl -6 org.elclark.id</code></pre>
        </div>

        <div class="command-block">
          <div class="command-meta">
            <span class="command-desc">PowerShell</span>
            <button type="button" class="btn-snippet-copy" data-copy="irm org.elclark.id">Copy</button>
          </div>
          <pre><code>irm org.elclark.id</code></pre>
        </div>

        <div class="command-block">
          <div class="command-meta">
            <span class="command-desc">JSON via query</span>
            <button type="button" class="btn-snippet-copy" data-copy="curl org.elclark.id?format=json">Copy</button>
          </div>
          <pre><code>curl org.elclark.id?format=json</code></pre>
        </div>
      </div>
    </section>

    <!-- Diagnostics & Notes Section -->
    <section class="notes-section" aria-labelledby="notes-heading">
      <h2 id="notes-heading" class="section-title">Diagnostics &amp; Notes</h2>
      <p class="section-desc">Transparent network diagnostics running directly at the edge.</p>

      <div class="notes-grid">
        <div class="notes-card">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Zero Logging
          </h3>
          <p>
            No stored or logged IP addresses. Resolution is performed in-memory at the edge with caching disabled (<code class="inline-code">Cache-Control: no-store</code>).
          </p>
        </div>

        <div class="notes-card">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Dual-Stack Probes
          </h3>
          <p>
            Alternate stack reachability is tested via lightweight browser requests to public endpoints (<code class="inline-code">icanhazip.com</code> and <code class="inline-code">ident.me</code>).
          </p>
        </div>

        <div class="notes-card">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            Zero Tracking
          </h3>
          <p>Zero analytics scripts, zero cookies, and zero user tracking.</p>
        </div>

        <div class="notes-card">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Disclaimer
          </h3>
          <p>Provided free of charge for network diagnostics &ldquo;as is&rdquo;, without warranties of any kind.</p>
        </div>
      </div>
    </section>
  </div>

  <footer>
    <p>Elclark Origin &middot; by <a href="https://elclark.id">Elclark Kuhu</a> &middot; Powered by Cloudflare Edge &middot; <a href="#notes-heading">Diagnostics &amp; Notes</a></p>
  </footer>

  <script>
    (function() {
      // Injected SSR initial state
      var state = {
        connectedIp: ${JSON.stringify(ip)},
        version: ${JSON.stringify(version)},
        isLocal: ${JSON.stringify(isLocal)},
        probedIpv4: ${JSON.stringify(isV4 && !isLocal ? ip : null)},
        probedIpv6: ${JSON.stringify(isV6 && !isLocal ? ip : null)},
        ipv4Status: ${JSON.stringify(v4Status)},
        ipv6Status: ${JSON.stringify(v6Status)},
        isProbing: false
      };

      var activeController = null;
      var IPV4_ENDPOINTS = ${JSON.stringify(IPV4_PROBE_ENDPOINTS)};
      var IPV6_ENDPOINTS = ${JSON.stringify(IPV6_PROBE_ENDPOINTS)};

      function escapeHtml(str) {
        if (!str) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      var isValidIpv4 = ${isValidIpv4.toString()};
      var isValidIpv6 = ${isValidIpv6.toString()};
      var isPrivateIp = ${isPrivateIp.toString()};

      async function fetchWithTimeout(url, timeoutMs, signal) {
        if (signal && signal.aborted) return null;
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, timeoutMs);
        var onAbort = function() { controller.abort(); };
        if (signal) {
          signal.addEventListener('abort', onAbort, { once: true });
        }
        try {
          var res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
          if (!res || !res.ok) return null;
          var text = await res.text();
          return typeof text === 'string' ? text.trim() : null;
        } catch(e) {
          return null;
        } finally {
          clearTimeout(timeoutId);
          if (signal) {
            signal.removeEventListener('abort', onAbort);
          }
        }
      }

      async function probeStack(endpoints, validator, timeoutMs, signal) {
        if (signal && signal.aborted) return null;
        var deadline = Date.now() + timeoutMs;
        for (var i = 0; i < endpoints.length; i++) {
          if (signal && signal.aborted) return null;
          var remaining = deadline - Date.now();
          if (remaining <= 0) break;
          var res = await fetchWithTimeout(endpoints[i], remaining, signal);
          if (res && validator(res)) {
            return res;
          }
        }
        return null;
      }

      function updateBanner() {
        var banner = document.getElementById('dual-stack-banner');
        var bannerIcon = document.getElementById('banner-icon');
        var bannerText = document.getElementById('banner-text');
        var v4Ok = state.ipv4Status === 'connected' || state.ipv4Status === 'detected';
        var v6Ok = state.ipv6Status === 'connected' || state.ipv6Status === 'detected';

        if (v4Ok && v6Ok) {
          banner.className = 'dual-stack-banner active';
          bannerIcon.textContent = '✓';
          bannerText.innerHTML = '<strong>Dual-Stack Network Detected</strong> - Working public connectivity over both IPv4 and IPv6.';
        } else if (state.isProbing || state.ipv4Status === 'checking' || state.ipv6Status === 'checking') {
          banner.className = 'dual-stack-banner';
          bannerIcon.textContent = '…';
          bannerText.innerHTML = '<strong>Testing Dual-Stack Reachability</strong> - Probing alternate IP stack from your browser...';
        } else if (v4Ok && state.ipv6Status === 'unavailable') {
          banner.className = 'dual-stack-banner';
          bannerIcon.textContent = '•';
          bannerText.innerHTML = '<strong>IPv4 Only Network</strong> - Connected over IPv4; no public IPv6 route detected.';
        } else if (v6Ok && state.ipv4Status === 'unavailable') {
          banner.className = 'dual-stack-banner';
          bannerIcon.textContent = '•';
          bannerText.innerHTML = '<strong>IPv6 Only Network</strong> - Connected over IPv6; no public IPv4 route detected.';
        } else if (!v4Ok && !v6Ok) {
          banner.className = 'dual-stack-banner';
          bannerIcon.textContent = '•';
          bannerText.innerHTML = '<strong>No Public Route Detected</strong> - Unable to reach public IPv4 or IPv6 endpoints.';
        } else {
          banner.className = 'dual-stack-banner';
          bannerIcon.textContent = '•';
          bannerText.innerHTML = '<strong>Single Stack Active</strong> - Network connectivity detected.';
        }
      }

      function updateStackCard(type, status, ip) {
        var statusTag = document.getElementById(type + '-status-tag');
        var content = document.getElementById(type + '-content');
        if (!statusTag || !content) return;

        statusTag.className = 'status-tag status-' + status;
        var label = status === 'connected' ? 'Connected' : (status === 'detected' ? 'Detected' : (status === 'checking' ? 'Checking…' : 'Unavailable'));
        statusTag.textContent = label;

        if ((status === 'connected' || status === 'detected') && ip) {
          content.innerHTML = '<div class="ip-row">' +
            '<span id="' + type + '-ip" class="ip-text font-mono">' + escapeHtml(ip) + '</span>' +
            '<button type="button" class="btn-icon-copy" data-copy="' + escapeHtml(ip) + '" aria-label="Copy ' + type.toUpperCase() + ' address" title="Copy ' + type.toUpperCase() + '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>' +
                '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' +
              '</svg>' +
            '</button>' +
          '</div>';
          attachCopyListeners();
        } else if (status === 'checking') {
          content.innerHTML = '<div class="loading-placeholder">' +
            '<span class="dot-flashing"></span>' +
            '<span>Testing ' + type.toUpperCase() + ' route&hellip;</span>' +
          '</div>';
        } else {
          content.innerHTML = '<p class="unavailable-note">No public ' + type.toUpperCase() + ' route detected from this client network.</p>';
        }
      }

      async function runProbes(controller) {
        var signal = controller.signal;
        state.isProbing = true;
        var btnRefresh = document.getElementById('btn-refresh');
        var refreshIcon = document.getElementById('refresh-icon');
        var refreshLabel = document.getElementById('refresh-label');

        if (btnRefresh) btnRefresh.disabled = true;
        if (refreshIcon) refreshIcon.classList.add('spinning');
        if (refreshLabel) refreshLabel.textContent = 'Checking...';

        try {
          var promises = [];
          // Probe IPv4 if not already connected via IPv4
          if (state.version !== 'IPv4' || state.isLocal) {
            updateStackCard('v4', 'checking');
            promises.push(
              probeStack(IPV4_ENDPOINTS, isValidIpv4, 3500, signal).then(function(res) {
                if (signal.aborted) return;
                if (res) {
                  state.probedIpv4 = res;
                  state.ipv4Status = 'detected';
                  updateStackCard('v4', 'detected', res);
                } else {
                  state.probedIpv4 = null;
                  state.ipv4Status = 'unavailable';
                  updateStackCard('v4', 'unavailable');
                }
                updateBanner();
              })
            );
          }

          // Probe IPv6 if not already connected via IPv6
          if (state.version !== 'IPv6' || state.isLocal) {
            updateStackCard('v6', 'checking');
            promises.push(
              probeStack(IPV6_ENDPOINTS, isValidIpv6, 3500, signal).then(function(res) {
                if (signal.aborted) return;
                if (res) {
                  state.probedIpv6 = res;
                  state.ipv6Status = 'detected';
                  updateStackCard('v6', 'detected', res);
                } else {
                  state.probedIpv6 = null;
                  state.ipv6Status = 'unavailable';
                  updateStackCard('v6', 'unavailable');
                }
                updateBanner();
              })
            );
          }

          updateBanner();
          await Promise.allSettled(promises);
          if (!signal.aborted) {
            updateBanner();
          }
        } finally {
          if (activeController === controller) {
            state.isProbing = false;
            if (btnRefresh) btnRefresh.disabled = false;
            if (refreshIcon) refreshIcon.classList.remove('spinning');
            if (refreshLabel) refreshLabel.textContent = 'Re-check';
          }
        }
      }

      async function refresh() {
        if (activeController) activeController.abort();
        activeController = new AbortController();
        var signal = activeController.signal;

        var btnRefresh = document.getElementById('btn-refresh');
        var refreshIcon = document.getElementById('refresh-icon');
        var refreshLabel = document.getElementById('refresh-label');
        if (btnRefresh) btnRefresh.disabled = true;
        if (refreshIcon) refreshIcon.classList.add('spinning');
        if (refreshLabel) refreshLabel.textContent = 'Checking...';

        try {
          var res = await fetch('/api', {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
            signal: signal
          });
          if (signal.aborted) return;
          if (res.ok) {
            var data = await res.json();
            if (data && data.ip) {
              state.connectedIp = data.ip;
              state.version = data.version;
              var isV4 = data.version === 'IPv4';
              state.isLocal = isPrivateIp(data.ip);
              var primaryIpEl = document.getElementById('primary-ip');
              if (primaryIpEl) primaryIpEl.textContent = data.ip;
              var badge = document.getElementById('hero-protocol-badge');
              if (badge) {
                badge.className = 'protocol-badge ' + data.version.toLowerCase();
                badge.textContent = data.version;
              }
              var pulse = document.getElementById('hero-pulse');
              if (pulse) {
                pulse.className = 'status-pulse ' + data.version.toLowerCase();
              }
              var localBadge = document.getElementById('local-badge');
              if (localBadge && localBadge.style) {
                localBadge.style.display = state.isLocal ? 'inline-block' : 'none';
              }

              if (isV4 && !state.isLocal) {
                state.ipv4Status = 'connected';
                state.probedIpv4 = data.ip;
                updateStackCard('v4', 'connected', data.ip);
                state.ipv6Status = 'checking';
                updateStackCard('v6', 'checking');
              } else if (!isV4 && !state.isLocal) {
                state.ipv6Status = 'connected';
                state.probedIpv6 = data.ip;
                updateStackCard('v6', 'connected', data.ip);
                state.ipv4Status = 'checking';
                updateStackCard('v4', 'checking');
              } else {
                state.ipv4Status = 'checking';
                state.ipv6Status = 'checking';
                updateStackCard('v4', 'checking');
                updateStackCard('v6', 'checking');
              }
            }
          }
          await runProbes(activeController);
        } catch(e) {
          // Network error or aborted
        } finally {
          if (btnRefresh) btnRefresh.disabled = false;
          if (refreshIcon) refreshIcon.classList.remove('spinning');
          if (refreshLabel) refreshLabel.textContent = 'Re-check';
        }
      }

      function copyText(text, btn, successLabel) {
        if (!text) return;
        if (!btn._origHtml) {
          btn._origHtml = btn.innerHTML;
        }
        if (btn._copyTimer) {
          clearTimeout(btn._copyTimer);
        }
        function showSuccess() {
          btn.innerHTML = successLabel || '✓ Copied!';
          btn._copyTimer = setTimeout(function() {
            btn.innerHTML = btn._origHtml;
            btn._copyTimer = null;
            btn._origHtml = null;
          }, 2000);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(showSuccess).catch(function() {
            fallbackCopy(text, showSuccess);
          });
        } else {
          fallbackCopy(text, showSuccess);
        }
      }

      function fallbackCopy(text, callback) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          callback();
        } catch(e) {}
        document.body.removeChild(textarea);
      }

      function attachCopyListeners() {
        var buttons = document.querySelectorAll('[data-copy]');
        buttons.forEach(function(btn) {
          if (btn._hasCopyHandler) return;
          btn._hasCopyHandler = true;
          btn.addEventListener('click', function() {
            var text = btn.getAttribute('data-copy');
            copyText(text, btn, btn.classList.contains('btn-icon-copy') ? '✓' : 'Copied!');
          });
        });
      }

      // Initial setup
      document.getElementById('btn-copy-primary').addEventListener('click', function() {
        copyText(state.connectedIp, this, '✓ Copied!');
      });

      document.getElementById('btn-refresh').addEventListener('click', refresh);
      attachCopyListeners();

      // Start alternate stack probing
      activeController = new AbortController();
      runProbes(activeController);
    })();
  </script>
</body>
</html>`;
}
