# Origin

Lightweight IP and dual-stack IPv4/IPv6 diagnostics on Cloudflare Workers.

**Access:** `https://org.elclark.id`

## Features

- **Edge SSR:** Connected client IP rendered directly in the initial HTML response using `CF-Connecting-IP`.
- **CLI & Automation:** Returns clean plain-text IP for terminal clients (`curl`, `wget`, `httpie`, PowerShell `irm`, Python, etc.).
- **Dual-Stack Reachability:** Client-side background probing for alternate stack reachability (`icanhazip.com`).
- **JSON API:** Dedicated `/api` endpoint or `?format=json` with CORS enabled (`Access-Control-Allow-Origin: *`).
- **Stateless:** Ephemeral in-memory resolution, `Cache-Control: no-store`, zero logging, no database, no cookies, no tracking.

## Usage

```bash
# Plain text IP
curl org.elclark.id
# or Windows PowerShell:
irm org.elclark.id

# JSON response
curl org.elclark.id/api

# Force IPv4 / IPv6
curl -4 org.elclark.id
curl -6 org.elclark.id
```

## Project Structure

```
org.elclark.id/
├── wrangler.json      # Cloudflare Workers configuration
├── server.js          # Lightweight Node.js server for local preview & testing
├── package.json       # Project metadata & scripts
├── tsconfig.json      # TypeScript typecheck configuration
├── src/
│   ├── index.js       # Cloudflare Worker fetch handler
│   ├── ip.js          # IP parsing, validation, and classification
│   ├── cli.js         # CLI user-agent detection & content negotiation
│   ├── probe.js       # Dual-stack probing logic with timeout and fallback
│   └── html.js        # Responsive zero-framework web UI generator
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
