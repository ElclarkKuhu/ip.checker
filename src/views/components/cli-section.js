// @ts-check

/**
 * @typedef {{
 *   desc: string,
 *   cmd: string
 * }} CliCommand
 */

/** @type {CliCommand[]} */
const CLI_COMMANDS = [
	{ desc: 'Plain text IP', cmd: 'curl org.elclark.id' },
	{ desc: 'JSON format', cmd: 'curl org.elclark.id/api' },
	{ desc: 'Force IPv4', cmd: 'curl -4 org.elclark.id' },
	{ desc: 'Force IPv6', cmd: 'curl -6 org.elclark.id' },
	{ desc: 'PowerShell', cmd: 'irm org.elclark.id' },
	{ desc: 'JSON via query', cmd: 'curl org.elclark.id?format=json' }
];

/**
 * Renders a single command snippet block.
 * @param {CliCommand} item
 * @returns {string}
 */
function renderCommandBlock({ desc, cmd }) {
	return `
        <div class="command-block">
          <div class="command-meta">
            <span class="command-desc">${desc}</span>
            <button type="button" class="btn-snippet-copy" data-copy="${cmd}">Copy</button>
          </div>
          <pre><code>${cmd}</code></pre>
        </div>`;
}

/**
 * Renders the CLI & API access section.
 * @returns {string}
 */
export function renderCliSection() {
	return `
    <!-- CLI & API Access Section -->
    <section class="cli-section" aria-labelledby="cli-heading">
      <h2 id="cli-heading" class="section-title">CLI &amp; API Access</h2>
      <p class="section-desc">Access your IP directly from terminal or automation scripts via <code>org.elclark.id</code>:</p>

      <div class="commands-grid">${CLI_COMMANDS.map(renderCommandBlock).join('')}
      </div>
    </section>`;
}
