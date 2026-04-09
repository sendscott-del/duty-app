import { Component, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './lib/store'
import { useAuth } from './hooks/useAuth'
import { Login } from './pages/auth/Login'
import { Setup } from './pages/auth/Setup'
import { KidPin } from './pages/auth/KidPin'
import { ParentShell } from './components/parent/ParentShell'
import { Overview } from './pages/parent/Overview'
import { Chores } from './pages/parent/Chores'
import { Rewards } from './pages/parent/Rewards'
import { History } from './pages/parent/History'
import { Settings } from './pages/parent/Settings'
import { KidShell } from './components/kid/KidShell'
import { KidHome } from './pages/kid/KidHome'
import { KidShop } from './pages/kid/KidShop'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <pre style={{ background: '#ff0000', color: '#fff', padding: 16, whiteSpace: 'pre-wrap', fontSize: 12 }}>
          REACT ERROR: {this.state.error.message}{'\n'}{this.state.error.stack}
        </pre>
      )
    }
    return this.props.children
  }
}

function AppRoutes() {
  const { profile } = useStore()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/kid-login" element={<KidPin />} />

      <Route path="/parent" element={<ParentShell />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="chores" element={<Chores />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="history" element={<History />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/kid" element={<KidShell />}>
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
  )
}

export default function App() {
  useAuth()

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
