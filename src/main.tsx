/**
 * ADARA PARFUM — Punto de Entrada Principal (SPA Bootstrapper)
 *
 * Monta el componente raíz {@link App} en el nodo DOM `#root` bajo `React.StrictMode`
 * para validación de ciclos de vida y efectos en desarrollo.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

