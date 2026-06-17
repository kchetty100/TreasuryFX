import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import ExposureManagementPage from '@/pages/ExposureManagementPage'
import RiskSummaryPage from '@/pages/RiskSummaryPage'
import ConverterPage from '@/pages/ConverterPage'
import TrendsPage from '@/pages/TrendsPage'
import WatchlistPage from '@/pages/WatchlistPage'
import AlertsPage from '@/pages/AlertsPage'
import SettingsPage from '@/pages/SettingsPage'

export function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/exposures" element={<ExposureManagementPage />} />
        <Route path="/risk" element={<RiskSummaryPage />} />
        <Route path="/converter" element={<ConverterPage />} />
        <Route path="/trends" element={<TrendsPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}
