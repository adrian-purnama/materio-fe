import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import apiHelper from '../../helper/apiHelper'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import AuthImage from '../../components/AuthImage'
import ItemForm from '../../components/forms/ItemForm'

const ITEMS_PAGE_SIZE = 10

const ItemsSubPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: ITEMS_PAGE_SIZE, total: 0, totalPages: 1 })
  const [preferredUnitOptions, setPreferredUnitOptions] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  const fetchData = async (page = 1) => {
    setLoading(true)
    try {
      const [itemsRes, unitsRes] = await Promise.all([
        apiHelper.get('/api/items', { params: { page, limit: ITEMS_PAGE_SIZE } }),
        apiHelper.get('/api/units'),
      ])
      if (itemsRes.data?.success && Array.isArray(itemsRes.data.data)) {
        setItems(itemsRes.data.data)
        if (itemsRes.data.pagination) {
          setPagination(itemsRes.data.pagination)
        }
        if (selectedId) {
          const found = itemsRes.data.data.find((d) => d._id === selectedId)
          setSelectedItem(found || null)
          setSelectedId(found?._id ?? null)
        } else if (!creatingNew) {
          setSelectedItem(null)
          setSelectedId(null)
        }
      } else {
        setItems([])
        if (!creatingNew) {
          setSelectedItem(null)
          setSelectedId(null)
        }
      }
      if (unitsRes.data?.success && Array.isArray(unitsRes.data.data)) {
        setPreferredUnitOptions(unitsRes.data.data.map((u) => ({
          unitSetId: u._id,
          unitSetDescription: u.description,
          symbol: u.symbol,
        })))
      } else {
        setPreferredUnitOptions([])
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load'
      toast.error(msg)
      setItems([])
      setPreferredUnitOptions([])
      setSelectedItem(null)
      setSelectedId(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(pagination.page)
  }, [])

  const handleSubmit = async (payload) => {
    setSaving(true)
    const t = toast.loading(selectedId && !creatingNew ? 'Updating...' : 'Saving...')
    try {
      if (selectedId && !creatingNew) {
        const { data } = await apiHelper.put(`/api/items/${selectedId}`, payload)
        toast.success(data.message || 'Item updated', { id: t })
      } else {
        const { data } = await apiHelper.post('/api/items', payload)
        toast.success(data.message || 'Item created', { id: t })
      }
      setSelectedId(null)
      setSelectedItem(null)
      setCreatingNew(false)
      fetchData(pagination.page)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save item'
      toast.error(msg, { id: t })
    } finally {
      setSaving(false)
    }
  }

  const handleNew = () => {
    setSelectedItem(null)
    setSelectedId(null)
    setCreatingNew(true)
  }

  const handleEdit = (item) => {
    setSelectedItem(item)
    setSelectedId(item._id)
    setCreatingNew(false)
  }

  const handleCancelForm = () => {
    setSelectedItem(null)
    setSelectedId(null)
    setCreatingNew(false)
  }

  const handleDeleteClick = (id) => setDeleteTargetId(id)

  const handleDeleteConfirm = async () => {
    const id = deleteTargetId
    if (!id) return
    setDeleteTargetId(null)
    try {
      await apiHelper.delete(`/api/items/${id}`)
      toast.success('Item deleted')
      if (selectedId === id) {
        setSelectedItem(null)
        setSelectedId(null)
        setCreatingNew(false)
      }
      fetchData(pagination.page)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete'
      toast.error(msg)
    }
  }

  const unitLabel = (item) => item.unitSet?.symbol ?? ''

  if (loading) return <p className="text-gray-600">Loading items…</p>

  const showForm = creatingNew || selectedItem

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Items</h2>
          <p className="text-sm text-gray-600">
            Add items and track stock. Each item uses a unit set (e.g. Mass, Volume, Count).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleNew}
            className="text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            + New item
          </button>
          {saving && <span className="text-xs text-gray-500">Saving…</span>}
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <ItemForm
            initialValues={selectedItem || null}
            preferredUnitOptions={preferredUnitOptions}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
            isEdit={!!selectedId && !creatingNew}
          />
        </div>
      )}

      <div className="pt-2">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Existing items</h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">
            No items yet. Click &quot;+ New item&quot; or add unit sets in the Units tab first.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <div
                key={item._id}
                className="rounded-lg border border-gray-200 bg-white p-4 text-sm flex gap-3"
              >
                {item.imageUrl ? (
                  <AuthImage
                    src={item.imageUrl}
                    alt=""
                    className="h-14 w-14 object-cover rounded border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center text-gray-400 text-xs">No img</div>
                )}
                <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(item._id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-gray-600 text-xs mb-1">{item.description}</p>
                )}
                <p className="text-gray-500 text-xs">
                  Unit: {item.unitSet?.description ?? item.unitSet ?? '—'} · Stock: {item.quantity} {unitLabel(item)}
                </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(p) => fetchData(p)}
        />
      </div>

      <Modal
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete item?"
      >
        <p className="text-sm text-gray-600 mb-4">
          This item will be permanently deleted. This cannot be undone.
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

export default ItemsSubPage
