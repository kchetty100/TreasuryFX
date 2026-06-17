import type React from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, CalendarDays, CircleDollarSign, Gauge, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingCard } from '@/components/ui/Skeleton'
import { ExchangeRateChart } from '@/charts/ExchangeRateChart'
import { useExposureByCurrency, useHighRiskExposures, useHistoricalRates, useTreasurySummary, useUpcomingMaturities } from '@/hooks/useApi'
import { formatCurrency } from '@/utils/cn'
import type { ChartDataPoint, Exposure } from '@/types'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export default function RiskSummaryPage() {
  const { data: summary } = useTreasurySummary()
  const { data: byCurrency } = useExposureByCurrency()
  const { data: highRisk } = useHighRiskExposures()
  const { data: maturities } = useUpcomingMaturities()
  const endDate = new Date().toISOString().slice(0, 10)
  const startDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10)
  const { data: usdZar } = useHistoricalRates('USD', 'ZAR', startDate, endDate)

  const movementData: ChartDataPoint[] = usdZar
    ? Object.entries(usdZar.rates).sort(([a], [b]) => a.localeCompare(b)).map(([date, rates]) => ({
        date: date.slice(5),
        rate: rates.ZAR ?? 0,
      }))
    : []

  const concentration = byCurrency?.items.map((item) => ({
    currency: item.currency,
    exposure: Math.abs(item.zar_equivalent),
  })) ?? []

  const dueBuckets = buildDueBuckets(maturities?.items ?? [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Risk Summary</h1>
        <p className="text-sm text-muted-foreground">Executive view of concentration, maturity, and FX movement impact.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ExecutiveCard icon={AlertTriangle} label="High Risk Items" value={String(summary?.high_risk_count ?? 0)} detail="Large or near-term exposures" />
        <ExecutiveCard icon={Gauge} label="Medium Risk Items" value={String(summary?.medium_risk_count ?? 0)} detail="Watchlist for treasury review" />
        <ExecutiveCard icon={CircleDollarSign} label="Net Exposure" value={formatCurrency(summary?.net_exposure_zar ?? 0, 'ZAR')} detail="Receivables minus payables" />
        <ExecutiveCard icon={TrendingDown} label="Open Exposure" value={formatCurrency(summary?.total_exposure_zar ?? 0, 'ZAR')} detail={`${summary?.exposure_count ?? 0} active items`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Currency Concentration</CardTitle>
            <CardDescription>ZAR-equivalent open exposure by currency</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {concentration.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={concentration}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="currency" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value, 'ZAR')} />
                  <Bar dataKey="exposure" radius={[4, 4, 0, 0]}>
                    {concentration.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <LoadingCard />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Due-Date Risk</CardTitle>
            <CardDescription>Maturity buckets based on days until due</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dueBuckets.map((bucket) => (
              <div key={bucket.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{bucket.label}</span>
                  <span className="font-mono">{formatCurrency(bucket.value, 'ZAR')}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${bucket.percent}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>FX Movement Impact</CardTitle>
            <CardDescription>USD/ZAR movement over the last 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            {movementData.length > 0 ? <ExchangeRateChart data={movementData} height={280} /> : <LoadingCard />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>High-Risk Exposures</CardTitle>
            <CardDescription>Prioritized treasury action list</CardDescription>
          </CardHeader>
          <CardContent>
            {(highRisk?.items ?? []).map((item) => (
              <RiskRow key={item.id} item={item} />
            ))}
            {highRisk?.items.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No high-risk exposures</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ExecutiveCard({ icon: Icon, label, value, detail }: { icon: React.ElementType; label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold font-mono">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function RiskRow({ item }: { item: Exposure }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/50 py-3 last:border-0">
      <div>
        <p className="text-sm font-medium">{item.counterparty}</p>
        <p className="text-xs text-muted-foreground">{item.business_unit} - {item.currency} {item.amount.toLocaleString()}</p>
      </div>
      <div className="text-right">
        <Badge variant="danger">{item.risk_level}</Badge>
        <p className="mt-1 text-xs font-mono">{formatCurrency(item.zar_equivalent ?? 0, 'ZAR')}</p>
      </div>
    </div>
  )
}

function buildDueBuckets(items: Exposure[]) {
  const buckets = [
    { label: 'Due in 0-7 days', value: 0 },
    { label: 'Due in 8-30 days', value: 0 },
    { label: 'Due after 30 days', value: 0 },
  ]
  items.forEach((item) => {
    const days = item.days_until_due ?? 999
    const value = item.zar_equivalent ?? 0
    if (days <= 7) buckets[0].value += value
    else if (days <= 30) buckets[1].value += value
    else buckets[2].value += value
  })
  const max = Math.max(...buckets.map((bucket) => bucket.value), 1)
  return buckets.map((bucket) => ({ ...bucket, percent: Math.max(6, (bucket.value / max) * 100) }))
}
