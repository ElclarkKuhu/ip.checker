// @ts-check

/**
 * Renders the diagnostics & notes section.
 * @returns {string}
 */
export function renderNotesSection() {
	return `
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
            Alternate stack reachability is tested via lightweight browser requests to <code class="inline-code">icanhazip.com</code>.
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
    </section>`;
}
