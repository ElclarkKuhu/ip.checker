// @ts-check
import { isPrivateIp, isValidIpv4, isValidIpv6 } from '../ip.js';
import { IPV4_PROBE_ENDPOINTS, IPV6_PROBE_ENDPOINTS } from '../probe.js';

/**
 * Generates the client-side probe and interactivity JavaScript payload.
 *
 * @param {{
 *   ip: string,
 *   version: 'IPv4' | 'IPv6',
 *   isLocal: boolean,
 *   isV4: boolean,
 *   isV6: boolean,
 *   v4Status: string,
 *   v6Status: string
 * }} params
 * @returns {string}
 */
export function renderClientScript({
	ip,
	version,
	isLocal,
	isV4,
	isV6,
	v4Status,
	v6Status
}) {
	return `
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
  </script>`;
}
