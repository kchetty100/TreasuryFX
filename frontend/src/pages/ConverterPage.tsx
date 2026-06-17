import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { ConverterCard } from '@/components/ConverterCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { ExchangeRateChart } from '@/charts/ExchangeRateChart'
import { useCurrencies, useHistoricalRates } from '@/hooks/useApi'
import { LoadingCard } from '@/components/ui/Skeleton'
import type { ChartDataPoint } from '@/types'

export default function ConverterPage() {
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('EUR')
  const { data: currencies } = useCurrencies()

  const endDate = format(new Date(), 'yyyy-MM-dd')
  const startDate = format(subMonths(new Date(), 1), 'yyyy-MM-dd')
  const { data: history, isLoading } = useHistoricalRates(from, to, startDate, endDate)

  const currencyCodes = currencies ? Object.keys(currencies.currencies).sort() : []

  const chartData: ChartDataPoint[] = history
    ? Object.entries(history.rates)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, rates]) => ({
          date: format(new Date(date), 'MMM dd'),
          rate: rates[to] ?? 0,
        }))
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Currency Converter</h1>
        <p className="text-sm text-muted-foreground">
          Convert amounts with live exchange rates
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ConverterCard defaultFrom={from} defaultTo={to} />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Trend</CardTitle>
                <CardDescription>30-day rate movement for selected pair</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={from} onChange={(e) => setFrom(e.target.value)} className="w-24">
                  {currencyCodes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
                <Select value={to} onChange={(e) => setTo(e.target.value)} className="w-24">
                  {currencyCodes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingCard />
            ) : chartData.length > 0 ? (
              <ExchangeRateChart data={chartData} height={320} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No trend data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
