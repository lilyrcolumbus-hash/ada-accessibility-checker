import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LandingPage } from '@/pages/LandingPage'
import { ScanPage } from '@/pages/ScanPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { TermsPage } from '@/pages/TermsPage'
import SharedReportPage from '@/pages/SharedReportPage'
import BadgeVerifyPage from '@/pages/BadgeVerifyPage'
import IndustryLandingPage from '@/pages/IndustryLandingPage'
import StateLandingPage from '@/pages/StateLandingPage'

export default function App() {
  return (
    <Routes>
      {/* Public routes with Layout (Header + Footer) */}
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/industry/:slug" element={<IndustryLandingPage />} />
        <Route path="/state/:slug" element={<StateLandingPage />} />
      </Route>

      {/* Shared report — standalone page, no Layout */}
      <Route path="/shared/:token" element={<SharedReportPage />} />

      {/* Badge verification — public, standalone */}
      <Route path="/badge/:token" element={<BadgeVerifyPage />} />

      {/* Auth pages — full screen, no Layout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Route>

      {/* 404 catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
