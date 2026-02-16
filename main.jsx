import React from 'react'
import ReactDOM from 'react-dom/client'
import MicroCRM from './micro-crm.jsx'

// This "Polyfill" ensures your existing code can save data to the browser
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
    <MicroCRM />
  </React.StrictMode>
)
