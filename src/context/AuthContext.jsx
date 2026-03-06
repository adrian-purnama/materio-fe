import { createContext, useContext, useState, useEffect } from 'react'
import apiHelper from '../helper/apiHelper'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [email, setEmail] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const verifyToken = async () => {
    const token = localStorage.getItem('fc-token')
    if (!token) {
      setEmail(null)
      setIsAdmin(false)
      setUserId(null)
      setAuthLoading(false)
      return
    }
    try {
      const { data } = await apiHelper.get('/auth/verify-token')
      if (data?.success && data?.data?.email) {
        setEmail(data.data.email)
        setIsAdmin(data.data.isAdmin)
        setUserId(data.data.id)
      } else {
        localStorage.removeItem('fc-token')
        setEmail(null)
        setIsAdmin(false)
        setUserId(null)
      }
    } catch {
      localStorage.removeItem('fc-token')
      setEmail(null)
      setIsAdmin(false)
      setUserId(null)
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    verifyToken()
  }, [])

  const value = {
    email,
    isAdmin,
    userId,
    setEmail,
    authLoading,
    verifyToken,
    isLoggedIn: !!email,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
