import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import apiHelper from '../../helper/apiHelper'
import Modal from '../../components/Modal'
import UnitForm from '../../components/forms/UnitForm'

const UnitsSubPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [list, setList] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [populating, setPopulating] = useState(false)

  const fetchUnits = async () => {
    setLoading(true)
    try {
      const { data } = await apiHelper.get('/api/units')
      if (data?.success && Array.isArray(data.data)) {
        setList(data.data)
        if (selectedId) {
          const found = data.data.find((d) => d._id === selectedId)
          setSelectedDoc(found || null)
          setSelectedId(found?._id ?? null)
        } else if (!creatingNew) {
          setSelectedDoc(null)
          setSelectedId(null)
        }
      } else {
        setList([])
        if (!creatingNew) {
          setSelectedDoc(null)
          setSelectedId(null)
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load units'
      toast.error(msg)
      setList([])
      setSelectedDoc(null)
      setSelectedId(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [])

  const handleSubmit = async (payload) => {
    setSaving(true)
    const t = toast.loading(selectedId && !creatingNew ? 'Updating...' : 'Saving...')
    try {
      if (selectedId && !creatingNew) {
        const { data } = await apiHelper.put(`/api/units/${selectedId}`, payload)
        toast.success(data.message || 'Units updated', { id: t })
      } else {
        const { data } = await apiHelper.post('/api/units', payload)
        toast.success(data.message || 'Units saved', { id: t })
      }
      setSelectedId(null)
      setSelectedDoc(null)
      setCreatingNew(false)
      fetchUnits()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save units'
      toast.error(msg, { id: t })
    } finally {
      setSaving(false)
    }
  }

  const handleNew = () => {
    setSelectedDoc(null)
    setSelectedId(null)
    setCreatingNew(true)
  }

  const handleEdit = (doc) => {
    setSelectedDoc(doc)
    setSelectedId(doc._id)
    setCreatingNew(false)
  }

  const handleCancelForm = () => {
    setSelectedDoc(null)
    setSelectedId(null)
    setCreatingNew(false)
  }

  const handlePopulateDefaults = async () => {
    setPopulating(true)
    const t = toast.loading('Adding default unit sets…')
    try {
      const { data } = await apiHelper.post('/api/units/populate')
      toast.success(data.message || 'Defaults added', { id: t })
      fetchUnits()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to populate'
      toast.error(msg, { id: t })
    } finally {
      setPopulating(false)
    }
  }

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id)
  }

  const handleDeleteConfirm = async () => {
    const id = deleteTargetId
    if (!id) return
    setDeleteTargetId(null)
    try {
      await apiHelper.delete(`/api/units/${id}`)
      toast.success('Unit deleted')
      if (selectedId === id) {
        setSelectedDoc(null)
        setSelectedId(null)
        setCreatingNew(false)
      }
      fetchUnits()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete'
      toast.error(msg)
    }
  }

  if (loading) {
    return <p className="text-gray-600">Loading units…</p>
  }

  const showForm = creatingNew || selectedDoc

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Units</h2>
          <p className="text-sm text-gray-600">
            Add units (e.g. L, kg, g). Each unit is separate; no conversion.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePopulateDefaults}
            disabled={populating}
            className="text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Populate defaults
          </button>
          <button
            type="button"
            onClick={handleNew}
            className="text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            + New unit
          </button>
          {(saving || populating) && <span className="text-xs text-gray-500">Saving…</span>}
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <UnitForm
            initialValues={
              selectedDoc || {
                description: '',
                symbol: '',
              }
            }
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
            isEdit={!!selectedId && !creatingNew}
          />
        </div>
      )}

      <div className="pt-2">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Existing units</h3>
        {list.length === 0 ? (
          <p className="text-sm text-gray-500">
            No units yet. Click &quot;+ New unit&quot; or &quot;Populate defaults&quot; to add some.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((doc) => (
              <div
                key={doc._id}
                className="rounded-lg border border-gray-200 bg-white p-4 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900">{doc.description || doc.symbol || '(No description)'}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(doc)}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(doc._id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-xs mt-1">Symbol: {doc.symbol}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete unit?"
      >
        <p className="text-sm text-gray-600 mb-4">
          This unit will be permanently deleted. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTargetId(null)}
            className="px-3 py-2 rounded bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteConfirm}
            className="px-3 py-2 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default UnitsSubPage
