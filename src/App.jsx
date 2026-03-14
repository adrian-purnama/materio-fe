import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Settings } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ImageProvider } from './context/ImageContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/auth/RegisterPage'
import LoginPage from './pages/auth/LoginPage'
import AdminPage from './pages/auth/admin/AdminPage'
import SystemPage from './pages/auth/admin/SystemPage'
import DataEntryPage from './pages/DataEntryPage'
import StockPage from './pages/StockPage'

function ProtectedRoute({ children }) {
  const { isLoggedIn, authLoading } = useAuth()
  if (authLoading) return null
  if (!isLoggedIn) return <Navigate to="/" replace />
  return children
}

function AdminFab() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return null
  return (
    <Link
      to="/admin"
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-amber-500 text-gray-900 font-medium shadow-lg hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-white"
      aria-label="Admin"
    >
      <Settings className="w-6 h-6" />
    </Link>
  )
}

function AppRoutes() {
  const { isLoggedIn, authLoading } = useAuth()
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    )
  }
  return (
    <Routes>
      <Route path="/" element={isLoggedIn ? <HomePage /> : <LandingPage />} />
      <Route path="/home" element={isLoggedIn ? <HomePage /> : <Navigate to="/" replace />} />
      <Route path="/data-entry" element={<ProtectedRoute><DataEntryPage /></ProtectedRoute>} />
      <Route path="/stock" element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="/admin/system" element={<ProtectedRoute><SystemPage /></ProtectedRoute>} />
    </Routes>
  )
}

function App() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{ className: '!bg-white !text-gray-900 !border-gray-200 !shadow-lg' }} />
      <AuthProvider>
        <ImageProvider>
          <div className="flex min-h-screen">
            <Navbar />
            <main className="flex-1 min-w-0 bg-gray-50 pt-14 pl-0 md:pt-0 md:pl-56">
              <div className="max-w-5xl mx-auto px-4 py-10">
                <AppRoutes />
              </div>
            </main>
          </div>
          <AdminFab />
        </ImageProvider>
      </AuthProvider>
    </>
  )
}

export default App
