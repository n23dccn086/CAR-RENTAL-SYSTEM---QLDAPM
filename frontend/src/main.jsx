import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { DialogProvider } from './context/DialogContext.jsx'
import './styles/global.css'
import './styles/animations.css'
import './styles/components.css'
import './styles/pages.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <DialogProvider>
        <App />
      </DialogProvider>
    </BrowserRouter>
  </React.StrictMode>,
)