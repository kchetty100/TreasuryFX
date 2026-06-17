import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  alertsApi,
  currenciesApi,
  exposuresApi,
  healthApi,
  ratesApi,
  treasuryApi,
  watchlistApi,
} from '@/api/endpoints'
import { getSettings } from '@/utils/cn'
import type { ExposurePayload } from '@/types'

export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: currenciesApi.list,
    staleTime: 1000 * 60 * 60,
  })
}

export function useLatestRates(base = 'USD', symbols?: string[]) {
  const settings = getSettings()
  return useQuery({
    queryKey: ['rates', 'latest', base, symbols],
    queryFn: () => ratesApi.latest(base, symbols),
    refetchInterval: (settings.refreshInterval || 60) * 1000,
  })
}

export function useConvert(from: string, to: string, amount: number, enabled = true) {
  return useQuery({
    queryKey: ['rates', 'convert', from, to, amount],
    queryFn: () => ratesApi.convert(from, to, amount),
    enabled: enabled && amount > 0 && from !== to,
  })
}

export function useHistoricalRates(
  from: string,
  to: string,
  startDate: string,
  endDate: string,
  enabled = true
) {
  return useQuery({
    queryKey: ['rates', 'history', from, to, startDate, endDate],
    queryFn: () => ratesApi.history(from, to, startDate, endDate),
    enabled: enabled && !!startDate && !!endDate,
  })
}

export function useWatchlist() {
  const queryClient = useQueryClient()
  const settings = getSettings()

  const query = useQuery({
    queryKey: ['watchlist'],
    queryFn: watchlistApi.list,
    refetchInterval: (settings.refreshInterval || 60) * 1000,
  })

  const addMutation = useMutation({
    mutationFn: ({ base, target }: { base: string; target: string }) =>
      watchlistApi.add(base, target),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => watchlistApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  return { ...query, addMutation, removeMutation }
}

export function useAlerts() {
  const queryClient = useQueryClient()
  const settings = getSettings()

  const query = useQuery({
    queryKey: ['alerts'],
    queryFn: alertsApi.list,
    refetchInterval: (settings.refreshInterval || 60) * 1000,
  })

  const createMutation = useMutation({
    mutationFn: alertsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => alertsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  })

  return { ...query, createMutation, removeMutation }
}

export function useHealth() {
  const settings = getSettings()
  return useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
    refetchInterval: (settings.refreshInterval || 60) * 1000,
  })
}

export function useCacheStats() {
  const settings = getSettings()
  return useQuery({
    queryKey: ['cache-stats'],
    queryFn: healthApi.cache,
    refetchInterval: (settings.refreshInterval || 60) * 1000,
  })
}

export function useTreasurySummary() {
  const settings = getSettings()
  return useQuery({
    queryKey: ['treasury', 'summary'],
    queryFn: treasuryApi.summary,
    refetchInterval: (settings.refreshInterval || 60) * 1000,
  })
}

export function useExposureByCurrency() {
  return useQuery({
    queryKey: ['treasury', 'exposure-by-currency'],
    queryFn: treasuryApi.exposureByCurrency,
  })
}

export function useHighRiskExposures() {
  return useQuery({
    queryKey: ['treasury', 'high-risk-exposures'],
    queryFn: treasuryApi.highRiskExposures,
  })
}

export function useUpcomingMaturities() {
  return useQuery({
    queryKey: ['treasury', 'upcoming-maturities'],
    queryFn: treasuryApi.upcomingMaturities,
  })
}

export function useExposures(filters?: {
  currency?: string
  exposure_type?: string
  status?: string
  business_unit?: string
}) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['exposures', filters],
    queryFn: () => exposuresApi.list(filters),
  })

  const invalidateTreasury = () => {
    queryClient.invalidateQueries({ queryKey: ['exposures'] })
    queryClient.invalidateQueries({ queryKey: ['treasury'] })
  }

  const createMutation = useMutation({
    mutationFn: (payload: ExposurePayload) => exposuresApi.create(payload),
    onSuccess: invalidateTreasury,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ExposurePayload> }) =>
      exposuresApi.update(id, payload),
    onSuccess: invalidateTreasury,
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => exposuresApi.remove(id),
    onSuccess: invalidateTreasury,
  })

  return { ...query, createMutation, updateMutation, removeMutation }
}
