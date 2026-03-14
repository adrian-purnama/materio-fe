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
import SearchableDropdown from '../../components/SearchableDropdown'
import SoldForm from '../../components/forms/SoldForm'
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
const canModifySale = (createdAt) =>
  createdAt && Date.now() - new Date(createdAt).getTime() <= ONE_DAY_MS

const SALES_PAGE_SIZE = 10

const SoldsSubPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sales, setSales] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: SALES_PAGE_SIZE, total: 0, totalPages: 1 })
  const [products, setProducts] = useState([])
  const [chartSelectedProductIds, setChartSelectedProductIds] = useState([])
  const hasInitializedProductSelection = useRef(false)
  const [chartFrom, setChartFrom] = useState(() => formatDateInput(Date.now() - DEFAULT_DAYS * 24 * 60 * 60 * 1000))
  const [chartTo, setChartTo] = useState(() => formatDateInput(Date.now()))
  const [chartDisplay, setChartDisplay] = useState('bar')
  const [analyticsData, setAnalyticsData] = useState([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [showCreatedAt, setShowCreatedAt] = useState(true)
  const [selectedSale, setSelectedSale] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState(null)
  const [revokeReason, setRevokeReason] = useState('')

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const params = { from: chartFrom, to: chartTo }
      const res = await apiHelper.get('/api/sold/analytics', { params })
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
      const [salesRes, productsRes] = await Promise.all([
        apiHelper.get('/api/sold', { params: { page, limit: SALES_PAGE_SIZE } }),
        apiHelper.get('/api/products', { params: { limit: 2000 } }),
      ])
      if (salesRes.data?.success && Array.isArray(salesRes.data.data)) {
        setSales(salesRes.data.data)
        if (salesRes.data.pagination) {
          setPagination(salesRes.data.pagination)
        }
        if (selectedId) {
          const found = salesRes.data.data.find((d) => d._id === selectedId)
          setSelectedSale(found || null)
          setSelectedId(found?._id ?? null)
        } else if (!creatingNew) {
          setSelectedSale(null)
          setSelectedId(null)
        }
      } else {
        setSales([])
        if (!creatingNew) {
          setSelectedSale(null)
          setSelectedId(null)
        }
      }
      if (productsRes.data?.success && Array.isArray(productsRes.data.data)) {
        setProducts(productsRes.data.data)
      } else {
        setProducts([])
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load'
      toast.error(msg)
      setSales([])
      setProducts([])
      setSelectedSale(null)
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
    if (products.length > 0 && !hasInitializedProductSelection.current) {
      setChartSelectedProductIds(products.map((p) => p._id))
      hasInitializedProductSelection.current = true
    }
  }, [products])

  useEffect(() => {
    if (!chartFrom || !chartTo) return
    fetchAnalytics()
  }, [chartFrom, chartTo, fetchAnalytics])

  const filteredAnalyticsData =
    chartSelectedProductIds.length === 0
      ? []
      : analyticsData.filter((row) =>
          chartSelectedProductIds.some((id) => String(id) === String(row.productId))
        )

  const earnedDataByDay = (() => {
    const byDate = {}
    for (const row of filteredAnalyticsData) {
      const d = row.date
      if (!byDate[d]) byDate[d] = { date: d, totalEarned: 0 }
      const earned = Number(row.amountEarned) || 0
      byDate[d].totalEarned += earned
      const name = row.productName || row.productId || 'Product'
      byDate[d][name] = (byDate[d][name] || 0) + earned
    }
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
  })()
  const earnedSeriesKeys =
    earnedDataByDay.length > 0
      ? [
          ...new Set(
            earnedDataByDay.flatMap((r) =>
              Object.keys(r).filter((k) => k !== 'date' && k !== 'totalEarned')
            )
          ),
        ]
      : []
  const earnedChartDataWithAllKeys =
    earnedDataByDay.length > 0 && earnedSeriesKeys.length > 0
      ? earnedDataByDay.map((r) => {
          const row = { ...r }
          earnedSeriesKeys.forEach((k) => {
            if (!(k in row)) row[k] = 0
          })
          return row
        })
      : earnedDataByDay
  const hasEarnedData = earnedDataByDay.length > 0

  const breakdownByProduct = (() => {
    const byProduct = {}
    for (const row of filteredAnalyticsData) {
      const name = row.productName || row.productId || 'Product'
      if (!byProduct[name]) byProduct[name] = { productName: name, totalEarned: 0 }
      byProduct[name].totalEarned += Number(row.amountEarned) || 0
    }
    return Object.values(byProduct).sort((a, b) => (b.totalEarned || 0) - (a.totalEarned || 0))
  })()
  const totalEarned = breakdownByProduct.reduce((s, r) => s + (r.totalEarned || 0), 0)

  const handleSubmit = async (payload) => {
    setSaving(true)
    const t = toast.loading(selectedId && !creatingNew ? 'Updating...' : 'Saving...')
    try {
      if (selectedId && !creatingNew) {
        const { data } = await apiHelper.put(`/api/sold/${selectedId}`, payload)
        toast.success(data.message || 'Sale updated', { id: t })
      } else {
        const { data } = await apiHelper.post('/api/sold', payload)
        toast.success(data.message || 'Sale created', { id: t })
      }
      setSelectedId(null)
      setSelectedSale(null)
      setCreatingNew(false)
      fetchData(pagination.page)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save sale'
      toast.error(msg, { id: t })
    } finally {
      setSaving(false)
    }
  }

  const handleNew = () => {
    setSelectedSale(null)
    setSelectedId(null)
    setCreatingNew(true)
  }

  const handleEdit = (sale) => {
    setSelectedSale(sale)
    setSelectedId(sale._id)
    setCreatingNew(false)
  }

  const handleCancelForm = () => {
    setSelectedSale(null)
    setSelectedId(null)
    setCreatingNew(false)
  }

  const handleRevokeClick = (sale) => {
    setRevokeTarget(sale)
    setRevokeReason('')
  }

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return
    const saleToRevoke = revokeTarget
    const id = saleToRevoke._id
    setRevokeTarget(null)
    const reason = revokeReason.trim()
    try {
      await apiHelper.patch(`/api/sold/${id}/revoke`, reason ? { reason } : {})
      toast.success('Sale revoked')
      if (selectedId === id) {
        setSelectedSale(null)
        setSelectedId(null)
        setCreatingNew(false)
      }
      setRevokeReason('')
      fetchData(pagination.page)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to revoke'
      toast.error(msg)
      setRevokeTarget(saleToRevoke)
    }
  }

  if (loading) return <p className="text-gray-600">Loading sales…</p>

  const showForm = creatingNew || selectedSale

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Sales</h2>
          <p className="text-sm text-gray-600">
            Record sales: product, quantity, and price per unit. Name is auto-generated; price defaults to the product&apos;s current price.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleNew}
            className="text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            + New sale
          </button>
          {saving && <span className="text-xs text-gray-500">Saving…</span>}
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <SoldForm
            initialValues={selectedSale || null}
            products={products}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
            isEdit={!!selectedId && !creatingNew}
          />
        </div>
      )}

      

      <div className="pt-2">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Recent sales</h3>
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
        {sales.length === 0 ? (
          <p className="text-sm text-gray-500">
            No sales yet. Add products in Data entry first, then click &quot;+ New sale&quot;.
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
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Product</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Qty</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Price</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Total</th>
                  <th className="w-24 py-2 px-3" />
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale._id} className="border-b border-gray-100 hover:bg-gray-50">
                    {showCreatedAt && (
                      <td className="py-2 px-3 text-gray-600 text-xs">
                        {sale.createdAt
                          ? new Date(sale.createdAt).toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                    )}
                    <td className="py-2 px-3 text-gray-900">{sale.name}</td>
                    <td className="py-2 px-3 text-gray-700">{sale.product?.name ?? '—'}</td>
                    <td className="py-2 px-3 text-right text-gray-700">{formatNumber(sale.quantity)}</td>
                    <td className="py-2 px-3 text-right text-gray-700">{formatNumber(sale.pricePerQuantity)}</td>
                    <td className="py-2 px-3 text-right text-gray-900">{formatNumber(sale.total)}</td>
                    <td className="py-2 px-3">
                      {sale.revoked ? (
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Revoked</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {canModifySale(sale.createdAt) && (
                            <button
                              type="button"
                              onClick={() => handleEdit(sale)}
                              className="text-xs font-medium text-amber-600 hover:text-amber-700"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRevokeClick(sale)}
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                          >
                            Revoke
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
        <h3 className="text-sm font-medium text-gray-900 mb-3">Money earned over time</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <label className="flex flex-col gap-1 min-w-[180px]">
            <span className="text-xs text-gray-500">Products to show (unselect to hide)</span>
            <SearchableDropdown
              options={products}
              valueKey="_id"
              labelKey="name"
              multiple
              selectedValues={chartSelectedProductIds}
              onChange={setChartSelectedProductIds}
              placeholder="All products selected"
              disabled={products.length === 0}
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
        ) : chartSelectedProductIds.length === 0 ? (
          <p className="text-sm text-gray-500 py-8">Select at least one product to show.</p>
        ) : !hasEarnedData ? (
          <p className="text-sm text-gray-500 py-8">No sales data in this range for selected products. Adjust dates or products.</p>
        ) : (
          <>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartDisplay === 'line' ? (
                  <LineChart data={earnedChartDataWithAllKeys} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip formatter={(v) => formatNumber(v)} labelFormatter={(l) => l} />
                    <Legend />
                    {earnedSeriesKeys.map((key, i) => (
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
                  <BarChart data={earnedChartDataWithAllKeys} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip formatter={(v) => formatNumber(v)} labelFormatter={(l) => l} />
                    <Legend />
                    {earnedSeriesKeys.map((key, i) => (
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
                      <th className="text-left py-2 font-medium text-gray-700">Product</th>
                      <th className="text-right py-2 font-medium text-gray-700">Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownByProduct.map((row) => (
                      <tr key={row.productName} className="border-b border-gray-100">
                        <td className="py-2 text-gray-900">{row.productName}</td>
                        <td className="py-2 text-right text-gray-700">{formatNumber(row.totalEarned ?? 0)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-300 font-medium">
                      <td className="py-2 text-gray-900">Total</td>
                      <td className="py-2 text-right text-gray-900">{formatNumber(totalEarned)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

      <Modal
        open={!!revokeTarget}
        onClose={() => { setRevokeTarget(null); setRevokeReason('') }}
        title="Revoke sale?"
      >
        <p className="text-sm text-gray-600 mb-3">
          This sale will be marked as revoked. It will no longer count toward income or analytics. Stock will be restored if the sale used BOM.
        </p>
        <label className="block mb-4">
          <span className="text-xs text-gray-500">Reason (optional)</span>
          <input
            type="text"
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            placeholder="e.g. Refund, cancelled order"
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => { setRevokeTarget(null); setRevokeReason('') }}
            className="px-3 py-2 rounded bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRevokeConfirm}
            className="px-3 py-2 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          >
            Revoke
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default SoldsSubPage
