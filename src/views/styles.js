// @ts-check

/**
 * Embedded CSS styles for the Web UI.
 */
export const styles = `
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
      max-width: 64rem;
      margin: 0 auto;
      padding: 3rem 1.5rem 5rem;
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
      overflow-wrap: anywhere;
      word-break: normal;
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

    /* Hero Dual Stack Status Footer */
    .dual-stack-banner {
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      transition: all 0.2s ease;
    }

    .dual-stack-banner strong {
      color: var(--text);
      font-weight: 600;
    }

    .dual-stack-banner.active {
      color: var(--text-muted);
    }

    .dual-stack-banner.active strong {
      color: var(--text);
    }

    .banner-icon {
      font-size: 0.75rem;
      line-height: 1;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-card-subtle);
      border: 1px solid var(--border);
      color: var(--text-dim);
      flex-shrink: 0;
    }

    .dual-stack-banner.active .banner-icon {
      background: var(--accent-ipv4-bg);
      border-color: rgba(16, 185, 129, 0.35);
      color: var(--accent-ipv4);
      font-weight: 700;
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
      padding: 0.95rem 1.15rem;
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
      margin-bottom: 0.65rem;
      padding-bottom: 0.55rem;
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
      min-height: 2.25rem;
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
      font-size: clamp(0.95rem, 1.35vw, 1.08rem);
      font-weight: 650;
      letter-spacing: -0.02em;
      color: var(--text);
      overflow-wrap: anywhere;
      word-break: normal;
      line-height: 1.3;
    }

    .btn-icon-copy {
      background: var(--bg-card-subtle);
      border: 1px solid var(--border);
      color: var(--text-muted);
      border-radius: 6px;
      width: 32px;
      height: 32px;
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
        padding: 1.25rem 0.85rem 3rem;
      }
      .page-title {
        font-size: clamp(1.4rem, 5.5vw, 1.85rem);
      }
      .page-subtitle {
        font-size: 0.85rem;
        margin-bottom: 1.5rem;
      }
      .hero-card {
        padding: 1.15rem;
      }
      .hero-header {
        flex-wrap: nowrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
      }
      .hero-meta {
        flex-wrap: nowrap;
        font-size: 0.8rem;
        gap: 0.45rem;
        min-width: 0;
      }
      .meta-label {
        white-space: nowrap;
      }
      .btn-refresh {
        padding: 0.35rem 0.65rem;
        font-size: 0.775rem;
        flex-shrink: 0;
      }
      .hero-body {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      .btn-copy {
        width: 100%;
        justify-content: center;
      }
      .dual-stack-banner {
        margin-top: 1rem;
        padding-top: 0.85rem;
        font-size: 0.8rem;
        gap: 0.6rem;
      }
    }

    @media (max-width: 440px) {
      .meta-adv {
        display: none;
      }
    }
`;
