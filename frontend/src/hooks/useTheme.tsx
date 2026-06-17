import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSettings, saveSettings } from '@/utils/cn'

interface ThemeContextValue {
  darkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState<boolean>(() => getSettings().darkMode ?? true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    const settings = getSettings()
    saveSettings({ ...settings, darkMode })
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode((prev) => !prev)

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
