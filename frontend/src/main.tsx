import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const applySavedAccent = () => {
  const savedAccent = localStorage.getItem('alias_accent') as 'violet' | 'indigo' | 'red' | null;
  const accent = savedAccent || 'violet';
  const root = document.documentElement;

  if (accent === 'indigo') {
    root.style.setProperty('--accent', '#6366F1');
    root.style.setProperty('--accent-hover', '#4F46E5');
  } else if (accent === 'red') {
    root.style.setProperty('--accent', '#E11D48');
    root.style.setProperty('--accent-hover', '#BE123C');
  } else {
    root.style.setProperty('--accent', '#8B5CF6');
    root.style.setProperty('--accent-hover', '#7C4DF2');
  }
};

applySavedAccent();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
