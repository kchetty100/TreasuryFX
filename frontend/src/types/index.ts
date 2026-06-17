export interface CurrencyListResponse {
  currencies: Record<string, string>
  count: number
}

export interface LatestRatesResponse {
  base: string
  date: string
  rates: Record<string, number>
}

export interface ConvertResponse {
  from_currency: string
  to_currency: string
  amount: number
  rate: number
  result: number
  date: string
}

export interface HistoricalRatesResponse {
  base: string
  start_date: string
  end_date: string
  rates: Record<string, Record<string, number>>
}

export interface WatchlistItem {
  id: number
  base_currency: string
  target_currency: string
  created_at: string
  current_rate: number | null
  trend_direction: 'up' | 'down' | 'flat' | null
}

export interface WatchlistListResponse {
  items: WatchlistItem[]
  count: number
}

export interface Alert {
  id: number
  base_currency: string
  target_currency: string
  threshold: number
  direction: 'above' | 'below'
  is_active: boolean
  created_at: string
  current_rate: number | null
  triggered: boolean | null
}

export interface AlertListResponse {
  items: Alert[]
  count: number
}

export interface HealthResponse {
  status: string
  database: boolean
  redis: boolean
  currency_api: {
    state: string
    failure_count: number
    failure_threshold: number
    recovery_timeout: number
  }
  timestamp: string
}

export interface CacheStatsResponse {
  connected: boolean
  used_memory_human?: string
  keyspace_hits?: number
  keyspace_misses?: number
  connected_clients?: number
  error?: string
  cache_ttl_seconds: number
  last_refresh: string | null
}

export interface ChartDataPoint {
  date: string
  rate?: number
  pair?: string
  [key: string]: string | number | undefined
}

export type ExposureType = 'PAYABLE' | 'RECEIVABLE'
export type ExposureStatus = 'OPEN' | 'SETTLED' | 'CANCELLED'
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export interface Exposure {
  id: number
  counterparty: string
  exposure_type: ExposureType
  currency: string
  amount: number
  due_date: string
  business_unit: string
  description?: string | null
  status: ExposureStatus
  created_at: string
  updated_at: string
  fx_rate_to_zar?: number | null
  zar_equivalent?: number | null
  days_until_due?: number | null
  risk_level?: RiskLevel | null
}

export interface ExposurePayload {
  counterparty: string
  exposure_type: ExposureType
  currency: string
  amount: number
  due_date: string
  business_unit: string
  description?: string | null
  status: ExposureStatus
}

export interface ExposureListResponse {
  items: Exposure[]
  count: number
}

export interface TreasurySummaryResponse {
  total_exposure_zar: number
  payables_total_zar: number
  receivables_total_zar: number
  net_exposure_zar: number
  exposure_count: number
  high_risk_count: number
  medium_risk_count: number
  low_risk_count: number
}

export interface ExposureByCurrency {
  currency: string
  amount: number
  zar_equivalent: number
  payable_zar: number
  receivable_zar: number
  net_zar: number
}

export interface ExposureByCurrencyListResponse {
  items: ExposureByCurrency[]
}

export interface UpcomingMaturitiesResponse {
  items: Exposure[]
}
