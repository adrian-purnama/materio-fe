import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import apiHelper from '../../helper/apiHelper'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import PurchaseForm from '../../components/forms/PurchaseForm'
import SearchableDropdown from '../../components/SearchableDropdown'
import { formatNumber } from '../../helper/formatHelper'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_DAYS = 30

const CHART_DISPLAY_OPTIONS = [
  { _id: 'bar', name: 'Bar' },
  { _id: 'line', name: 'Line' },
]

const formatDateInput = (d) => {
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const canModifyPurchase = (createdAt) =>
  createdAt && Date.now() - new Date(createdAt).getTime() <= ONE_DAY_MS

const PURCHASES_PAGE_SIZE = 10

const PurchasesSubPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [purchases, setPurchases] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: PURCHASES_PAGE_SIZE, total: 0, totalPages: 1 })
  const [items, setItems] = useState([])
  const [chartSelectedItemIds, setChartSelectedItemIds] = useState([])
  const hasInitializedItemSelection = useRef(false)
  const [chartFrom, setChartFrom] = useState(() => formatDateInput(Date.now() - DEFAULT_DAYS * 24 * 60 * 60 * 1000))
  const [chartTo, setChartTo] = useState(() => formatDateInput(Date.now()))
  const [chartDisplay, setChartDisplay] = useState('bar')
  const [analyticsData, setAnalyticsData] = useState([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [showCreatedAt, setShowCreatedAt] = useState(true)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const params = { from: chartFrom, to: chartTo }
      const res = await apiHelper.get('/api/items/analytics', { params })
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAnalyticsData(res.data.data)
      } else {
        setAnalyticsData([])
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load analytics'
      toast.error(msg)
      setAnalyticsData([])
    } finally {
      setAnalyticsLoading(false)
    }
  }, [chartFrom, chartTo])

  const fetchData = async (page = 1) => {
    setLoading(true)
    try {
      const [purchasesRes, itemsRes] = await Promise.all([
        apiHelper.get('/api/purchases', { params: { page, limit: PURCHASES_PAGE_SIZE } }),
        apiHelper.get('/api/items', { params: { limit: 2000 } }),
      ])
      if (purchasesRes.data?.success && Array.isArray(purchasesRes.data.data)) {
        setPurchases(purchasesRes.data.data)
        if (purchasesRes.data.pagination) {
          setPagination(purchasesRes.data.pagination)
        }
        if (selectedId) {
          const found = purchasesRes.data.data.find((d) => d._id === selectedId)
          setSelectedPurchase(found || null)
          setSelectedId(found?._id ?? null)
        } else if (!creatingNew) {
          setSelectedPurchase(null)
          setSelectedId(null)
        }
      } else {
        setPurchases([])
        if (!creatingNew) {
          setSelectedPurchase(null)
          setSelectedId(null)
        }
      }
      if (itemsRes.data?.success && Array.isArray(itemsRes.data.data)) {
        setItems(itemsRes.data.data)
      } else {
        setItems([])
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load'
      toast.error(msg)
      setPurchases([])
      setItems([])
      setSelectedPurchase(null)
      setSelectedId(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (items.length > 0 && !hasInitializedItemSelection.current) {
      setChartSelectedItemIds(items.map((i) => i._id))
      hasInitializedItemSelection.current = true
    }
  }, [items])

  useEffect(() => {
    if (!chartFrom || !chartTo) return
    fetchAnalytics()
  }, [chartFrom, chartTo, fetchAnalytics])

  const filteredAnalyticsData =
    chartSelectedItemIds.length === 0
      ? []
      : analyticsData.filter((row) =>
          chartSelectedItemIds.some((id) => String(id) === String(row.itemId))
        )

  const spentDataByDay = (() => {
    const byDate = {}
    for (const row of filteredAnalyticsData) {
      const d = row.date
      if (!byDate[d]) byDate[d] = { date: d, totalSpent: 0 }
      const spent = Number(row.amountSpent) || 0
      byDate[d].totalSpent += spent
      const name = row.itemName || row.itemId || 'Item'
      byDate[d][name] = (byDate[d][name] || 0) + spent
    }
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
  })()
  const spentSeriesKeys =
    spentDataByDay.length > 0
      ? [
          ...new Set(
            spentDataByDay.flatMap((r) =>
              Object.keys(r).filter((k) => k !== 'date' && k !== 'totalSpent')
            )
          ),
        ]
      : []
  const spentChartDataWithAllKeys =
    spentDataByDay.length > 0 && spentSeriesKeys.length > 0
      ? spentDataByDay.map((r) => {
          const row = { ...r }
          spentSeriesKeys.forEach((k) => {
            if (!(k in row)) row[k] = 0
          })
          return row
        })
      : spentDataByDay
  const hasSpentData = spentDataByDay.length > 0

  const breakdownByItem = (() => {
    const byItem = {}
    for (const row of filteredAnalyticsData) {
      const name = row.itemName || row.itemId || 'Item'
      if (!byItem[name]) byItem[name] = { itemName: name, totalSpent: 0 }
      byItem[name].totalSpent += Number(row.amountSpent) || 0
    }
    return Object.values(byItem).sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
  })()
  const totalSpent = breakdownByItem.reduce((s, r) => s + (r.totalSpent || 0), 0)

  const handleSubmit = async (payload) => {
    setSaving(true)
    const t = toast.loading(selectedId && !creatingNew ? 'Updating...' : 'Saving...')
    try {
      if (selectedId && !creatingNew) {
        const { data } = await apiHelper.put(`/api/purchases/${selectedId}`, payload)
        toast.success(data.message || 'Purchase updated', { id: t })
      } else {
        const { data } = await apiHelper.post('/api/purchases', payload)
        toast.success(data.message || 'Purchase created', { id: t })
      }
      setSelectedId(null)
      setSelectedPurchase(null)
      setCreatingNew(false)
      fetchData(pagination.page)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save purchase'
      toast.error(msg, { id: t })
    } finally {
      setSaving(false)
    }
  }

  const handleNew = () => {
    setSelectedPurchase(null)
    setSelectedId(null)
    setCreatingNew(true)
  }

  const handleEdit = (purchase) => {
    setSelectedPurchase(purchase)
    setSelectedId(purchase._id)
    setCreatingNew(false)
  }

  const handleCancelForm = () => {
    setSelectedPurchase(null)
    setSelectedId(null)
    setCreatingNew(false)
  }

  const handleDeleteClick = (id) => setDeleteTargetId(id)

  const handleDeleteConfirm = async () => {
    const id = deleteTargetId
    if (!id) return
    setDeleteTargetId(null)
    try {
      await apiHelper.delete(`/api/purchases/${id}`)
      toast.success('Purchase deleted')
      if (selectedId === id) {
        setSelectedPurchase(null)
        setSelectedId(null)
        setCreatingNew(false)
      }
      fetchData(pagination.page)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete'
      toast.error(msg)
    }
  }

  if (loading) return <p className="text-gray-600">Loading purchases…</p>

  const showForm = creatingNew || selectedPurchase

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Purchases</h2>
          <p className="text-sm text-gray-600">
            Record incoming stock: item, quantity, and price per unit. Total is calculated automatically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleNew}
            className="text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            + New purchase
          </button>
          {saving && <span className="text-xs text-gray-500">Saving…</span>}
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <PurchaseForm
            initialValues={selectedPurchase || null}
            items={items}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
            isEdit={!!selectedId && !creatingNew}
          />
        </div>
      )}

     

      <div className="pt-2">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Recent purchases</h3>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showCreatedAt}
              onChange={(e) => setShowCreatedAt(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show date
          </label>
        </div>
        {purchases.length === 0 ? (
          <p className="text-sm text-gray-500">
            No purchases yet. Add items in Data entry first, then click &quot;+ New purchase&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {showCreatedAt && (
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Date</th>
                  )}
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Name</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Item</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Qty</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Per unit</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Total</th>
                  <th className="w-24 py-2 px-3" />
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase._id} className="border-b border-gray-100 hover:bg-gray-50">
                    {showCreatedAt && (
                      <td className="py-2 px-3 text-gray-600 text-xs">
                        {purchase.createdAt
                          ? new Date(purchase.createdAt).toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                    )}
                    <td className="py-2 px-3 text-gray-900">{purchase.name}</td>
                    <td className="py-2 px-3 text-gray-700">{purchase.item?.name ?? '—'}</td>
                    <td className="py-2 px-3 text-right text-gray-700">{formatNumber(purchase.quantity)}</td>
                    <td className="py-2 px-3 text-right text-gray-700">{formatNumber(purchase.quantityPerUnit ?? 1)}</td>
                    <td className="py-2 px-3 text-right text-gray-900">{formatNumber(purchase.total)}</td>
                    <td className="py-2 px-3">
                      {canModifyPurchase(purchase.createdAt) && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(purchase)}
                            className="text-xs font-medium text-amber-600 hover:text-amber-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(purchase._id)}
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(p) => fetchData(p)}
        />
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Money spent over time</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <label className="flex flex-col gap-1 min-w-[180px]">
            <span className="text-xs text-gray-500">Items to show (unselect to hide)</span>
            <SearchableDropdown
              options={items}
              valueKey="_id"
              labelKey="name"
              multiple
              selectedValues={chartSelectedItemIds}
              onChange={setChartSelectedItemIds}
              placeholder="All items selected"
              disabled={items.length === 0}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">From</span>
            <input
              type="date"
              value={chartFrom}
              onChange={(e) => setChartFrom(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">To</span>
            <input
              type="date"
              value={chartTo}
              onChange={(e) => setChartTo(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 min-w-[120px]">
            <span className="text-xs text-gray-500">Chart</span>
            <SearchableDropdown
              options={CHART_DISPLAY_OPTIONS}
              valueKey="_id"
              labelKey="name"
              value={chartDisplay}
              onChange={setChartDisplay}
              placeholder="Bar"
            />
          </label>
        </div>
        {analyticsLoading ? (
          <p className="text-sm text-gray-500 py-8">Loading…</p>
        ) : chartSelectedItemIds.length === 0 ? (
          <p className="text-sm text-gray-500 py-8">Select at least one item to show.</p>
        ) : !hasSpentData ? (
          <p className="text-sm text-gray-500 py-8">No purchase data in this range for selected items. Adjust dates or items.</p>
        ) : (
          <>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartDisplay === 'line' ? (
                  <LineChart data={spentChartDataWithAllKeys} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip formatter={(v) => formatNumber(v)} labelFormatter={(l) => l} />
                    <Legend />
                    {spentSeriesKeys.map((key, i) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={`hsl(${(i * 80) % 360}, 60%, 45%)`}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </LineChart>
                ) : (
                  <BarChart data={spentChartDataWithAllKeys} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip formatter={(v) => formatNumber(v)} labelFormatter={(l) => l} />
                    <Legend />
                    {spentSeriesKeys.map((key, i) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        fill={`hsl(${(i * 80) % 360}, 60%, 45%)`}
                      />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Breakdown ({chartFrom} – {chartTo})</h4>
              <div className="overflow-x-auto">
                <table className="min-w-[280px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-700">Item</th>
                      <th className="text-right py-2 font-medium text-gray-700">Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownByItem.map((row) => (
                      <tr key={row.itemName} className="border-b border-gray-100">
                        <td className="py-2 text-gray-900">{row.itemName}</td>
                        <td className="py-2 text-right text-gray-700">{formatNumber(row.totalSpent ?? 0)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-300 font-medium">
                      <td className="py-2 text-gray-900">Total</td>
                      <td className="py-2 text-right text-gray-900">{formatNumber(totalSpent)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

      <Modal
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete purchase?"
      >
        <p className="text-sm text-gray-600 mb-4">
          This purchase record will be permanently deleted. This cannot be undone.
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

export default PurchasesSubPage
