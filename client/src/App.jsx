import { useEffect, useState } from 'react'
import { hasAuthConfig } from './auth/auth-config'
import { LandingPage } from './pages/landing/LandingPage'
import { AuthRedirectPage } from './pages/auth/AuthRedirectPage'
import { AuthSetupPage } from './pages/auth/AuthSetupPage'
import { WorkspacePage } from './pages/workspace/WorkspacePage'
import { subscribeToNavigation } from './router/navigation'

function App() {
  const [path, setPath] = useState(() => window.location.pathname)
  const [theme, setTheme] = useState(() => {
    const storedTheme = window.localStorage.getItem('theme')

    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    return subscribeToNavigation(() => {
      setPath(window.location.pathname)
    })
  }, [])

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  if (!hasAuthConfig() && (path === '/login' || path === '/signup' || path.startsWith('/app'))) {
    return <AuthSetupPage />
  }

  if (path === '/login') {
    return <AuthRedirectPage mode="login" />
  }

  if (path === '/signup') {
    return <AuthRedirectPage mode="signup" />
  }

  if (path.startsWith('/app')) {
    return <WorkspacePage />
  }

  return <LandingPage theme={theme} onThemeToggle={toggleTheme} />
}

export default App
