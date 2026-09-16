// @ts-check
import http from 'node:http';
import worker from './src/index.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8787;

/**
 * Converts a Node.js IncomingMessage to a standard WHATWG Request.
 * @param {http.IncomingMessage} req
 * @returns {Promise<Request>}
 */
async function toWebRequest(req) {
	const protocol = req.headers['x-forwarded-proto'] || 'http';
	const host = req.headers.host || `localhost:${PORT}`;
	const url = `${protocol}://${host}${req.url}`;

	const headers = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		if (value === undefined) continue;
		if (Array.isArray(value)) {
			for (const v of value) headers.append(key, v);
		} else {
			headers.set(key, value);
		}
	}

	if (
		!headers.has('cf-connecting-ip') &&
		!headers.has('x-real-ip') &&
		!headers.has('x-forwarded-for') &&
		req.socket?.remoteAddress
	) {
		headers.set('x-forwarded-for', req.socket.remoteAddress);
	}

	/** @type {RequestInit} */
	const init = {
		method: req.method,
		headers
	};

	if (req.method !== 'GET' && req.method !== 'HEAD') {
		/** @type {Buffer[]} */
		const chunks = [];
		for await (const chunk of req) {
			chunks.push(chunk);
		}
		init.body = Buffer.concat(chunks);
	}

	return new Request(url, init);
}

/**
 * Creates and starts the Node HTTP server.
 * @param {number} [port=PORT]
 * @returns {Promise<http.Server>}
 */
export function startServer(port = PORT) {
	return new Promise((resolve) => {
		const server = http.createServer(async (nodeReq, nodeRes) => {
			try {
				const webReq = await toWebRequest(nodeReq);
				const webRes = await worker.fetch(webReq);

				nodeRes.statusCode = webRes.status;
				webRes.headers.forEach((val, key) => {
					nodeRes.setHeader(key, val);
				});

				if (webRes.body) {
					const reader = webRes.body.getReader();
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						nodeRes.write(value);
					}
				}
				nodeRes.end();
			} catch (err) {
				console.error('Server error:', err);
				if (!nodeRes.headersSent) {
					nodeRes.statusCode = 500;
					nodeRes.end('Internal Server Error');
				} else {
					nodeRes.destroy();
				}
			}
		});

		server.listen(port, () => {
			resolve(server);
		});
	});
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
	startServer(PORT).then(() => {
		console.log(`org.elclark.id server running at http://localhost:${PORT}`);
	});
}
