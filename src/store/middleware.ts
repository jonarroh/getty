import { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { saveToDb, loadFromDb } from '../lib/tauri';

// type PersistListener = () => void; // Unused for now

interface PersistOptions {
	name: string; // Nombre de la tabla en SQLite
	partialize?: (state: any) => any; // Función para seleccionar qué parte del estado persistir
	onRehydrateStorage?: (
		state: any
	) => ((state?: any, error?: Error) => void) | void;
}

type Persist = <
	T,
	Mps extends [StoreMutatorIdentifier, unknown][] = [],
	Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
	initializer: StateCreator<T, Mps, Mcs>,
	options: PersistOptions
) => StateCreator<T, Mps, Mcs>;

type PersistImpl = <T>(
	storeInitializer: StateCreator<T, [], []>,
	options: PersistOptions
) => StateCreator<T, [], []>;

const persistImpl: PersistImpl =
	(config, options) => (set, get, api) => {
		const {
			name,
			partialize = (state: any) => state,
			onRehydrateStorage
		} = options;

		let isHydrating = true;
		let saveTimeout: ReturnType<typeof setTimeout> | null = null;
		let isSaving = false;

		// Configurar el estado inicial
		const initialState = config(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(...args: any[]) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(set as any)(...args);
				if (!isHydrating) {
					// Persistir con debounce para evitar múltiples escrituras
					debouncedPersist();
				}
			},
			get,
			api
		);

		// Función para persistir con debounce
		const debouncedPersist = () => {
			if (saveTimeout) {
				clearTimeout(saveTimeout);
			}
			saveTimeout = setTimeout(() => {
				persistState();
			}, 300); // Esperar 300ms antes de guardar
		};

		// Función para persistir el estado actual
		const persistState = async () => {
			if (isSaving) {
				return; // Evitar guardar si ya hay una operación en curso
			}

			try {
				isSaving = true;
				const state = get();
				const stateToPersist = partialize(state);
				await saveToDb(name, stateToPersist);
			} catch (error) {
				console.warn(`Error persistiendo estado de ${name}:`, error);
				// No lanzar el error para evitar que la app se cierre
			} finally {
				isSaving = false;
			}
		};

		// Cargar estado inicial desde SQLite
		const hydrateState = async () => {
			try {
				const persistedState = await loadFromDb(name);

				if (persistedState) {
					// Merge del estado persistido con el estado inicial
					// Usar función set para preservar funciones/metodos del store
					set(
						(state: any) => ({ ...state, ...persistedState }),
						true
					);
				}

				// Llamar al callback de rehidratación si existe
				if (onRehydrateStorage) {
					const callback = onRehydrateStorage(persistedState);
					if (callback) {
						callback(persistedState);
					}
				}
			} catch (error) {
				console.error(`Error cargando estado de ${name}:`, error);

				if (onRehydrateStorage) {
					const callback = onRehydrateStorage(null);
					if (callback) {
						callback(undefined, error as Error);
					}
				}
			} finally {
				isHydrating = false;
			}
		};

		// Iniciar la hidratación
		hydrateState();

		return initialState;
	};

export const persist = persistImpl as unknown as Persist;
