// @ts-check

/**
 * Renders the top navigation bar and header.
 * @returns {string}
 */
export function renderHeader() {
	return `
    <div class="top-bar">
      <a href="https://elclark.id" class="brand">
        <span>&larr; elclark.id</span>
      </a>
      <span class="brand-tag">Origin</span>
    </div>

    <header>
      <h1 class="page-title">What is my IP Address?</h1>
      <p class="page-subtitle">Origin - Lightweight, zero-logging network diagnostics running at the Cloudflare edge.</p>
    </header>`;
}
