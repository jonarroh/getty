import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
	Collection,
	Environment,
	HttpRequest,
	HttpResponse,
	KeyValuePair,
	Project,
	Theme
} from '../types';
import { invokeHttp } from '../lib/tauri';
import { parseOpenApi } from '../utils/openapi';
import { persist } from './middleware';

// --- Utils: Hex to RGB ---
const hexToRgb = (hex: string): string => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
		hex
	);
	return result
		? `${parseInt(result[1], 16)} ${parseInt(
				result[2],
				16
		  )} ${parseInt(result[3], 16)}`
		: '0 0 0';
};

// --- Settings Store ---

interface SettingsState {
	themes: Theme[];
	activeThemeId: string;
	language: string;
	setTheme: (id: string) => void;
	setLanguage: (lang: string) => void;
	updateThemes: (themes: Theme[]) => void;
	syncDefaultThemes: () => void;
	applyThemeToDom: () => void;
}

const defaultThemes: Theme[] = [
	{
		id: 'midnight-purple',
		name: 'Midnight Purple',
		colors: {
			background: '#13111C',
			surface: '#1F1B2E',
			primary: '#A855F7',
			secondary: '#94A3B8',
			accent: '#F97316',
			danger: '#EF4444',
			warning: '#F59E0B'
		}
	},
	{
		id: 'ocean-blue',
		name: 'Ocean Blue',
		colors: {
			background: '#0f172a',
			surface: '#1e293b',
			primary: '#38bdf8',
			secondary: '#94a3b8',
			accent: '#f472b6',
			danger: '#ef4444',
			warning: '#fbbf24'
		}
	},
	{
		id: 'forest-green',
		name: 'Forest Green',
		colors: {
			background: '#052e16',
			surface: '#064e3b',
			primary: '#34d399',
			secondary: '#a7f3d0',
			accent: '#fbbf24',
			danger: '#f87171',
			warning: '#34d399'
		}
	},
	{
		id: 'crimson-dark',
		name: 'Crimson Dark',
		colors: {
			background: '#2a0a0a',
			surface: '#451a1a',
			primary: '#f87171',
			secondary: '#fca5a5',
			accent: '#fbbf24',
			danger: '#ef4444',
			warning: '#fbbf24'
		}
	},
	{
		id: 'light-purple',
		name: 'Light Purple',
		colors: {
			background: '#F9FAFB',
			surface: '#FFFFFF',
			primary: '#7C3AED',
			secondary: '#1F2937',
			accent: '#F59E0B',
			danger: '#DC2626',
			warning: '#F59E0B'
		}
	}
];

export const useSettingsStore = create<SettingsState>()(
	persist(
		(set, get) => ({
			themes: defaultThemes,
			activeThemeId: 'midnight-purple',
			language: 'en',

			setTheme: (id: string) => {
				set({ activeThemeId: id });
				get().applyThemeToDom();
			},

			setLanguage: (lang: string) => {
				set({ language: lang });
			},

			updateThemes: (themes: Theme[]) => {
				console.log('Store: updateThemes called with:', themes);
				set({ themes });
				get().applyThemeToDom();
			},

			// Método para sincronizar con los temas por defecto
			syncDefaultThemes: () => {
				const currentThemes = get().themes;
				const themeIds = new Set(currentThemes.map(t => t.id));
				const newThemes = [...currentThemes];

				// Agregar temas por defecto que no existan
				defaultThemes.forEach(defaultTheme => {
					if (!themeIds.has(defaultTheme.id)) {
						newThemes.push(defaultTheme);
					}
				});

				if (newThemes.length !== currentThemes.length) {
					set({ themes: newThemes });
				}
			},

			applyThemeToDom: () => {
				const { themes, activeThemeId } = get();
				const activeTheme =
					themes.find(t => t.id === activeThemeId) || themes[0];
				const { colors } = activeTheme;

				console.log(
					'Store: Applying theme to DOM:',
					activeTheme.name,
					colors
				);

				const root = document.documentElement;
				root.style.setProperty(
					'--c-bg',
					hexToRgb(colors.background),
					'important'
				);
				root.style.setProperty(
					'--c-surface',
					hexToRgb(colors.surface),
					'important'
				);
				root.style.setProperty(
					'--c-primary',
					hexToRgb(colors.primary),
					'important'
				);
				root.style.setProperty(
					'--c-secondary',
					hexToRgb(colors.secondary),
					'important'
				);
				root.style.setProperty(
					'--c-accent',
					hexToRgb(colors.accent),
					'important'
				);
				root.style.setProperty(
					'--c-danger',
					hexToRgb(colors.danger),
					'important'
				);
				root.style.setProperty(
					'--c-warning',
					hexToRgb(colors.warning),
					'important'
				);

				console.log('✅ Theme applied successfully!');
			}
		}),
		{
			name: 'settings',
			partialize: state => ({
				themes: state.themes,
				activeThemeId: state.activeThemeId,
				language: state.language
			})
		}
	)
);

// --- Environment Store ---

interface EnvState {
	environments: Environment[];
	activeEnvId: string | null;
	addEnvironment: (name: string) => void;
	setActiveEnv: (id: string | null) => void;
	updateEnvironment: (
		id: string,
		updates: Partial<Environment>
	) => void;
	deleteEnvironment: (id: string) => void;
	getActiveEnv: () => Environment | undefined;
	processVariables: (text: string) => string;
}

export const useEnvStore = create<EnvState>()(
	persist(
		(set, get) => ({
			environments: [
				{ id: 'default', name: 'Global', variables: [], headers: [] }
			],
			activeEnvId: 'default',
			addEnvironment: (name: string) =>
				set(state => ({
					environments: [
						...state.environments,
						{ id: uuidv4(), name, variables: [], headers: [] }
					]
				})),
			setActiveEnv: (id: string | null) => set({ activeEnvId: id }),

			updateEnvironment: (
				id: string,
				updates: Partial<Environment>
			) =>
				set(state => ({
					environments: state.environments.map(e =>
						e.id === id ? { ...e, ...updates } : e
					)
				})),

			deleteEnvironment: (id: string) =>
				set(state => ({
					environments: state.environments.filter(e => e.id !== id),
					activeEnvId:
						state.activeEnvId === id ? null : state.activeEnvId
				})),

			getActiveEnv: () => {
				const { environments, activeEnvId } = get();
				return environments.find(e => e.id === activeEnvId);
			},

			processVariables: (text: string) => {
				const env = get().getActiveEnv();
				if (!env || !text) return text;

				let processed = text;
				env.variables.forEach(v => {
					if (v.enabled) {
						const regex = new RegExp(`{{\\s*${v.key}\\s*}}`, 'g');
						processed = processed.replace(regex, v.value);
					}
				});

				return processed;
			}
		}),
		{
			name: 'environments',
			partialize: state => ({
				environments: state.environments,
				activeEnvId: state.activeEnvId
			})
		}
	)
);

// --- Request Store ---

interface RequestState {
	activeRequest: HttpRequest;
	loading: boolean;
	response: HttpResponse | null;
	error: string | null;
	isResponseDrawerOpen: boolean;
	activeTab: 'params' | 'headers' | 'cookies' | 'body';

	setMethod: (method: HttpRequest['method']) => void;
	setUrl: (url: string) => void;
	setHeaders: (headers: KeyValuePair[]) => void;
	setParams: (params: KeyValuePair[]) => void;
	setCookies: (cookies: KeyValuePair[]) => void;
	setBody: (body: string) => void;
	setBodyType: (type: HttpRequest['bodyType']) => void;
	setResponseDrawerOpen: (isOpen: boolean) => void;
	setActiveTab: (
		tab: 'params' | 'headers' | 'cookies' | 'body'
	) => void;

	loadRequest: (req: HttpRequest) => void;
	updateActiveRequestName: (name: string) => void;
	sendRequest: () => Promise<void>;

	addHeader: () => void;
	updateHeader: (
		id: string,
		field: 'key' | 'value' | 'enabled',
		val: any
	) => void;
	removeHeader: (id: string) => void;
}

const defaultRequest: HttpRequest = {
	id: 'temp',
	name: 'New Request',
	method: 'GET',
	url: '',
	headers: [
		{
			id: '1',
			key: 'Content-Type',
			value: 'application/json',
			enabled: true
		}
	],
	params: [],
	cookies: [],
	bodyType: 'json',
	body: '{\n\t\n}'
};

export const useRequestStore = create<RequestState>((set, get) => ({
	activeRequest: { ...defaultRequest },
	loading: false,
	response: null,
	error: null,
	isResponseDrawerOpen: false,
	activeTab: 'params',

	setMethod: (method: HttpRequest['method']) =>
		set(state => ({
			activeRequest: { ...state.activeRequest, method }
		})),

	setUrl: (url: string) =>
		set(state => ({
			activeRequest: { ...state.activeRequest, url }
		})),

	setHeaders: (headers: KeyValuePair[]) =>
		set(state => ({
			activeRequest: { ...state.activeRequest, headers }
		})),

	setParams: (params: KeyValuePair[]) =>
		set(state => ({
			activeRequest: { ...state.activeRequest, params }
		})),

	setCookies: (cookies: KeyValuePair[]) =>
		set(state => ({
			activeRequest: { ...state.activeRequest, cookies }
		})),

	setBody: (body: string) =>
		set(state => ({
			activeRequest: { ...state.activeRequest, body }
		})),

	setBodyType: (bodyType: HttpRequest['bodyType']) =>
		set(state => ({
			activeRequest: { ...state.activeRequest, bodyType }
		})),

	setResponseDrawerOpen: (isOpen: boolean) =>
		set({ isResponseDrawerOpen: isOpen }),

	setActiveTab: (tab: 'params' | 'headers' | 'cookies' | 'body') =>
		set({ activeTab: tab }),

	loadRequest: (req: HttpRequest) =>
		set({ activeRequest: { ...req }, response: null, error: null }),

	updateActiveRequestName: (name: string) =>
		set(state => ({
			activeRequest: { ...state.activeRequest, name }
		})),

	addHeader: () =>
		set(state => ({
			activeRequest: {
				...state.activeRequest,
				headers: [
					...state.activeRequest.headers,
					{ id: uuidv4(), key: '', value: '', enabled: true }
				]
			}
		})),

	updateHeader: (
		id: string,
		field: 'key' | 'value' | 'enabled',
		val: any
	) =>
		set(state => ({
			activeRequest: {
				...state.activeRequest,
				headers: state.activeRequest.headers.map(h =>
					h.id === id ? { ...h, [field]: val } : h
				)
			}
		})),

	removeHeader: (id: string) =>
		set(state => ({
			activeRequest: {
				...state.activeRequest,
				headers: state.activeRequest.headers.filter(h => h.id !== id)
			}
		})),

	sendRequest: async () => {
		const { activeRequest } = get();
		const { activeCollectionId, collections } =
			useCollectionStore.getState();

		let mergedVariables: Record<string, string> = {};
		let activeEnvName: string | null = null;
		let availableEnvs: string[] = [];

		// 1. Add Global Variables (lower priority)
		const globalEnv = useEnvStore.getState().getActiveEnv();
		if (globalEnv) {
			globalEnv.variables.forEach(v => {
				if (v.enabled) mergedVariables[v.key] = v.value;
			});
			activeEnvName = `Global: ${globalEnv.name}`;
		}

		// 2. Collect all available environments for error message
		const allGlobalEnvs = useEnvStore.getState().environments;
		allGlobalEnvs.forEach(env => {
			availableEnvs.push(`Global: ${env.name}`);
		});
		collections.forEach(col => {
			col.environments.forEach(env => {
				availableEnvs.push(`${col.name} > ${env.name}`);
			});
		});

		// 3. Add Collection Variables if active (higher priority, overrides global)
		let activeCollectionEnv = null;
		if (activeCollectionId) {
			const col = collections.find(c => c.id === activeCollectionId);
			if (col && col.activeEnvironmentId) {
				const env = col.environments.find(
					e => e.id === col.activeEnvironmentId
				);
				if (env) {
					env.variables.forEach(v => {
						if (v.enabled) mergedVariables[v.key] = v.value;
					});
					activeEnvName = `Collection: ${col.name} > ${env.name}`;
					activeCollectionEnv = env;
				}
			}
		}

		// Custom processor using merged variables
		const resolveVars = (str: string) => {
			if (!str) return str;
			let processed = str;
			Object.entries(mergedVariables).forEach(([key, val]) => {
				const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
				processed = processed.replace(regex, val);
			});
			return processed;
		};

		set({
			loading: true,
			error: null,
			response: null,
			isResponseDrawerOpen: true
		});

		try {
			// Prepare Payload
			const finalUrl = resolveVars(activeRequest.url);

			// Validate that all variables were resolved
			if (finalUrl.includes('{{')) {
				const unresolvedVars = finalUrl.match(/{{\s*([^}]+)\s*}}/g);
				const varNames = unresolvedVars
					?.map(v => v.replace(/[{}]/g, '').trim())
					.join(', ');
				const envList =
					availableEnvs.length > 0
						? `\n\nEnvironments disponibles:\n${availableEnvs
								.map(e => `  • ${e}`)
								.join('\n')}`
						: '';
				throw new Error(
					`Variables sin resolver: ${varNames}\n\nEnvironment activo: ${
						activeEnvName || '❌ Ninguno'
					}${envList}`
				);
			}

			const finalHeaders: Record<string, string> = {};

			// 1. First add global shared headers (lowest priority)
			if (globalEnv?.headers) {
				globalEnv.headers.forEach(h => {
					if (h.enabled && h.key) {
						finalHeaders[resolveVars(h.key)] = resolveVars(h.value);
					}
				});
			}

			// 2. Then add shared headers from collection environment (medium priority)
			if (activeCollectionEnv?.headers) {
				activeCollectionEnv.headers.forEach(h => {
					if (h.enabled && h.key) {
						finalHeaders[resolveVars(h.key)] = resolveVars(h.value);
					}
				});
			}

			// 3. Finally add/override with request-specific headers (highest priority)
			activeRequest.headers.forEach(h => {
				if (h.enabled && h.key) {
					finalHeaders[resolveVars(h.key)] = resolveVars(h.value);
				}
			});

			// Validate URL format
			let urlToUse = finalUrl;
			if (
				!finalUrl.startsWith('http://') &&
				!finalUrl.startsWith('https://')
			) {
				urlToUse = `https://${finalUrl}`;
			}

			// Append Query Params to URL
			const urlObj = new URL(urlToUse);
			activeRequest.params.forEach(p => {
				if (p.enabled && p.key) {
					urlObj.searchParams.append(
						resolveVars(p.key),
						resolveVars(p.value)
					);
				}
			});

			const processedBody = activeRequest.body
				? resolveVars(activeRequest.body)
				: undefined;

			// Procesar cookies
			const finalCookies: Record<string, string> = {};
			if (activeRequest.cookies) {
				activeRequest.cookies.forEach(c => {
					if (c.enabled && c.key) {
						finalCookies[resolveVars(c.key)] = resolveVars(c.value);
					}
				});
			}

			const res = await invokeHttp({
				method: activeRequest.method,
				url: urlObj.toString(),
				headers: finalHeaders,
				cookies:
					Object.keys(finalCookies).length > 0
						? finalCookies
						: undefined,
				body: processedBody
			});

			set({ response: res, loading: false });
		} catch (err: any) {
			set({
				error: err.message || 'Error desconocido',
				loading: false
			});
		}
	}
}));

// --- Collection Store ---

interface CollectionState {
	projects: Project[];
	collections: Collection[];
	savedRequests: Record<string, HttpRequest>;
	activeCollectionId: string | null;
	viewMode: 'request' | 'collection';
	collectionContentTabs: Record<string, 'variables' | 'headers'>; // Track active content tab per collection

	isImportModalOpen: boolean;
	importTargetProjectId: string | null;

	createProject: (name: string, color: string) => void;
	updateProject: (id: string, updates: Partial<Project>) => void;
	deleteProject: (id: string) => void;

	createCollection: (
		name: string,
		projectId: string,
		color?: string
	) => void;
	updateCollection: (
		id: string,
		updates: Partial<Collection>
	) => void;
	importCollection: (projectId: string, jsonContent: any) => void;
	deleteCollection: (id: string) => void;

	saveRequest: (req: HttpRequest, collectionId: string) => void;
	updateSavedRequest: (req: HttpRequest) => void;

	openCollectionSettings: (id: string) => void;
	openRequestView: () => void;
	openImportModal: (projectId: string) => void;
	closeImportModal: () => void;

	addCollectionEnv: (collectionId: string, name: string) => void;
	updateCollectionEnv: (
		collectionId: string,
		envId: string,
		updates: Partial<Environment>
	) => void;
	removeCollectionEnv: (collectionId: string, envId: string) => void;
	setCollectionActiveEnv: (
		collectionId: string,
		envId: string | null
	) => void;
	setCollectionContentTab: (
		collectionId: string,
		tab: 'variables' | 'headers'
	) => void;
}

export const useCollectionStore = create<CollectionState>()(
	persist(
		(set, _get) => ({
			projects: [
				{
					id: 'default-project',
					name: 'My Workspace',
					color: '#A855F7'
				}
			],
			collections: [],
			savedRequests: {},
			activeCollectionId: null,
			viewMode: 'request',
			collectionContentTabs: {},
			isImportModalOpen: false,
			importTargetProjectId: null, // Projects
			createProject: (name: string, color: string) =>
				set(state => ({
					projects: [...state.projects, { id: uuidv4(), name, color }]
				})),

			updateProject: (id: string, updates: Partial<Project>) =>
				set(state => ({
					projects: state.projects.map(p =>
						p.id === id ? { ...p, ...updates } : p
					)
				})),

			deleteProject: (id: string) =>
				set(state => ({
					projects: state.projects.filter(p => p.id !== id),
					collections: state.collections.filter(
						c => c.projectId !== id
					)
				})),

			// Collections
			createCollection: (
				name: string,
				projectId: string,
				color?: string
			) =>
				set(state => ({
					collections: [
						...state.collections,
						{
							id: uuidv4(),
							projectId,
							name,
							color: color || '#34d399',
							folders: [],
							requests: [],
							environments: [
								{
									id: uuidv4(),
									name: 'Default',
									variables: [],
									headers: []
								}
							],
							activeEnvironmentId: null
						}
					]
				})),

			updateCollection: (id: string, updates: Partial<Collection>) =>
				set(state => ({
					collections: state.collections.map(c =>
						c.id === id ? { ...c, ...updates } : c
					)
				})),

			importCollection: (projectId: string, jsonContent: any) =>
				set(state => {
					try {
						const parsed = parseOpenApi(jsonContent);
						const collectionId = uuidv4();

						const newSavedRequests = { ...state.savedRequests };
						const newFolders: any[] = [];
						const rootRequestIds: string[] = [];

						// Process Root Requests
						parsed.rootRequests.forEach(req => {
							newSavedRequests[req.id] = req;
							rootRequestIds.push(req.id);
						});

						// Process Folders
						Object.entries(parsed.folders).forEach(
							([folderName, requests]) => {
								const folderId = uuidv4();
								const folderReqIds: string[] = [];

								(requests as HttpRequest[]).forEach(req => {
									newSavedRequests[req.id] = req;
									folderReqIds.push(req.id);
								});

								newFolders.push({
									id: folderId,
									name: folderName,
									requests: folderReqIds
								});
							}
						);

						const newCollection: Collection = {
							id: collectionId,
							projectId,
							name: parsed.name,
							folders: newFolders,
							requests: rootRequestIds,
							environments: parsed.environments,
							activeEnvironmentId:
								parsed.environments.length > 0
									? parsed.environments[0].id
									: null
						};

						return {
							savedRequests: newSavedRequests,
							collections: [...state.collections, newCollection]
						};
					} catch (e) {
						console.error('Import failed:', e);
						return state;
					}
				}),

			deleteCollection: (id: string) =>
				set(state => ({
					collections: state.collections.filter(c => c.id !== id),
					activeCollectionId:
						state.activeCollectionId === id
							? null
							: state.activeCollectionId,
					viewMode:
						state.activeCollectionId === id
							? 'request'
							: state.viewMode
				})),

			saveRequest: (req: HttpRequest, collectionId: string) =>
				set(state => {
					const newId = uuidv4();
					const newReq = { ...req, id: newId };

					return {
						savedRequests: {
							...state.savedRequests,
							[newId]: newReq
						},
						collections: state.collections.map(c =>
							c.id === collectionId
								? { ...c, requests: [...c.requests, newId] }
								: c
						)
					};
				}),

			updateSavedRequest: (req: HttpRequest) =>
				set(state => ({
					savedRequests: { ...state.savedRequests, [req.id]: req }
				})),

			openCollectionSettings: (id: string) =>
				set({
					activeCollectionId: id,
					viewMode: 'collection'
				}),

			openRequestView: () =>
				set({
					viewMode: 'request'
				}),

			openImportModal: (projectId: string) =>
				set({
					isImportModalOpen: true,
					importTargetProjectId: projectId
				}),

			closeImportModal: () =>
				set({
					isImportModalOpen: false,
					importTargetProjectId: null
				}),

			addCollectionEnv: (colId: string, name: string) =>
				set(state => ({
					collections: state.collections.map(c => {
						if (c.id !== colId) return c;
						return {
							...c,
							environments: [
								...c.environments,
								{ id: uuidv4(), name, variables: [], headers: [] }
							]
						};
					})
				})),

			updateCollectionEnv: (
				colId: string,
				envId: string,
				updates: Partial<Environment>
			) =>
				set(state => ({
					collections: state.collections.map(c => {
						if (c.id !== colId) return c;
						return {
							...c,
							environments: c.environments.map(e =>
								e.id === envId ? { ...e, ...updates } : e
							)
						};
					})
				})),

			removeCollectionEnv: (colId: string, envId: string) =>
				set(state => ({
					collections: state.collections.map(c => {
						if (c.id !== colId) return c;
						return {
							...c,
							environments: c.environments.filter(
								e => e.id !== envId
							),
							activeEnvironmentId:
								c.activeEnvironmentId === envId
									? null
									: c.activeEnvironmentId
						};
					})
				})),

			setCollectionActiveEnv: (colId: string, envId: string | null) =>
				set(state => ({
					collections: state.collections.map(c => {
						if (c.id !== colId) return c;
						return { ...c, activeEnvironmentId: envId };
					})
				})),

			setCollectionContentTab: (
				colId: string,
				tab: 'variables' | 'headers'
			) =>
				set(state => ({
					collectionContentTabs: {
						...state.collectionContentTabs,
						[colId]: tab
					}
				}))
		}),
		{
			name: 'collections',
			partialize: state => ({
				projects: state.projects,
				collections: state.collections,
				savedRequests: state.savedRequests,
				activeCollectionId: state.activeCollectionId,
				collectionContentTabs: state.collectionContentTabs
			})
		}
	)
);
