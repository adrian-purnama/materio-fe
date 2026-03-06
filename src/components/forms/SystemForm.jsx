import React, { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import apiHelper from '../../helper/apiHelper'
import { baseURL } from '../../helper/apiHelper'

const SystemForm = ({ initialValues, onSubmit, onCancel }) => {
  const [appName, setAppName] = useState(initialValues?.appName ?? 'FC')
  const [openRegistration, setOpenRegistration] = useState(initialValues?.openRegistration ?? false)
  const [logoUrl, setLogoUrl] = useState(initialValues?.logoUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ appName, openRegistration, logoUrl })
  }

  const logoImgSrc = logoUrl
    ? (logoUrl.startsWith('http') ? logoUrl : `${baseURL}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`)
    : ''

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await apiHelper.post('/api/images/upload', formData)
      if (data?.success && data?.data?.urlPath) {
        setLogoUrl(data.data.urlPath)
        toast.success('Image uploaded')
      } else {
        toast.error('Upload failed')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload failed'
      toast.error(msg)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="system-app-name" className="block text-sm font-medium text-gray-700 mb-1">
          Application name
        </label>
        <input
          id="system-app-name"
          type="text"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="e.g. FC"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Logo
        </label>
        <div className="flex flex-col gap-2">
          {logoImgSrc ? (
            <div className="flex items-center gap-3">
              <img
                src={logoImgSrc}
                alt="Logo"
                className="h-16 w-auto object-contain rounded border border-gray-300 bg-gray-50"
              />
            </div>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={handleImageUpload}
            disabled={uploading}
            className="w-full text-sm text-gray-600 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:bg-amber-500 file:text-gray-900 file:font-medium file:cursor-pointer hover:file:bg-amber-400"
          />
          {uploading && <span className="text-xs text-gray-500">Uploading…</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="system-open-registration"
          type="checkbox"
          checked={openRegistration}
          onChange={(e) => setOpenRegistration(e.target.checked)}
          className="rounded border-gray-300 bg-gray-50 text-amber-500 focus:ring-amber-500"
        />
        <label htmlFor="system-open-registration" className="text-sm font-medium text-gray-700">
          Open registration (allow new users to register)
        </label>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="px-4 py-2 rounded bg-amber-500 text-gray-900 hover:bg-amber-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          Update
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default SystemForm
