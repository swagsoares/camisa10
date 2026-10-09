import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// Sem StrictMode: ele dispara efeitos 2x em dev e gastaria chamadas extras ao LLM.
createRoot(document.getElementById('root')).render(<App />)
