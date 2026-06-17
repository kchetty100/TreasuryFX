import { useState } from 'react'
import { Plus, Trash2, Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCurrencies, useAlerts } from '@/hooks/useApi'
import { formatRate } from '@/utils/cn'
import { LoadingCard, ErrorMessage } from '@/components/ui/Skeleton'

export default function AlertsPage() {
  const [base, setBase] = useState('USD')
  const [target, setTarget] = useState('ZAR')
  const [threshold, setThreshold] = useState('20')
  const [direction, setDirection] = useState<'above' | 'below'>('above')

  const { data: currencies } = useCurrencies()
  const { data: alerts, isLoading, error, createMutation, removeMutation } = useAlerts()

  const currencyCodes = currencies ? Object.keys(currencies.currencies).sort() : []

  const handleCreate = () => {
    const value = parseFloat(threshold)
    if (isNaN(value) || value <= 0) return
    createMutation.mutate({
      base_currency: base,
      target_currency: target,
      threshold: value,
      direction,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exchange Rate Alerts</h1>
        <p className="text-sm text-muted-foreground">
          Get notified when rates cross your thresholds
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Alert</CardTitle>
          <CardDescription>Set a threshold to monitor exchange rate movements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Base</label>
              <Select value={base} onChange={(e) => setBase(e.target.value)}>
                {currencyCodes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Target</label>
              <Select value={target} onChange={(e) => setTarget(e.target.value)}>
                {currencyCodes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Direction</label>
              <Select
                value={direction}
                onChange={(e) => setDirection(e.target.value as 'above' | 'below')}
              >
                <option value="above">Goes Above</option>
                <option value="below">Goes Below</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Threshold</label>
              <Input
                type="number"
                min="0"
                step="any"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                <Plus className="h-4 w-4" />
                Create Alert
              </Button>
            </div>
          </div>
          {createMutation.isError && (
            <p className="mt-2 text-sm text-danger">{String(createMutation.error)}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <LoadingCard />}
          {error && <ErrorMessage message={String(error)} />}
          {alerts && alerts.items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              No alerts configured. Create one above to start monitoring.
            </p>
          )}
          {alerts && alerts.items.length > 0 && (
            <div className="space-y-3">
              {alerts.items.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {alert.base_currency}/{alert.target_currency}
                      </span>
                      <Badge variant={alert.triggered ? 'danger' : 'muted'}>
                        {alert.triggered ? 'Triggered' : 'Watching'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Alert when rate goes {alert.direction}{' '}
                      <span className="font-mono">{formatRate(alert.threshold)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Current: <span className="font-mono">{formatRate(alert.current_rate)}</span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMutation.mutate(alert.id)}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
