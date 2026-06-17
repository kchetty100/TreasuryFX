import { useState } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCurrencies, useWatchlist } from '@/hooks/useApi'
import { formatRate } from '@/utils/cn'
import { LoadingCard, ErrorMessage } from '@/components/ui/Skeleton'

export default function WatchlistPage() {
  const [base, setBase] = useState('USD')
  const [target, setTarget] = useState('EUR')
  const { data: currencies } = useCurrencies()
  const { data: watchlist, isLoading, error, addMutation, removeMutation } = useWatchlist()

  const currencyCodes = currencies ? Object.keys(currencies.currencies).sort() : []

  const handleAdd = () => {
    if (base === target) return
    addMutation.mutate({ base, target })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
        <p className="text-sm text-muted-foreground">
          Track your favorite currency pairs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Currency Pair</CardTitle>
          <CardDescription>Monitor exchange rates for pairs you care about</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Base</label>
              <Select value={base} onChange={(e) => setBase(e.target.value)} className="w-32">
                {currencyCodes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Target</label>
              <Select value={target} onChange={(e) => setTarget(e.target.value)} className="w-32">
                {currencyCodes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={addMutation.isPending || base === target}>
              <Plus className="h-4 w-4" />
              Add Pair
            </Button>
          </div>
          {addMutation.isError && (
            <p className="mt-2 text-sm text-danger">{String(addMutation.error)}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Watchlist</CardTitle>
          <CardDescription>
            {watchlist ? `${watchlist.count} pair${watchlist.count !== 1 ? 's' : ''} tracked` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <LoadingCard />}
          {error && <ErrorMessage message={String(error)} />}
          {watchlist && watchlist.items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              No pairs in your watchlist. Add one above to get started.
            </p>
          )}
          {watchlist && watchlist.items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">Pair</th>
                    <th className="pb-3 font-medium text-right">Rate</th>
                    <th className="pb-3 font-medium text-center">Trend</th>
                    <th className="pb-3 font-medium text-right">Added</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.items.map((item) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-3 font-medium">
                        {item.base_currency}/{item.target_currency}
                      </td>
                      <td className="py-3 text-right font-mono">
                        {formatRate(item.current_rate)}
                      </td>
                      <td className="py-3 text-center">
                        <TrendBadge direction={item.trend_direction} />
                      </td>
                      <td className="py-3 text-right text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMutation.mutate(item.id)}
                          disabled={removeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TrendBadge({ direction }: { direction: string | null }) {
  if (direction === 'up') {
    return (
      <Badge variant="success" className="gap-1">
        <TrendingUp className="h-3 w-3" /> Up
      </Badge>
    )
  }
  if (direction === 'down') {
    return (
      <Badge variant="danger" className="gap-1">
        <TrendingDown className="h-3 w-3" /> Down
      </Badge>
    )
  }
  return (
    <Badge variant="muted" className="gap-1">
      <Minus className="h-3 w-3" /> Flat
    </Badge>
  )
}
