use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

// Estado global para la conexión de base de datos
pub struct DbState {
    conn: Mutex<Connection>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RequestPayload {
    method: String,
    url: String,
    headers: std::collections::HashMap<String, String>,
    cookies: Option<std::collections::HashMap<String, String>>,
    body: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HttpResponse {
    #[serde(rename = "statusCode")]
    status_code: u16,
    time: u64,
    size: usize,
    headers: std::collections::HashMap<String, String>,
    cookies: std::collections::HashMap<String, String>,
    body: serde_json::Value,
    #[serde(rename = "contentType")]
    content_type: String,
}

// Comando para realizar peticiones HTTP
#[tauri::command]
async fn http_request(payload: RequestPayload) -> Result<HttpResponse, String> {
    let start = std::time::Instant::now();

    let client = reqwest::Client::new();
    let method = reqwest::Method::from_bytes(payload.method.as_bytes())
        .map_err(|e| format!("Método HTTP inválido: {}", e))?;

    let mut request = client.request(method, &payload.url);

    // Agregar headers
    for (key, value) in payload.headers {
        request = request.header(key, value);
    }

    // Agregar cookies como header Cookie si existen
    if let Some(cookies) = payload.cookies {
        if !cookies.is_empty() {
            let cookie_string: String = cookies
                .iter()
                .map(|(k, v)| format!("{}={}", k, v))
                .collect::<Vec<_>>()
                .join("; ");
            request = request.header("Cookie", cookie_string);
        }
    }

    // Agregar body si existe
    if let Some(body) = payload.body {
        request = request.body(body);
    }

    // Ejecutar la petición
    let response = request
        .send()
        .await
        .map_err(|e| format!("Error en la petición: {}", e))?;

    let status_code = response.status().as_u16();
    let headers_map: std::collections::HashMap<String, String> = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect();

    let content_type = headers_map
        .get("content-type")
        .cloned()
        .unwrap_or_else(|| "text/plain".to_string());

    // Extraer cookies del header Set-Cookie
    let mut cookies_map: std::collections::HashMap<String, String> =
        std::collections::HashMap::new();
    if let Some(set_cookie) = headers_map.get("set-cookie") {
        // Parsear cookies del header Set-Cookie
        for cookie_str in set_cookie.split(',') {
            if let Some(cookie_pair) = cookie_str.split(';').next() {
                if let Some((name, value)) = cookie_pair.split_once('=') {
                    cookies_map.insert(name.trim().to_string(), value.trim().to_string());
                }
            }
        }
    }

    let body_text = response
        .text()
        .await
        .map_err(|e| format!("Error leyendo respuesta: {}", e))?;

    let body_json: serde_json::Value = if content_type.contains("application/json") {
        serde_json::from_str(&body_text).unwrap_or(serde_json::Value::String(body_text.clone()))
    } else {
        serde_json::Value::String(body_text.clone())
    };

    let time = start.elapsed().as_millis() as u64;
    let size = body_text.len();

    Ok(HttpResponse {
        status_code,
        time,
        size,
        headers: headers_map,
        cookies: cookies_map,
        body: body_json,
        content_type,
    })
}

// Inicializar la base de datos
fn init_db() -> Result<Connection, rusqlite::Error> {
    // Usar la carpeta actual del proyecto para desarrollo
    let mut db_path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));

    // Si estamos ejecutando desde `src-tauri`, subir un nivel
    if db_path.ends_with("src-tauri") {
        db_path.pop();
    }

    // Crear directorio de datos si no existe
    let mut data_dir = db_path.clone();
    data_dir.push("data");
    if let Err(e) = std::fs::create_dir_all(&data_dir) {
        eprintln!("No se pudo crear directorio de datos: {}", e);
    }

    data_dir.push("getty.db");
    let db_path = data_dir;

    let conn = Connection::open(db_path)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS data (
            table_name TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    Ok(conn)
}

// Comando para guardar datos en SQLite (async para no bloquear)
#[tauri::command]
async fn save_to_db(state: State<'_, DbState>, table: String, data: String) -> Result<(), String> {
    // Usar tokio::task::spawn_blocking para operaciones de DB sin bloquear
    let conn_result = state.conn.lock();

    match conn_result {
        Ok(conn) => {
            let result = conn.execute(
                "INSERT OR REPLACE INTO data (table_name, content, updated_at) VALUES (?1, ?2, datetime('now'))",
                params![table, data],
            );

            match result {
                Ok(_) => Ok(()),
                Err(e) => {
                    eprintln!("Error guardando datos: {}", e);
                    Err(format!("Error guardando datos: {}", e))
                }
            }
        }
        Err(e) => {
            eprintln!("Error obteniendo lock de conexión: {}", e);
            Err(format!("Error obteniendo conexión: {}", e))
        }
    }
}

// Comando para cargar datos desde SQLite (async)
#[tauri::command]
async fn load_from_db(state: State<'_, DbState>, table: String) -> Result<Option<String>, String> {
    let conn_result = state.conn.lock();

    match conn_result {
        Ok(conn) => {
            let result = conn.query_row(
                "SELECT content FROM data WHERE table_name = ?1",
                params![table],
                |row| row.get(0),
            );

            match result {
                Ok(content) => Ok(Some(content)),
                Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
                Err(e) => {
                    eprintln!("Error cargando datos: {}", e);
                    Err(format!("Error cargando datos: {}", e))
                }
            }
        }
        Err(e) => {
            eprintln!("Error obteniendo lock de conexión: {}", e);
            Err(format!("Error obteniendo conexión: {}", e))
        }
    }
}

// Comando para eliminar datos de SQLite (async)
#[tauri::command]
async fn delete_from_db(
    state: State<'_, DbState>,
    table: String,
    id: Option<String>,
) -> Result<(), String> {
    let conn_result = state.conn.lock();

    match conn_result {
        Ok(conn) => {
            if let Some(_id) = id {
                // Si se proporciona un ID, eliminar registro específico
                conn.execute("DELETE FROM data WHERE table_name = ?1", params![table])
                    .map_err(|e| {
                        eprintln!("Error eliminando datos: {}", e);
                        format!("Error eliminando datos: {}", e)
                    })?;
            } else {
                // Eliminar todos los datos de una tabla
                conn.execute("DELETE FROM data WHERE table_name = ?1", params![table])
                    .map_err(|e| {
                        eprintln!("Error eliminando datos: {}", e);
                        format!("Error eliminando datos: {}", e)
                    })?;
            }
            Ok(())
        }
        Err(e) => {
            eprintln!("Error obteniendo lock de conexión: {}", e);
            Err(format!("Error obteniendo conexión: {}", e))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let conn = init_db().expect("Error inicializando base de datos");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(DbState {
            conn: Mutex::new(conn),
        })
        .invoke_handler(tauri::generate_handler![
            http_request,
            save_to_db,
            load_from_db,
            delete_from_db
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
