// Lokasi file: src/index.js
// Deskripsi: Menambahkan SettingsProvider ke dalam pohon konteks.

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './ErrorBoundary.jsx';
import { FoodProvider } from './context/FoodContext';
import { UIStateProvider } from './context/UIStateContext';
import { RecipeProvider } from './context/RecipeContext';
import { SettingsProvider } from './context/SettingsContext'; // BARU

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <SettingsProvider> {/* BARU */}
          <FoodProvider>
            <RecipeProvider>
              <UIStateProvider>
                <App />
              </UIStateProvider>
            </RecipeProvider>
          </FoodProvider>
        </SettingsProvider> {/* BARU */}
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
