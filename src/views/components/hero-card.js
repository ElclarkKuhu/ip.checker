// @ts-check

/**
 * Renders the primary connected IP hero card.
 *
 * @param {{
 *   safeIp: string,
 *   version: 'IPv4' | 'IPv6',
 *   isLocal: boolean
 * }} params
 * @returns {string}
 */
export function renderHeroCard({ safeIp, version, isLocal }) {
	const versionLower = version.toLowerCase();

	return `
    <!-- Primary Connected IP Hero Card -->
    <section class="hero-card" aria-label="Connected IP Information">
      <div class="hero-header">
        <div class="hero-meta">
          <span id="hero-pulse" class="status-pulse ${versionLower}" aria-hidden="true"></span>
          <span class="meta-label"><span class="meta-adv">Currently </span>Connected Via</span>
          <span id="hero-protocol-badge" class="protocol-badge ${versionLower}">${version}</span>
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

      <!-- Dual Stack Status Footer -->
      <div id="dual-stack-banner" class="dual-stack-banner" role="status">
        <span id="banner-icon" class="banner-icon">&bull;</span>
        <span id="banner-text">
          <strong>Testing Dual-Stack Reachability</strong> - Probing alternate IP stack from your browser...
        </span>
      </div>
    </section>`;
}
