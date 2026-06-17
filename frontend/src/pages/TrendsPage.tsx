import { useState, useMemo } from 'react'
import { format, subMonths } from 'date-fns'
import { useQueries } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ExchangeRateChart } from '@/charts/ExchangeRateChart'
import { ratesApi } from '@/api/endpoints'
import { useCurrencies } from '@/hooks/useApi'
import { downloadJson } from '@/utils/cn'
import { LoadingCard, ErrorMessage } from '@/components/ui/Skeleton'

const COMPARE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export default function TrendsPage() {
  const [base, setBase] = useState('USD')
  const [targets, setTargets] = useState(['EUR', 'GBP', 'JPY'])
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 6), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const { data: currencies } = useCurrencies()
  const currencyCodes = currencies ? Object.keys(currencies.currencies).sort() : []

  const queries = useQueries({
    queries: targets.map((target) => ({
      queryKey: ['rates', 'history', base, target, startDate, endDate],
      queryFn: () => ratesApi.history(base, target, startDate, endDate),
      enabled: !!startDate && !!endDate,
    })),
  })

  const isLoading = queries.some((q) => q.isLoading)
  const error = queries.find((q) => q.error)?.error

  const { chartData, lines } = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>()

    queries.forEach((q, i) => {
      if (!q.data) return
      const target = targets[i]
      Object.entries(q.data.rates).forEach(([date, rates]) => {
        const existing = dateMap.get(date) || {}
        existing[target] = rates[target] ?? 0
        dateMap.set(date, existing)
      })
    })

    const sorted = Array.from(dateMap.entries()).sort(([a], [b]) => a.localeCompare(b))

    const data = sorted.map(([date, rates]) => ({
      date: format(new Date(date), 'MMM dd'),
      ...rates,
    }))

    const chartLines = targets.map((target, i) => ({
      key: target,
      color: COMPARE_COLORS[i % COMPARE_COLORS.length],
      name: `${base}/${target}`,
    }))

    return { chartData: data, lines: chartLines }
  }, [queries, targets, base])

  const toggleTarget = (currency: string) => {
    setTargets((prev) =>
      prev.includes(currency)
        ? prev.filter((c) => c !== currency)
        : prev.length < 5
          ? [...prev, currency]
          : prev
    )
  }

  const handleExport = () => {
    const exportData = queries
      .filter((q) => q.data)
      .map((q, i) => ({
        pair: `${base}/${targets[i]}`,
        start_date: startDate,
        end_date: endDate,
        rates: q.data?.rates,
      }))
    downloadJson(exportData, `fxpilot-trends-${base}-${startDate}-${endDate}.json`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historical Trends</h1>
          <p className="text-sm text-muted-foreground">
            Analyze exchange rate movements over time
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={chartData.length === 0}>
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chart Controls</CardTitle>
          <CardDescription>Select base currency, comparison targets, and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Base Currency</label>
              <Select value={base} onChange={(e) => setBase(e.target.value)}>
                {currencyCodes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs text-muted-foreground mb-2 block">
              Compare Currencies (select up to 5)
            </label>
            <div className="flex flex-wrap gap-2">
              {['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'ZAR', 'CNY'].map((c) => (
                <button
                  key={c}
                  onClick={() => toggleTarget(c)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    targets.includes(c)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {base} Exchange Rates — {targets.join(', ')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <LoadingCard />}
          {error && <ErrorMessage message={String(error)} />}
          {!isLoading && chartData.length > 0 && (
            <ExchangeRateChart data={chartData} lines={lines} height={400} />
          )}
          {!isLoading && chartData.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              Select currencies and date range to view trends
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
