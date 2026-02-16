import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // This line tells the app to load the new Auth + CRM logic

// The Storage Polyfill (Crucial for saving data in the browser)
window.storage = {
  get: async (key) => ({ value: localStorage.getItem(key) }),
  set: async (key, val) => { localStorage.setItem(key, val); },
  delete: async (key) => { localStorage.removeItem(key); },
  list: async (prefix) => ({
    keys: Object.keys(localStorage).filter(k => k.startsWith(prefix))
  })
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
