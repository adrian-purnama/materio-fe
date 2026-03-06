import { Routes, Route, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ImageProvider } from './context/ImageContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/auth/RegisterPage'
import LoginPage from './pages/auth/LoginPage'
import AdminPage from './pages/auth/admin/AdminPage'
import SystemPage from './pages/auth/admin/SystemPage'

function AdminFab() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return null
  return (
    <Link
      to="/admin"
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-amber-500 text-gray-900 font-medium shadow-lg hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-white"
      aria-label="Admin"
    >
      ⚙
    </Link>
  )
}

function App() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{ className: '!bg-white !text-gray-900 !border-gray-200 !shadow-lg' }} />
      <AuthProvider>
        <ImageProvider>
          <Navbar />
          <Routes>
            <Route path='/home' element={<HomePage />} />
            <Route path='/register' element={<RegisterPage />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/admin' element={<AdminPage />} />
            <Route path='/admin/system' element={<SystemPage />} />
          </Routes>
          <AdminFab />
        </ImageProvider>
      </AuthProvider>
    </>
  )
}

export default App
