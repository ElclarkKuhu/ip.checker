// @ts-check
import { isPrivateIp } from '../ip.js';
import { styles } from './styles.js';
import { renderHeader } from './components/header.js';
import { renderHeroCard } from './components/hero-card.js';
import { renderStackCards } from './components/stack-cards.js';
import { renderCliSection } from './components/cli-section.js';
import { renderNotesSection } from './components/notes-section.js';
import { renderFooter } from './components/footer.js';
import { renderClientScript } from './client-script.js';

/**
 * Escapes HTML characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
	if (!str) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Renders the complete web UI HTML page.
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
  <title>What is my IP Address? - Origin</title>
  <meta name="description" content="Origin - Lightweight IP and dual-stack IPv4/IPv6 diagnostics on the edge.">
  <meta property="og:title" content="What is my IP Address? - Origin">
  <meta property="og:description" content="Origin - Inspect your public IP address and verify IPv4 and IPv6 dual-stack reachability. Zero-logging, tracker-free.">
  <meta property="og:url" content="https://org.elclark.id">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="What is my IP Address? - Origin">
  <meta name="twitter:description" content="Origin - Inspect your public IP address and verify IPv4 and IPv6 dual-stack reachability. Zero-logging, tracker-free.">
  <link rel="canonical" href="https://org.elclark.id">
  <link rel="icon" type="image/png" href="https://elclark.id/favicon.png">
  <link rel="alternate icon" href="https://elclark.id/favicon.ico">
  <style>${styles}
  </style>
</head>
<body>
  <div class="container">
    ${renderHeader()}
    ${renderHeroCard({ safeIp, version, isLocal })}
    ${renderStackCards({ v4Status, v6Status, v4Ip, v6Ip })}
    ${renderCliSection()}
    ${renderNotesSection()}
  </div>
  ${renderFooter()}
  ${renderClientScript({ ip, version, isLocal, isV4, isV6, v4Status, v6Status })}
</body>
</html>`;
}
