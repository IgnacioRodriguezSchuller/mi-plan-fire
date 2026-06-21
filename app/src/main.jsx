import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyDeeplinkAtStartup } from './lib/deeplink.js'

// Lee los params de las calculadoras y pre-rellena el perfil ANTES de montar React
// (antes de que StateProvider lea localStorage en su inicializador eager). Corre 1 vez.
applyDeeplinkAtStartup()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
