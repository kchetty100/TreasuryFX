import type React from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Activity, AlertTriangle, CalendarClock, Landmark, TrendingUp } from 'lucide-react'
import { ConverterCard } from '@/components/ConverterCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingCard } from '@/components/ui/Skeleton'
import { useExposureByCurrency, useHighRiskExposures, useLatestRates, useTreasurySummary, useUpcomingMaturities } from '@/hooks/useApi'
import { formatCurrency, formatRate } from '@/utils/cn'
import type { Exposure } from '@/types'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']

export default function DashboardPage() {
  const { data: summary, isLoading } = useTreasurySummary()
  const { data: byCurrency } = useExposureByCurrency()
  const { data: highRisk } = useHighRiskExposures()
  const { data: maturities } = useUpcomingMaturities()
  const { data: rates } = useLatestRates('ZAR', ['USD', 'EUR', 'GBP', 'JPY', 'CHF'])

  const chartData = byCurrency?.items.map((item) => ({
    name: item.currency,
    value: Math.abs(item.zar_equivalent),
  })) ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Treasury Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Monitor FX exposures, ZAR impact, maturities, and currency concentration.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Landmark} label="Total Exposure" value={summary ? zar(summary.total_exposure_zar) : '...'} />
        <SummaryCard icon={TrendingUp} label="Receivables" value={summary ? zar(summary.receivables_total_zar) : '...'} />
        <SummaryCard icon={Activity} label="Payables" value={summary ? zar(summary.payables_total_zar) : '...'} />
        <SummaryCard icon={AlertTriangle} label="Net Exposure" value={summary ? zar(summary.net_exposure_zar) : '...'} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Exposure by Currency</CardTitle>
            <CardDescription>ZAR-equivalent concentration across open exposures</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[280px_1fr]">
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                      {chartData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => zar(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <LoadingCard />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">Currency</th>
                    <th className="pb-3 text-right font-medium">Payable</th>
                    <th className="pb-3 text-right font-medium">Receivable</th>
                    <th className="pb-3 text-right font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {byCurrency?.items.map((item) => (
                    <tr key={item.currency} className="border-b border-border/50">
                      <td className="py-3 font-medium">{item.currency}</td>
                      <td className="py-3 text-right font-mono">{zar(item.payable_zar)}</td>
                      <td className="py-3 text-right font-mono">{zar(item.receivable_zar)}</td>
                      <td className="py-3 text-right font-mono">{zar(item.net_zar)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <ConverterCard compact />
          <Card>
            <CardHeader>
              <CardTitle>Latest FX Rates</CardTitle>
              <CardDescription>ZAR against major treasury currencies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rates ? Object.entries(rates.rates).map(([currency, rate]) => (
                <div key={currency} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                  <span className="text-sm font-medium">ZAR/{currency}</span>
                  <span className="font-mono text-sm">{formatRate(rate)}</span>
                </div>
              )) : <LoadingCard />}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ExposurePanel
          title="High-Risk Exposures"
          description={`${summary?.high_risk_count ?? 0} items need treasury attention`}
          items={highRisk?.items ?? []}
        />
        <ExposurePanel
          title="Upcoming Maturities"
          description="Open exposures ordered by due date"
          items={maturities?.items ?? []}
          icon={<CalendarClock className="h-4 w-4" />}
        />
      </div>

      {isLoading && <LoadingCard />}
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold font-mono">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ExposurePanel({ title, description, items, icon }: { title: string; description: string; items: Exposure[]; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No matching exposures</p>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 border-b border-border/50 py-3 last:border-0">
            <div>
              <p className="text-sm font-medium">{item.counterparty}</p>
              <p className="text-xs text-muted-foreground">{item.currency} {item.amount.toLocaleString()} due {item.due_date}</p>
            </div>
            <div className="text-right">
              <Badge variant={item.risk_level === 'HIGH' ? 'danger' : item.risk_level === 'MEDIUM' ? 'warning' : 'success'}>{item.risk_level}</Badge>
              <p className="mt-1 font-mono text-xs">{zar(item.zar_equivalent ?? 0)}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function zar(value: number) {
  return formatCurrency(value, 'ZAR')
}
