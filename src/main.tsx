import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import favicon from './assets/favicon.png'
import appIcon from './assets/app-icon-512.png'
import { StoreProvider } from './store'
import './index.css'

// Inline icons so the single-file build carries them too.
for (const [rel, href] of [['icon', favicon], ['apple-touch-icon', appIcon]] as const) {
  let l = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!l) { l = document.createElement('link'); l.rel = rel; document.head.appendChild(l) }
  l.href = href
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </React.StrictMode>,
)
