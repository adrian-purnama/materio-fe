import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import apiHelper from '../../helper/apiHelper'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import AuthImage from '../../components/AuthImage'
import ProductForm from '../../components/forms/ProductForm'

const PRODUCTS_PAGE_SIZE = 10

const ProductsSubPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: PRODUCTS_PAGE_SIZE, total: 0, totalPages: 1 })
  const [items, setItems] = useState([])
  const [preferredUnitOptions, setPreferredUnitOptions] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  const fetchData = async (page = 1) => {
    setLoading(true)
    try {
      const [productsRes, itemsRes, unitsRes] = await Promise.all([
        apiHelper.get('/api/products', { params: { page, limit: PRODUCTS_PAGE_SIZE } }),
        apiHelper.get('/api/items', { params: { limit: 2000 } }),
        apiHelper.get('/api/units'),
      ])
      if (productsRes.data?.success && Array.isArray(productsRes.data.data)) {
        setProducts(productsRes.data.data)
        if (productsRes.data.pagination) {
          setPagination(productsRes.data.pagination)
        }
        if (selectedId) {
          const found = productsRes.data.data.find((d) => d._id === selectedId)
          setSelectedProduct(found || null)
          setSelectedId(found?._id ?? null)
        } else if (!creatingNew) {
          setSelectedProduct(null)
          setSelectedId(null)
        }
      } else {
        setProducts([])
        if (!creatingNew) {
          setSelectedProduct(null)
          setSelectedId(null)
        }
      }
      if (itemsRes.data?.success && Array.isArray(itemsRes.data.data)) {
        setItems(itemsRes.data.data)
      } else {
        setItems([])
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
      setProducts([])
      setItems([])
      setPreferredUnitOptions([])
      setSelectedProduct(null)
      setSelectedId(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(1)
  }, [])

  const handleSubmit = async (payload) => {
    setSaving(true)
    const t = toast.loading(selectedId && !creatingNew ? 'Updating...' : 'Saving...')
    try {
      if (selectedId && !creatingNew) {
        const { data } = await apiHelper.put(`/api/products/${selectedId}`, payload)
        toast.success(data.message || 'Product updated', { id: t })
      } else {
        const { data } = await apiHelper.post('/api/products', payload)
        toast.success(data.message || 'Product created', { id: t })
      }
      setSelectedId(null)
      setSelectedProduct(null)
      setCreatingNew(false)
      fetchData(pagination.page)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save product'
      toast.error(msg, { id: t })
    } finally {
      setSaving(false)
    }
  }

  const handleNew = () => {
    setSelectedProduct(null)
    setSelectedId(null)
    setCreatingNew(true)
  }

  const handleEdit = (product) => {
    setSelectedProduct(product)
    setSelectedId(product._id)
    setCreatingNew(false)
  }

  const handleCancelForm = () => {
    setSelectedProduct(null)
    setSelectedId(null)
    setCreatingNew(false)
  }

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id).then(
      () => toast.success('ID copied to clipboard'),
      () => toast.error('Could not copy')
    )
  }

  const handleDeleteClick = (id) => setDeleteTargetId(id)

  const handleDeleteConfirm = async () => {
    const id = deleteTargetId
    if (!id) return
    setDeleteTargetId(null)
    try {
      await apiHelper.delete(`/api/products/${id}`)
      toast.success('Product deleted')
      if (selectedId === id) {
        setSelectedProduct(null)
        setSelectedId(null)
        setCreatingNew(false)
      }
      fetchData(pagination.page)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete'
      toast.error(msg)
    }
  }

  const unitLabel = (product) => product.unitSet?.symbol ?? ''

  if (loading) return <p className="text-gray-600">Loading products…</p>

  const showForm = creatingNew || selectedProduct

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Products</h2>
          <p className="text-sm text-gray-600">
            Add products with unit set, price, stock, and bill of materials (what it takes to make each one).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleNew}
            className="text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            + New product
          </button>
          {saving && <span className="text-xs text-gray-500">Saving…</span>}
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <ProductForm
            initialValues={selectedProduct || null}
            preferredUnitOptions={preferredUnitOptions}
            items={items}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
            isEdit={!!selectedId && !creatingNew}
          />
        </div>
      )}

      <div className="pt-2">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Existing products</h3>
        {products.length === 0 ? (
          <p className="text-sm text-gray-500">
            No products yet. Click &quot;+ New product&quot; to create one. Add units and items first if needed.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {products.map((product) => (
              <div
                key={product._id}
                className="rounded-lg border border-gray-200 bg-white p-4 text-sm flex gap-3"
              >
                {product.imageUrl ? (
                  <AuthImage
                    src={product.imageUrl}
                    alt=""
                    className="h-14 w-14 object-cover rounded border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center text-gray-400 text-xs">No img</div>
                )}
                <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(product)}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(product._id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {product.description && (
                  <p className="text-gray-600 text-xs mb-1">{product.description}</p>
                )}
                <p className="text-gray-500 text-xs">
                  {product.unitSet?.description ?? '—'} · Price: {product.price} · Stock: {product.stock} {unitLabel(product)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-400 text-xs">ID:</span>
                  <code className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded font-mono truncate max-w-48" title={product._id}>
                    {product._id}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyId(product._id)}
                    className="text-xs font-medium text-amber-600 hover:text-amber-700 shrink-0"
                  >
                    Copy
                  </button>
                </div>
                {product.billsOfMaterial?.length > 0 && (
                  <p className="text-gray-500 text-xs mt-1">
                    BOM: {product.billsOfMaterial.map((l) => `${l.item?.name ?? '?'} × ${l.quantity}`).join(', ')}
                  </p>
                )}
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
        title="Delete product?"
      >
        <p className="text-sm text-gray-600 mb-4">
          This product will be permanently deleted. This cannot be undone.
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

export default ProductsSubPage
