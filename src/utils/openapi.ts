import { v4 as uuidv4 } from 'uuid';
import { HttpRequest, KeyValuePair, Environment } from '../types';

interface OpenApiImportResult {
	name: string;
	environments: Environment[];
	folders: Record<string, HttpRequest[]>; // Map 'TagName' -> Requests
	rootRequests: HttpRequest[];
}

/**
 * Resolves a JSON Pointer reference (e.g., "#/components/schemas/MyType")
 */
const resolveRef = (ref: string, root: any): any => {
	if (!ref.startsWith('#/')) return null;

	const pathParts = ref.substring(2).split('/');
	let current = root;

	for (const part of pathParts) {
		if (current && typeof current === 'object' && part in current) {
			current = current[part];
		} else {
			return null;
		}
	}

	return current;
};

/**
 * Recursively generates an example JSON object from an OpenAPI Schema
 */
const generateExampleFromSchema = (
	schema: any,
	root: any,
	depth = 0
): any => {
	if (depth > 8) return null; // Prevent infinite recursion

	if (!schema) return null;

	// Handle $ref
	if (schema.$ref) {
		const resolved = resolveRef(schema.$ref, root);
		if (resolved) {
			return generateExampleFromSchema(resolved, root, depth + 1);
		}
		return {}; // Could not resolve
	}

	// Handle composition (allOf, oneOf, anyOf)
	if (schema.allOf && Array.isArray(schema.allOf)) {
		let combined = {};
		schema.allOf.forEach((subSchema: any) => {
			const example = generateExampleFromSchema(
				subSchema,
				root,
				depth
			);
			combined = { ...combined, ...example };
		});
		return combined;
	}

	// Naive handling for oneOf/anyOf - just take the first one
	if (
		schema.oneOf &&
		Array.isArray(schema.oneOf) &&
		schema.oneOf.length > 0
	) {
		return generateExampleFromSchema(schema.oneOf[0], root, depth);
	}

	if (schema.example !== undefined) return schema.example;
	if (schema.default !== undefined) return schema.default;

	if (schema.type === 'object' || schema.properties) {
		const obj: any = {};
		if (schema.properties) {
			Object.entries(schema.properties).forEach(
				([key, prop]: [string, any]) => {
					obj[key] = generateExampleFromSchema(prop, root, depth + 1);
				}
			);
		}
		return obj;
	}

	if (schema.type === 'array') {
		if (schema.items) {
			return [
				generateExampleFromSchema(schema.items, root, depth + 1)
			];
		}
		return [];
	}

	if (schema.type === 'string') {
		if (schema.format === 'date-time')
			return new Date().toISOString();
		if (schema.format === 'date')
			return new Date().toISOString().split('T')[0];
		if (schema.format === 'email') return 'user@example.com';
		if (schema.format === 'uuid')
			return '3fa85f64-5717-4562-b3fc-2c963f66afa6';
		if (schema.enum && schema.enum.length > 0) return schema.enum[0];
		return 'string';
	}

	if (schema.type === 'number' || schema.type === 'integer') return 0;
	if (schema.type === 'boolean') return true;

	return null;
};

export const parseOpenApi = (json: any): OpenApiImportResult => {
	// 1. Parse Servers into Environments
	const environments: Environment[] = [];

	if (json.servers && Array.isArray(json.servers)) {
		json.servers.forEach((server: any, index: number) => {
			environments.push({
				id: uuidv4(),
				name: server.description || `Server ${index + 1}`,
				variables: [
					{
						id: uuidv4(),
						key: 'baseUrl',
						value: server.url || 'http://localhost',
						enabled: true
					}
				]
			});
		});
	}

	// Fallback environment if no servers found
	if (environments.length === 0) {
		let baseUrl = 'https://api.example.com';
		if (json.host) {
			const scheme =
				json.schemes && json.schemes.length > 0
					? json.schemes[0]
					: 'https';
			const basePath = json.basePath || '';
			baseUrl = `${scheme}://${json.host}${basePath}`;
		}
		environments.push({
			id: uuidv4(),
			name: 'Default',
			variables: [
				{
					id: uuidv4(),
					key: 'baseUrl',
					value: baseUrl,
					enabled: true
				}
			]
		});
	}

	const result: OpenApiImportResult = {
		name: json.info?.title || 'Imported Collection',
		environments,
		folders: {},
		rootRequests: []
	};

	if (!json.paths) return result;

	Object.entries(json.paths).forEach(
		([path, methods]: [string, any]) => {
			if (!methods) return;

			Object.entries(methods).forEach(
				([method, details]: [string, any]) => {
					if (
						['get', 'post', 'put', 'delete', 'patch'].includes(
							method.toLowerCase()
						)
					) {
						const params: KeyValuePair[] = [];
						const headers: KeyValuePair[] = [];

						// 2. Extract Path Params (e.g. /users/{id})
						const pathParams = path.match(/{([^}]+)}/g);
						if (pathParams) {
							pathParams.forEach(p => {
								const key = p.replace(/[{}]/g, '');
								params.push({
									id: uuidv4(),
									key,
									value: '',
									enabled: true
								});
							});
						}

						// 3. Extract defined Parameters (Query, Header)
						if (
							details.parameters &&
							Array.isArray(details.parameters)
						) {
							details.parameters.forEach((p: any) => {
								// Handle $ref in parameters too
								let paramDef = p;
								if (p.$ref) {
									const resolved = resolveRef(p.$ref, json);
									if (resolved) paramDef = resolved;
								}

								if (paramDef.in === 'query') {
									params.push({
										id: uuidv4(),
										key: paramDef.name,
										value: paramDef.schema?.default || '',
										enabled: true
									});
								} else if (paramDef.in === 'header') {
									headers.push({
										id: uuidv4(),
										key: paramDef.name,
										value: paramDef.schema?.default || '',
										enabled: true
									});
								}
							});
						}

						// 4. Extract Body
						let body = '';
						let bodyType: 'none' | 'json' | 'text' = 'none';

						if (details.requestBody?.content?.['application/json']) {
							bodyType = 'json';
							const schema =
								details.requestBody.content['application/json']
									.schema;
							if (schema) {
								// Pass the root JSON object to resolve references
								const example = generateExampleFromSchema(
									schema,
									json
								);
								body = JSON.stringify(example, null, 2);
							} else {
								body = '{}';
							}
						}

						// 5. Build Request Object
						const req: HttpRequest = {
							id: uuidv4(),
							name:
								details.summary || `${method.toUpperCase()} ${path}`,
							method: method.toUpperCase() as any,
							url: `{{baseUrl}}${path}`,
							headers,
							params,
							cookies: [],
							bodyType,
							body
						};

						// 6. Categorize by Tags (Folders)
						if (
							details.tags &&
							Array.isArray(details.tags) &&
							details.tags.length > 0
						) {
							const tag = details.tags[0];
							if (!result.folders[tag]) {
								result.folders[tag] = [];
							}
							result.folders[tag].push(req);
						} else {
							result.rootRequests.push(req);
						}
					}
				}
			);
		}
	);

	return result;
};
