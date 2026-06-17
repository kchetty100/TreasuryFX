import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRate(value: number | null | undefined, decimals = 4): string {
  if (value == null) return '—'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function getSettings() {
  const stored = localStorage.getItem('fxpilot-settings')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      /* fall through */
    }
  }
  return {
    refreshInterval: 60,
    cacheEnabled: true,
    darkMode: true,
  }
}

export function saveSettings(settings: Record<string, unknown>) {
  localStorage.setItem('fxpilot-settings', JSON.stringify(settings))
}
