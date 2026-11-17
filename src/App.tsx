import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, type ReactNode } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ConnectivityProvider } from './contexts/ConnectivityContext'
import { UploadProvider } from './contexts/UploadContext'
import { JobTrackerProvider } from './contexts/JobTrackerContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import FilesPage from './pages/FilesPage'
import DashboardPage from './pages/DashboardPage'
import TranscriptPage from './pages/TranscriptPage'
import UsersPage from './pages/UsersPage'
import AssignedActionItemsPage from './pages/AssignedActionItemsPage'
import { isPreview } from './lib/firebase'
import './index.css'

function Layout({ children }: { children: ReactNode }) {
  // <main> is the scroll container and survives route changes, so without
  // this a new page would open at the previous page's scroll position.
  const mainRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <>
      <Sidebar />
      <main ref={mainRef} style={{ flex: 1, minWidth: 0, overflowY: 'auto', height: '100vh' }}>
        {isPreview && (
          <div role="status" className="alert" style={{ margin: '16px 24px 0' }}>
            Preview mode. Browse a sample meeting and transcript while the app is being configured.
          </div>
        )}
        {children}
      </main>
    </>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/files" element={<ProtectedRoute><Layout><FilesPage /></Layout></ProtectedRoute>} />
      <Route path="/transcript/:jobId" element={<ProtectedRoute><Layout><TranscriptPage /></Layout></ProtectedRoute>} />
      <Route path="/action-items" element={<ProtectedRoute><Layout><AssignedActionItemsPage /></Layout></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Layout><UsersPage /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConnectivityProvider>
          <UploadProvider>
            <JobTrackerProvider>
              <AppRoutes />
            </JobTrackerProvider>
          </UploadProvider>
        </ConnectivityProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
