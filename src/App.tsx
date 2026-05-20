import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from './lib/store'
import { useAuth } from './hooks/useAuth'
import { ParentShell } from './components/parent/ParentShell'
import { KidShell } from './components/kid/KidShell'

// Lazy-load every page so navigation only pulls in what's needed.
const Login = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })))
const Setup = lazy(() => import('./pages/auth/Setup').then(m => ({ default: m.Setup })))
const KidPin = lazy(() => import('./pages/auth/KidPin').then(m => ({ default: m.KidPin })))
const Overview = lazy(() => import('./pages/parent/Overview').then(m => ({ default: m.Overview })))
const Chores = lazy(() => import('./pages/parent/Chores').then(m => ({ default: m.Chores })))
const Approvals = lazy(() => import('./pages/parent/Approvals').then(m => ({ default: m.Approvals })))
const Rewards = lazy(() => import('./pages/parent/Rewards').then(m => ({ default: m.Rewards })))
const History = lazy(() => import('./pages/parent/History').then(m => ({ default: m.History })))
const Settings = lazy(() => import('./pages/parent/Settings').then(m => ({ default: m.Settings })))
const ReleaseNotes = lazy(() => import('./pages/parent/ReleaseNotes').then(m => ({ default: m.ReleaseNotes })))
const Guide = lazy(() => import('./pages/parent/Guide').then(m => ({ default: m.Guide })))
const KidHome = lazy(() => import('./pages/kid/KidHome').then(m => ({ default: m.KidHome })))
const KidShop = lazy(() => import('./pages/kid/KidShop').then(m => ({ default: m.KidShop })))

function AuthLoading() {
  return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--p-bg)' }}>
      <div className="text-sm" style={{ color: 'var(--p-muted)' }}>Loading...</div>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { profile } = useStore()
  const location = useLocation()
  if (!profile) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

function AppRoutes() {
  const { profile } = useStore()

  return (
    <Suspense fallback={<AuthLoading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/kid-login" element={<KidPin />} />

        <Route path="/parent" element={<RequireAuth><ParentShell /></RequireAuth>}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="chores" element={<Chores />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
          <Route path="release-notes" element={<ReleaseNotes />} />
          <Route path="guide" element={<Guide />} />
        </Route>

        <Route path="/kid" element={<RequireAuth><KidShell /></RequireAuth>}>
          <Route index element={<KidHome />} />
          <Route path="shop" element={<KidShop />} />
        </Route>

        <Route
          path="/"
          element={
            !profile
              ? <Navigate to="/login" replace />
              : profile.role === 'parent'
              ? <Navigate to="/parent/overview" replace />
              : <Navigate to="/kid" replace />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  const { ready } = useAuth()

  if (!ready) return <AuthLoading />

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
