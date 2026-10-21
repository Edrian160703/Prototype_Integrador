import { useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'foodback-theme'

function getInitialTheme(): boolean {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme) return savedTheme === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function useThemePreference() {
  const [darkMode, setDarkMode] = useState(getInitialTheme)

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [darkMode])

  return {
    darkMode,
    toggleTheme: () => setDarkMode((current) => !current),
  }
}
