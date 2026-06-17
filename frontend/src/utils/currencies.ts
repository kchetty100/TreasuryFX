export const FALLBACK_CURRENCY_CODES = [
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'EUR',
  'GBP',
  'JPY',
  'USD',
  'ZAR',
]

export function getCurrencyCodes(currencies?: { currencies: Record<string, string> }) {
  const codes = currencies ? Object.keys(currencies.currencies) : FALLBACK_CURRENCY_CODES
  return Array.from(new Set(codes)).sort()
}
