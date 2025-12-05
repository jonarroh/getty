export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface KeyValuePair {
	id: string;
	key: string;
	value: string;
	enabled: boolean;
}

export interface HttpRequest {
	id: string;
	name: string;
	method: HttpMethod;
	url: string;
	headers: KeyValuePair[];
	params: KeyValuePair[];
	cookies: KeyValuePair[];
	bodyType: 'none' | 'json' | 'text';
	body: string;
}

export interface HttpResponse {
	statusCode: number;
	time: number; // ms
	size: number; // bytes
	headers: Record<string, string>;
	cookies: Record<string, string>;
	body: any;
	contentType: string;
}

export interface Folder {
	id: string;
	name: string;
	requests: string[]; // Request IDs
}

export interface Environment {
	id: string;
	name: string;
	variables: KeyValuePair[];
	headers?: KeyValuePair[]; // Shared headers for this environment
}

export interface Project {
	id: string;
	name: string;
	color: string;
}

export interface Collection {
	id: string;
	projectId: string; // Linked to a Project
	name: string;
	color?: string; // Optional identifier color
	folders: Folder[];
	requests: string[]; // Request IDs at root level
	environments: Environment[]; // Collection-specific environments
	activeEnvironmentId: string | null;
}

export interface ThemeColors {
	background: string;
	surface: string;
	primary: string;
	secondary: string;
	accent: string;
	danger: string;
	warning: string;
}

export interface Theme {
	id: string;
	name: string;
	colors: ThemeColors;
}

// Payload structure for Tauri backend
export interface TauriRequestPayload {
	method: string;
	url: string;
	headers: Record<string, string>;
	cookies?: Record<string, string>;
	body?: string;
}
