import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import apiHelper from '../../helper/apiHelper'
import Pagination from '../../components/Pagination'
import AuthImage from '../../components/AuthImage'
import { formatNumber } from '../../helper/formatHelper'

const ITEMS_PAGE_SIZE = 10

const unitLabel = (item) => item.unitSet?.symbol ?? ''

const ItemStockSubPage = () => {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: ITEMS_PAGE_SIZE, total: 0, totalPages: 1 })
  const [availableProducts, setAvailableProducts] = useState([])
  const [availableLoading, setAvailableLoading] = useState(false)

  const fetchAvailableProducts = useCallback(async () => {
    setAvailableLoading(true)
    try {
      const res = await apiHelper.get('/api/products/available')
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAvailableProducts(res.data.data)
      } else {
        setAvailableProducts([])
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load available products'
      toast.error(msg)
      setAvailableProducts([])
    } finally {
      setAvailableLoading(false)
    }
  }, [])

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const itemsRes = await apiHelper.get('/api/items', { params: { page, limit: ITEMS_PAGE_SIZE } })
      if (itemsRes.data?.success && Array.isArray(itemsRes.data.data)) {
        setItems(itemsRes.data.data)
        if (itemsRes.data.pagination) setPagination(itemsRes.data.pagination)
      } else {
        setItems([])
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load'
      toast.error(msg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  useEffect(() => {
    fetchAvailableProducts()
  }, [fetchAvailableProducts])

  if (loading) return <p className="text-gray-600">Loading item stock…</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Item stock</h2>
        <p className="text-sm text-gray-600">
          View current stock and stock added over time (from purchases).
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Current stock</h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">
            No items yet. Add items in Data entry first.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => {
              const qty = item.quantity ?? 0
              const threshold = item.lowReminderThreshold ?? 0
              const isLow = threshold > 0 && qty < threshold
              return (
                <div
                  key={item._id}
                  className={`rounded-lg border p-4 text-sm flex gap-3 ${isLow ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'}`}
                >
                  {item.imageUrl ? (
                    <AuthImage
                      src={item.imageUrl}
                      alt=""
                      className="h-12 w-12 object-cover rounded border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center text-gray-400 text-xs">—</div>
                  )}
                  <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 mb-1">{item.name}</p>
                  {item.description && (
                    <p className="text-gray-600 text-xs mb-1">{item.description}</p>
                  )}
                  <p className="text-gray-700 text-sm">
                    Stock: {formatNumber(qty)} {unitLabel(item)}
                  </p>
                  {isLow && (
                    <p className="text-amber-700 text-xs font-medium mt-1">Low stock — below reminder threshold ({formatNumber(threshold)} {unitLabel(item)})</p>
                  )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(p) => fetchData(p)}
        />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">All products</h3>
        <p className="text-xs text-gray-500 mb-3">How many you can make from current item stock.</p>
        {availableLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : availableProducts.length === 0 ? (
          <p className="text-sm text-gray-500">
            No products yet. Add products in Data entry first.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {availableProducts.map((p) => (
              <div
                key={p._id}
                className={`rounded-lg border p-4 text-sm flex gap-3 ${p.canMake === 0 && p.missing?.length ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200 bg-white'}`}
              >
                {p.imageUrl ? (
                  <AuthImage
                    src={p.imageUrl}
                    alt=""
                    className="h-12 w-12 object-cover rounded border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center text-gray-400 text-xs">—</div>
                )}
                <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 mb-1">{p.name}</p>
                <p className="text-gray-700 text-sm">
                  Can make: {p.canMake == null ? 'N/A' : formatNumber(p.canMake)}
                </p>
                {p.canMake === 0 && p.missing?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-amber-200">
                    <p className="text-xs font-medium text-amber-800 mb-1">Missing to make 1:</p>
                    <ul className="text-xs text-amber-700 space-y-0.5">
                      {p.missing.map((m) => (
                        <li key={m.itemId}>
                          {m.itemName}: need {formatNumber(m.shortfall)} more (have {formatNumber(m.currentStock)}, need {formatNumber(m.requiredPerUnit)} per unit)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default ItemStockSubPage
