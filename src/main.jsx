import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
createRoot(document.getElementById('root')).render(
  <>
    <App />
    <div className="ver" aria-label="버전 2">v.2</div>
  </>
)
