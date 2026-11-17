import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // to put tailwind styles into the project
import { initializeTheme } from './theme'

initializeTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

