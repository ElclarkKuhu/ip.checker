# org.elclark.id — Elclark Origin

Ultra-fast, lightweight, zero-framework, privacy-first IP and dual-stack IPv4/IPv6 diagnostics running on the Cloudflare edge.

**Primary Domain:** `https://org.elclark.id`  
**Branding:** Elclark Origin

## Highlights

- **Zero Framework & Zero Runtime Bloat**: Pure vanilla HTML, CSS, and modern JavaScript.
- **Edge SSR**: Renders connected client IP and protocol directly in initial HTML response from `CF-Connecting-IP` edge headers — zero layout shift and 0ms loading delay for primary IP.
- **CLI & Automation Ready**: Automatic detection of terminal clients (`curl`, `wget`, `httpie`, `irm` Windows PowerShell 5.1/pwsh 7, python, go, etc.) returning clean plain-text IP with trailing newline.
  - `curl org.elclark.id` / `irm org.elclark.id`
- **Dual-Stack Reachability Probing**: Client-side background probe tests alternate stack reachability (`icanhazip.com` and `ident.me`) bounded by a strict 3500ms cumulative deadline with fallback.
- **Public JSON API**: Dedicated `/api` endpoint or `?format=json` with full CORS headers (`Access-Control-Allow-Origin: *`).
- **Privacy First (Zero Logging)**: Ephemeral in-memory resolution, strict `Cache-Control: no-store`, no database, no analytics scripts, no cookies, no tracking fingerprinting.

## Project Structure

```
org.elclark.id/
├── wrangler.json      # Cloudflare Workers configuration (route: org.elclark.id)
├── server.js          # Lightweight Node.js server for local preview & testing
├── package.json       # Project metadata & npm test/typecheck/deploy scripts
├── jsconfig.json      # Strict JSDoc / TypeScript compiler configuration
├── tsconfig.json      # TypeScript runner compatibility config
├── src/
│   ├── index.js       # Cloudflare Worker fetch handler (CORS, content negotiation, routes)
│   ├── ip.js          # Pure isomorphic IP parsing, validation, and classification
│   ├── cli.js         # CLI user-agent detection & content negotiation
│   ├── probe.js       # Dual-stack probing logic with timeout and fallback
│   └── html.js        # Responsive minimalist zero-framework web UI generator
└── test/
    ├── unit.test.js   # Unit tests for IP validation and CLI detection
    ├── probe.test.js  # Unit tests for probe lifecycle and abort deadlines
    ├── client.test.js # DOM simulation and client script sandbox tests
    └── server.test.js # Integration & live socket tests
```

## Running Tests & Typecheck

```bash
npm test
npm run typecheck
```

## Local Development / Preview

```bash
npm start
# Server runs on http://localhost:8787
```

## Deployment (Cloudflare Workers)

This project is deployed to **Cloudflare Workers** with custom domain routing configured in `wrangler.json`:

```bash
npm run deploy
# or: npx wrangler deploy
```
