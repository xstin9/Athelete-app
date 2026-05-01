import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // to put tailwind styles into the project

// Apply persisted or system dark mode preference before the app mounts to avoid flash
const saved = localStorage.getItem('darkMode');
if (saved === null) {
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) document.documentElement.classList.add('dark');
} else if (saved === 'true') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

