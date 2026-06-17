import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { getSettings, saveSettings } from '@/utils/cn'
import { useQueryClient } from '@tanstack/react-query'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [refreshInterval, setRefreshInterval] = useState(60)
  const [cacheEnabled, setCacheEnabled] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const settings = getSettings()
    setRefreshInterval(settings.refreshInterval ?? 60)
    setCacheEnabled(settings.cacheEnabled ?? true)
  }, [])

  const handleSave = () => {
    const settings = getSettings()
    saveSettings({ ...settings, refreshInterval, cacheEnabled })
    queryClient.invalidateQueries()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure application preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Refresh Interval</CardTitle>
            <CardDescription>How often to refresh exchange rate data (seconds)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="number"
              min="10"
              max="3600"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 60)}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 60 seconds for live data, 300+ for reduced API usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cache Settings</CardTitle>
            <CardDescription>Server-side Redis caching configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cacheEnabled}
                onChange={(e) => setCacheEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm">Enable client-side cache preference</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Server-side Redis caching is always active. Default TTL: 300 seconds.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application</CardTitle>
            <CardDescription>FXPilot platform information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Application" value="FXPilot" />
            <InfoRow label="Version" value="1.0.0" />
            <InfoRow label="Environment" value="Demo / Production-Grade" />
            <InfoRow label="Stack" value="FastAPI + React + PostgreSQL + Redis" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Provider</CardTitle>
            <CardDescription>External exchange rate data source</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Provider" value="Frankfurter API" />
            <InfoRow label="URL" value="api.frankfurter.app" />
            <InfoRow label="Data Source" value="European Central Bank" />
            <InfoRow label="Update Frequency" value="Daily (business days)" />
            <InfoRow label="Authentication" value="None required" />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave}>Save Settings</Button>
        {saved && <span className="text-sm text-success">Settings saved!</span>}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/50 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium font-mono text-xs">{value}</span>
    </div>
  )
}
