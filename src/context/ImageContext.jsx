import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import apiHelper from '../helper/apiHelper'

const ImageContext = createContext(null)

const DEFAULT_LOGO = '/FC-LOGO.png'

export function ImageProvider({ children }) {
  const [logoUrl, setLogoUrl] = useState('')
  const [appName, setAppName] = useState('Stream Haven')
  const [imageLoading, setImageLoading] = useState(true)

  const fetchBranding = useCallback(async () => {
    try {
      const { data } = await apiHelper.get('/auth/branding')
      if (data?.success && data?.data) {
        setAppName(data.data.appName || 'Stream Haven')
        setLogoUrl(data.data.logoUrl || '')
      }
    } catch {
      setLogoUrl('')
      setAppName('Stream Haven')
    } finally {
      setImageLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBranding()
  }, [fetchBranding])

  const logo = logoUrl || DEFAULT_LOGO

  const value = {
    logo,
    logoUrl,
    appName,
    imageLoading,
    refetchBranding: fetchBranding,
  }

  return <ImageContext.Provider value={value}>{children}</ImageContext.Provider>
}

export function useImage() {
  const ctx = useContext(ImageContext)
  if (!ctx) throw new Error('useImage must be used within ImageProvider')
  return ctx
}
