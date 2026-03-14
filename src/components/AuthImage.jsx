import { useState, useEffect, useRef } from 'react'
import apiHelper from '../helper/apiHelper'
import { baseURL } from '../helper/apiHelper'

/**
 * Renders an image that requires auth (e.g. item/product images).
 * Fetches the image with the current user's token and displays via blob URL.
 */
const AuthImage = ({ src, alt = '', className, ...props }) => {
  const [blobUrl, setBlobUrl] = useState(null)
  const [error, setError] = useState(false)
  const blobUrlRef = useRef(null)

  useEffect(() => {
    if (!src) {
      queueMicrotask(() => {
        setBlobUrl(null)
        setError(false)
      })
      return
    }
    const path = src.startsWith(baseURL) ? src.slice(baseURL.length) || '/' : src
    let cancelled = false
    apiHelper
      .get(path, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
        const url = URL.createObjectURL(res.data)
        blobUrlRef.current = url
        setBlobUrl(url)
        setError(false)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
      setBlobUrl(null)
    }
  }, [src])

  if (error || !blobUrl) {
    return (
      <div className={className} {...props}>
        <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs rounded">
          No img
        </div>
      </div>
    )
  }

  return <img src={blobUrl} alt={alt} className={className} {...props} />
}

export default AuthImage
