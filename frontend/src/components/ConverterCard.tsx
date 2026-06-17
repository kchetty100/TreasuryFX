import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useCurrencies, useConvert } from '@/hooks/useApi'
import { formatRate } from '@/utils/cn'
import { Skeleton } from '@/components/ui/Skeleton'

interface ConverterCardProps {
  defaultFrom?: string
  defaultTo?: string
  compact?: boolean
}

export function ConverterCard({ defaultFrom = 'USD', defaultTo = 'EUR', compact = false }: ConverterCardProps) {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [amount, setAmount] = useState('100')
  const { data: currencies } = useCurrencies()
  const numericAmount = parseFloat(amount) || 0
  const { data: result, isLoading, refetch } = useConvert(from, to, numericAmount, false)
  const [converted, setConverted] = useState<typeof result | null>(null)

  const currencyCodes = currencies ? Object.keys(currencies.currencies).sort() : []

  const handleConvert = async () => {
    const { data } = await refetch()
    setConverted(data ?? null)
  }

  const swap = () => {
    setFrom(to)
    setTo(from)
    setConverted(null)
  }

  return (
    <Card className={compact ? '' : 'h-full'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          Currency Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">From</label>
            <Select value={from} onChange={(e) => { setFrom(e.target.value); setConverted(null) }}>
              {currencyCodes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-end justify-center">
            <Button variant="outline" size="sm" onClick={swap} className="h-10 w-10 p-0">
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">To</label>
            <Select value={to} onChange={(e) => { setTo(e.target.value); setConverted(null) }}>
              {currencyCodes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Amount</label>
          <Input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setConverted(null) }}
          />
        </div>

        <Button onClick={handleConvert} disabled={isLoading || numericAmount <= 0} className="w-full">
          {isLoading ? 'Converting...' : 'Convert'}
        </Button>

        {converted && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-1">
            <p className="text-2xl font-bold font-mono text-primary">
              {converted.result.toLocaleString(undefined, { maximumFractionDigits: 2 })} {converted.to_currency}
            </p>
            <p className="text-xs text-muted-foreground">
              1 {converted.from_currency} = {formatRate(converted.rate)} {converted.to_currency}
            </p>
            <p className="text-xs text-muted-foreground">Rate as of {converted.date}</p>
          </div>
        )}

        {!converted && isLoading && <Skeleton className="h-20 w-full" />}
      </CardContent>
    </Card>
  )
}
