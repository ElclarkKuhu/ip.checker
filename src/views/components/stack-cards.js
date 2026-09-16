// @ts-check

/**
 * Renders an individual stack card (IPv4 or IPv6).
 *
 * @param {{
 *   type: 'v4' | 'v6',
 *   label: 'IPv4' | 'IPv6',
 *   status: 'connected' | 'checking',
 *   ip: string
 * }} card
 * @returns {string}
 */
function renderSingleStackCard({ type, label, status, ip }) {
	const isConnected = status === 'connected';
	const statusLabel = isConnected ? 'Connected' : 'Checking&hellip;';

	const content = isConnected
		? `<div class="ip-row">
              <span id="${type}-ip" class="ip-text font-mono">${ip}</span>
              <button type="button" class="btn-icon-copy" data-copy="${ip}" aria-label="Copy ${label} address" title="Copy ${label}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>`
		: `<div class="loading-placeholder">
              <span class="dot-flashing"></span>
              <span>Testing ${label} route&hellip;</span>
            </div>`;

	return `
      <!-- ${label} Card -->
      <div class="stack-card">
        <div class="card-top">
          <div class="card-title">
            <span class="pill ${type === 'v4' ? 'ipv4' : 'ipv6'}">${label}</span>
          </div>
          <div id="${type}-status-tag" class="status-tag status-${status}">
            ${statusLabel}
          </div>
        </div>

        <div id="${type}-content" class="card-content">
          ${content}
        </div>
      </div>`;
}

/**
 * Renders the dual stack breakdown grid.
 *
 * @param {{
 *   v4Status: 'connected' | 'checking',
 *   v6Status: 'connected' | 'checking',
 *   v4Ip: string,
 *   v6Ip: string
 * }} params
 * @returns {string}
 */
export function renderStackCards({ v4Status, v6Status, v4Ip, v6Ip }) {
	return `
    <!-- Dual Stack Breakdown (IPv4 & IPv6 Cards) -->
    <div class="stack-grid">${renderSingleStackCard({
			type: 'v4',
			label: 'IPv4',
			status: v4Status,
			ip: v4Ip
		})}${renderSingleStackCard({
			type: 'v6',
			label: 'IPv6',
			status: v6Status,
			ip: v6Ip
		})}
    </div>`;
}
