import { invoke } from '@tauri-apps/api/core';
import { TauriRequestPayload, HttpResponse } from '../types';

/**
 * Invoca el backend de Tauri para realizar una petición HTTP
 */
export async function invokeHttp(
	payload: TauriRequestPayload
): Promise<HttpResponse> {
	try {
		const response = await invoke<HttpResponse>('http_request', {
			payload
		});
		return response;
	} catch (error) {
		console.error('Error en invokeHttp:', error);
		throw error;
	}
}

/**
 * Guarda datos en SQLite a través de Tauri
 */
export async function saveToDb(
	table: string,
	data: any
): Promise<void> {
	try {
		await invoke('save_to_db', { table, data: JSON.stringify(data) });
	} catch (error) {
		console.warn('Error guardando en DB:', error);
		// No lanzar el error para evitar que la app se cierre
		// La app puede continuar funcionando sin persistencia
	}
}

/**
 * Carga datos desde SQLite a través de Tauri
 */
export async function loadFromDb(table: string): Promise<any> {
	try {
		const data = await invoke<string>('load_from_db', { table });
		return data ? JSON.parse(data) : null;
	} catch (error) {
		console.warn('Error cargando desde DB:', error);
		// Retornar null en lugar de lanzar error
		return null;
	}
}

/**
 * Elimina datos de SQLite a través de Tauri
 */
export async function deleteFromDb(
	table: string,
	id?: string
): Promise<void> {
	try {
		await invoke('delete_from_db', { table, id });
	} catch (error) {
		console.error('Error eliminando de DB:', error);
		throw error;
	}
}
