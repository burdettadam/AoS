import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { KeycloakProvider } from './context/KeycloakContext.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <KeycloakProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </KeycloakProvider>
  </React.StrictMode>,
);
