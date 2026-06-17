import { useMemo, useState, type ReactNode } from 'react'
import { Edit2, Plus, Trash2, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { LoadingCard, ErrorMessage } from '@/components/ui/Skeleton'
import { useExposures } from '@/hooks/useApi'
import { formatCurrency, formatRate } from '@/utils/cn'
import type { Exposure, ExposurePayload, ExposureStatus, ExposureType } from '@/types'

const emptyForm: ExposurePayload = {
  counterparty: '',
  exposure_type: 'PAYABLE',
  currency: 'USD',
  amount: 0,
  due_date: new Date().toISOString().slice(0, 10),
  business_unit: '',
  description: '',
  status: 'OPEN',
}

export default function ExposureManagementPage() {
  const [filters, setFilters] = useState({ currency: '', exposure_type: '', status: '', business_unit: '' })
  const [form, setForm] = useState<ExposurePayload>(emptyForm)
  const [editing, setEditing] = useState<Exposure | null>(null)
  const queryFilters = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
    [filters]
  )
  const { data, isLoading, error, createMutation, updateMutation, removeMutation } = useExposures(queryFilters)

  const businessUnits = Array.from(new Set(data?.items.map((item) => item.business_unit) ?? [])).sort()
  const currencies = Array.from(new Set(data?.items.map((item) => item.currency) ?? ['USD', 'EUR', 'GBP', 'JPY', 'ZAR'])).sort()

  const submit = () => {
    const payload = { ...form, currency: form.currency.toUpperCase(), amount: Number(form.amount) }
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload }, { onSuccess: resetForm })
    } else {
      createMutation.mutate(payload, { onSuccess: resetForm })
    }
  }

  const startEdit = (item: Exposure) => {
    setEditing(item)
    setForm({
      counterparty: item.counterparty,
      exposure_type: item.exposure_type,
      currency: item.currency,
      amount: item.amount,
      due_date: item.due_date,
      business_unit: item.business_unit,
      description: item.description ?? '',
      status: item.status,
    })
  }

  const resetForm = () => {
    setEditing(null)
    setForm(emptyForm)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exposure Management</h1>
        <p className="text-sm text-muted-foreground">Capture, maintain, and monitor manually entered FX exposures.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editing ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? 'Edit Exposure' : 'Add Exposure'}
          </CardTitle>
          <CardDescription>Amounts are converted to ZAR on the dashboard using current FX rates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Counterparty">
              <Input value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} />
            </Field>
            <Field label="Type">
              <Select value={form.exposure_type} onChange={(e) => setForm({ ...form, exposure_type: e.target.value as ExposureType })}>
                <option value="PAYABLE">Payable</option>
                <option value="RECEIVABLE">Receivable</option>
              </Select>
            </Field>
            <Field label="Currency">
              <Input value={form.currency} maxLength={3} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Amount">
              <Input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </Field>
            <Field label="Due Date">
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </Field>
            <Field label="Business Unit">
              <Input value={form.business_unit} onChange={(e) => setForm({ ...form, business_unit: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ExposureStatus })}>
                <option value="OPEN">Open</option>
                <option value="SETTLED">Settled</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </Field>
            <Field label="Description">
              <Input value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={submit} disabled={!form.counterparty || !form.business_unit || !form.amount || createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Update Exposure' : 'Add Exposure'}
            </Button>
            {editing && (
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exposure Register</CardTitle>
          <CardDescription>Filter by treasury dimensions and act on individual exposures.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Select value={filters.currency} onChange={(e) => setFilters({ ...filters, currency: e.target.value })}>
              <option value="">All currencies</option>
              {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            </Select>
            <Select value={filters.exposure_type} onChange={(e) => setFilters({ ...filters, exposure_type: e.target.value })}>
              <option value="">All types</option>
              <option value="PAYABLE">Payable</option>
              <option value="RECEIVABLE">Receivable</option>
            </Select>
            <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="SETTLED">Settled</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
            <Select value={filters.business_unit} onChange={(e) => setFilters({ ...filters, business_unit: e.target.value })}>
              <option value="">All business units</option>
              {businessUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
            </Select>
          </div>

          {isLoading && <LoadingCard />}
          {error && <ErrorMessage message={String(error)} />}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">Counterparty</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 text-right font-medium">Amount</th>
                  <th className="pb-3 text-right font-medium">ZAR Equivalent</th>
                  <th className="pb-3 font-medium">Due</th>
                  <th className="pb-3 font-medium">Unit</th>
                  <th className="pb-3 font-medium">Risk</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-3">
                      <p className="font-medium">{item.counterparty}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </td>
                    <td className="py-3"><Badge variant={item.exposure_type === 'PAYABLE' ? 'warning' : 'success'}>{item.exposure_type}</Badge></td>
                    <td className="py-3 text-right font-mono">{item.currency} {item.amount.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono">
                      {formatCurrency(item.zar_equivalent ?? 0, 'ZAR')}
                      <p className="text-xs text-muted-foreground">rate {formatRate(item.fx_rate_to_zar)}</p>
                    </td>
                    <td className="py-3">{item.due_date}<p className="text-xs text-muted-foreground">{item.days_until_due} days</p></td>
                    <td className="py-3">{item.business_unit}</td>
                    <td className="py-3"><RiskBadge risk={item.risk_level} /></td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(item)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="danger" size="sm" onClick={() => removeMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function RiskBadge({ risk }: { risk?: string | null }) {
  const variant = risk === 'HIGH' ? 'danger' : risk === 'MEDIUM' ? 'warning' : 'success'
  return <Badge variant={variant}>{risk ?? 'LOW'}</Badge>
}
