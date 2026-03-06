import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import apiHelper from '../../../helper/apiHelper'
import SystemForm from '../../../components/forms/SystemForm'

const SystemPage = () => {
  const [system, setSystem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  const fetchSystem = async () => {
    setLoading(true)
    try {
      const { data } = await apiHelper.get('/api/system')
      setSystem(data?.data ?? null)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load system'
      toast.error(msg)
      setSystem(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystem()
  }, [])

  const handleSubmit = async (payload) => {
    try {
      await apiHelper.put('/api/system', payload)
      toast.success('System updated')
      setSystem((prev) => (prev ? { ...prev, ...payload } : null))
      setEditing(false)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update'
      toast.error(msg)
    }
  }

  const handleCancel = () => {
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/admin"
          className="inline-flex items-center text-sm text-gray-600 hover:text-amber-600 mb-6"
        >
          ← Back to Admin
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">System</h1>

        {!system ? (
          <div className="p-5 rounded-xl bg-white border border-gray-200 text-gray-600 shadow-sm">
            No system config found.
          </div>
        ) : editing ? (
          <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Edit system</h2>
            <SystemForm
              initialValues={system}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <>
            <div className="p-5 rounded-xl bg-white border border-gray-200 space-y-4 mb-4 shadow-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">App name</p>
                <p className="text-gray-900 font-medium">{system.appName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Logo URL</p>
                <p className="text-gray-700 break-all">{system.logoUrl || '—'}</p>
                {system.logoUrl && (
                  <img src={system.logoUrl} alt="Logo" className="mt-2 h-12 object-contain" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Open registration</p>
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded ${
                    system.openRegistration ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {system.openRegistration ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-4 py-2 rounded-lg bg-amber-500 text-gray-900 font-medium hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              Edit
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default SystemPage
