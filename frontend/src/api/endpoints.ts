import { apiClient } from './client'
import type {
  Alert,
  AlertListResponse,
  CacheStatsResponse,
  ConvertResponse,
  CurrencyListResponse,
  Exposure,
  ExposureByCurrencyListResponse,
  ExposureListResponse,
  ExposurePayload,
  HealthResponse,
  HistoricalRatesResponse,
  LatestRatesResponse,
  TreasurySummaryResponse,
  UpcomingMaturitiesResponse,
  WatchlistItem,
  WatchlistListResponse,
} from '@/types'

export const currenciesApi = {
  list: () => apiClient.get<CurrencyListResponse>('/currencies').then((r) => r.data),
}

export const ratesApi = {
  latest: (base = 'USD', symbols?: string[]) =>
    apiClient
      .get<LatestRatesResponse>('/rates/latest', {
        params: { base, symbols: symbols?.join(',') },
      })
      .then((r) => r.data),

  convert: (from: string, to: string, amount: number) =>
    apiClient
      .get<ConvertResponse>('/rates/convert', { params: { from, to, amount } })
      .then((r) => r.data),

  history: (from: string, to: string, startDate: string, endDate: string) =>
    apiClient
      .get<HistoricalRatesResponse>('/rates/history', {
        params: { from, to, start_date: startDate, end_date: endDate },
      })
      .then((r) => r.data),
}

export const watchlistApi = {
  list: () => apiClient.get<WatchlistListResponse>('/watchlist').then((r) => r.data),
  add: (base_currency: string, target_currency: string) =>
    apiClient
      .post<WatchlistItem>('/watchlist', { base_currency, target_currency })
      .then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/watchlist/${id}`),
}

export const alertsApi = {
  list: () => apiClient.get<AlertListResponse>('/alerts').then((r) => r.data),
  create: (payload: {
    base_currency: string
    target_currency: string
    threshold: number
    direction: 'above' | 'below'
  }) => apiClient.post<Alert>('/alerts', payload).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/alerts/${id}`),
}

export const healthApi = {
  check: () => apiClient.get<HealthResponse>('/health').then((r) => r.data),
  cache: () => apiClient.get<CacheStatsResponse>('/health/cache').then((r) => r.data),
}

export const exposuresApi = {
  list: (params?: {
    currency?: string
    exposure_type?: string
    status?: string
    business_unit?: string
  }) => apiClient.get<ExposureListResponse>('/exposures', { params }).then((r) => r.data),
  get: (id: number) => apiClient.get<Exposure>(`/exposures/${id}`).then((r) => r.data),
  create: (payload: ExposurePayload) => apiClient.post<Exposure>('/exposures', payload).then((r) => r.data),
  update: (id: number, payload: Partial<ExposurePayload>) =>
    apiClient.put<Exposure>(`/exposures/${id}`, payload).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/exposures/${id}`),
}

export const treasuryApi = {
  summary: () => apiClient.get<TreasurySummaryResponse>('/treasury/summary').then((r) => r.data),
  exposureByCurrency: () =>
    apiClient
      .get<ExposureByCurrencyListResponse>('/treasury/exposure-by-currency')
      .then((r) => r.data),
  highRiskExposures: () =>
    apiClient.get<ExposureListResponse>('/treasury/high-risk-exposures').then((r) => r.data),
  upcomingMaturities: () =>
    apiClient.get<UpcomingMaturitiesResponse>('/treasury/upcoming-maturities').then((r) => r.data),
}
