import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadGame } from './utils/saveGame'

// Apply any existing save before the first component mounts, so entities
// that check world-progress state in their initial render (e.g. an already
// defeated monster) see it from frame one instead of respawning briefly.
loadGame()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
