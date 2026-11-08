import { createRoot } from 'react-dom/client'
import { Suspense } from 'react'
import './index.css'
import './lib/i18n'
import App from './App.tsx'
import { ThemeProvider } from './components/themeProvider.tsx'
import { HelmetProvider } from "react-helmet-async"

createRoot(document.getElementById('root')!).render(
  <Suspense fallback={<div className="h-dvh w-screen bg-color-gradient" />}>
    <HelmetProvider>
      <ThemeProvider>
        <App /> 
      </ThemeProvider>
    </HelmetProvider>
  </Suspense>
)
