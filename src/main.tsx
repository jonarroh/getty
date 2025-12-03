import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { useSettingsStore } from "./store";

// Aplicar tema al iniciar la aplicación
useSettingsStore.getState().applyThemeToDom();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
