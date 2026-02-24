import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

// Suprimir warning de atributo inert (React interno)
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('inert')) return;
  originalError(...args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)