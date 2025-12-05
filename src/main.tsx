import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { useSettingsStore } from "./store";
import i18n from './i18n';

// Función para inicializar la app después de cargar el estado
const initializeApp = async () => {
  // Esperar un momento para que el store se hidrate desde la DB
  await new Promise(resolve => setTimeout(resolve, 100));

  // Aplicar tema e idioma al iniciar la aplicación
  const settingsStore = useSettingsStore.getState();

  // Sincronizar con los temas por defecto (agrega nuevos temas si no existen)
  settingsStore.syncDefaultThemes();

  settingsStore.applyThemeToDom();

  // Cambiar idioma si está configurado
  if (settingsStore.language) {
    await i18n.changeLanguage(settingsStore.language);
    console.log('Language loaded:', settingsStore.language);
  }

  // Renderizar la app
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

initializeApp();
