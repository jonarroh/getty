import { HttpRequest, KeyValuePair } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Converts current Request UI state to a cURL command string
 */
export const requestToCurl = (req: HttpRequest): string => {
	let curl = `curl -X ${req.method} '${req.url}'`;

	// Headers
	req.headers.forEach(h => {
		if (h.enabled && h.key) {
			curl += ` \\\n  -H '${h.key}: ${h.value}'`;
		}
	});

	// Body
	if (req.method !== 'GET' && req.method !== 'DELETE' && req.body) {
		if (req.bodyType === 'json') {
			// Minify JSON for curl
			try {
				const minified = JSON.stringify(JSON.parse(req.body));
				curl += ` \\\n  -d '${minified}'`;
				// Ensure Content-Type is present if not added manually
				if (
					!req.headers.find(
						h => h.key.toLowerCase() === 'content-type'
					)
				) {
					curl += ` \\\n  -H 'Content-Type: application/json'`;
				}
			} catch (e) {
				curl += ` \\\n  -d '${req.body}'`;
			}
		} else {
			curl += ` \\\n  -d '${req.body}'`;
		}
	}

	return curl;
};

/**
 * Simple parser for converting a cURL string back to a Request object
 * Note: This is a basic implementation. Robust cURL parsing is complex.
 */
export const curlToRequest = (curl: string): Partial<HttpRequest> => {
	const methodMatch = curl.match(/-X\s+([A-Z]+)/);
	const urlMatch = curl.match(/['"](https?:\/\/[^'"]+)['"]/);
	const bodyMatch = curl.match(/-d\s+['"]([^'"]+)['"]/);

	const headers: KeyValuePair[] = [];
	const headerRegex = /-H\s+['"]([^:]+):\s*([^'"]+)['"]/g;
	let match;
	while ((match = headerRegex.exec(curl)) !== null) {
		headers.push({
			id: uuidv4(),
			key: match[1].trim(),
			value: match[2].trim(),
			enabled: true
		});
	}

	return {
		method: (methodMatch ? methodMatch[1] : 'GET') as any,
		url: urlMatch ? urlMatch[1] : '',
		headers: headers,
		body: bodyMatch ? bodyMatch[1] : '',
		bodyType: 'json' // Default assumption
	};
};
