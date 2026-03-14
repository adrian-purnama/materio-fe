import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ExcelJS from 'exceljs'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import apiHelper from '../helper/apiHelper'
import { formatNumber } from '../helper/formatHelper'
import AuthImage from '../components/AuthImage'
import Modal from '../components/Modal'

function getDashboardParams(mode, fromDate, toDate) {
  if (mode === 'range' && fromDate && toDate) return { from: fromDate, to: toDate }
  return { period: 'all' }
}

function getCurrentMonthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export default function HomePage() {
  const [mode, setMode] = useState('all')
  const [fromDate, setFromDate] = useState(() => getCurrentMonthRange().from)
  const [toDate, setToDate] = useState(() => getCurrentMonthRange().to)
  const [summary, setSummary] = useState(null)
  const [chartData, setChartData] = useState([])
  const [topSelling, setTopSelling] = useState([])
  const [topSellingLimit, setTopSellingLimit] = useState(1)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [lowStock, setLowStock] = useState([])
  const [lowStockLoading, setLowStockLoading] = useState(true)
  const [apiKeyStatus, setApiKeyStatus] = useState({ hasApiKey: false, maskedKey: null })
  const [apiKeyLoading, setApiKeyLoading] = useState(true)
  const [apiKeyAction, setApiKeyAction] = useState(null)
  const [apiKeyReveal, setApiKeyReveal] = useState(null)
  const [showDeleteApiKeyModal, setShowDeleteApiKeyModal] = useState(false)

  const shouldFetch = mode === 'all' || (mode === 'range' && fromDate && toDate)

  const loadApiKeyStatus = async () => {
    try {
      setApiKeyLoading(true)
      const res = await apiHelper.get('/api/users/me/api-key')
      if (res.data?.success && res.data?.data) {
        setApiKeyStatus(res.data.data)
      }
    } catch {
      setApiKeyStatus({ hasApiKey: false, maskedKey: null })
    } finally {
      setApiKeyLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      await loadApiKeyStatus()
      if (cancelled) return
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLowStockLoading(true)
        const res = await apiHelper.get('/api/items/low-stock')
        if (cancelled) return
        if (res.data?.success && Array.isArray(res.data.data)) {
          setLowStock(res.data.data)
        } else {
          setLowStock([])
        }
      } catch {
        if (!cancelled) setLowStock([])
      } finally {
        if (!cancelled) setLowStockLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!shouldFetch) {
      if (mode === 'range') {
        setSummary(null)
        setChartData([])
      }
      setDashboardLoading(false)
      return
    }
    let cancelled = false
    const params = getDashboardParams(mode, fromDate, toDate)
    const load = async () => {
      try {
        setDashboardLoading(true)
        const [summaryRes, chartRes, topSellingRes] = await Promise.all([
          apiHelper.get('/api/dashboard/summary', { params }),
          apiHelper.get('/api/dashboard/chart', { params }),
          apiHelper.get('/api/dashboard/top-selling', { params: { ...params, limit: topSellingLimit } }),
        ])
        if (cancelled) return
        if (summaryRes.data?.success && summaryRes.data?.data) {
          setSummary(summaryRes.data.data)
        } else {
          setSummary(null)
        }
        if (chartRes.data?.success && Array.isArray(chartRes.data.data)) {
          setChartData(chartRes.data.data)
        } else {
          setChartData([])
        }
        if (topSellingRes.data?.success && Array.isArray(topSellingRes.data.data)) {
          setTopSelling(topSellingRes.data.data)
        } else {
          setTopSelling([])
        }
      } catch (err) {
        if (cancelled) return
        const msg = err.response?.data?.message || err.message || 'Failed to load dashboard'
        toast.error(msg)
        setSummary(null)
        setChartData([])
        setTopSelling([])
      } finally {
        if (!cancelled) setDashboardLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [shouldFetch, mode, fromDate, toDate, topSellingLimit])

  const handleExportExcel = async () => {
    if (mode === 'range' && (!fromDate || !toDate)) {
      toast.error('Set both From and To dates to export')
      return
    }
    setExporting(true)
    try {
      const exportParams = getDashboardParams(mode, fromDate, toDate)
      const res = await apiHelper.get('/api/dashboard/ledger', { params: exportParams })
      if (!res.data?.success || !Array.isArray(res.data.data)) {
        toast.error('No data to export')
        return
      }
      const data = res.data.data.map((row) => ({
        date: row.date ? new Date(row.date).toISOString().replace('T', ' ').slice(0, 19) : '',
        income: Number(row.income) || 0,
        outcome: Number(row.outcome) || 0,
        description: String(row.description ?? '').replace(/[\s\S]/g, (c) => {
        const code = c.charCodeAt(0)
        return code < 32 && code !== 9 && code !== 10 && code !== 13 ? '' : c
      }),
      }))

      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Ledger', { views: [{ state: 'frozen', ySplit: 1 }] })

      const thinBorder = { style: 'thin' }
      const borderAll = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder }
      const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }
      const headerFont = { bold: true }
      const altFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }

      ws.columns = [
        { width: 20 },
        { width: 14 },
        { width: 14 },
        { width: 50 },
      ]

      const headerRow = ws.getRow(1)
      ;['Date', 'Income', 'Outcome', 'Description'].forEach((text, i) => {
        const cell = headerRow.getCell(i + 1)
        cell.value = text
        cell.fill = headerFill
        cell.font = headerFont
        cell.border = borderAll
        cell.alignment = { vertical: 'middle' }
      })
      headerRow.height = 22

      data.forEach((row, idx) => {
        const r = ws.getRow(idx + 2)
        r.getCell(1).value = row.date
        r.getCell(2).value = row.income
        r.getCell(3).value = row.outcome
        r.getCell(4).value = row.description
        const rowFill = idx % 2 === 1 ? altFill : undefined
        ;[1, 2, 3, 4].forEach((col) => {
          const cell = r.getCell(col)
          cell.border = borderAll
          if (rowFill) cell.fill = rowFill
          if (col === 2 || col === 3) cell.numFmt = '0.00'
        })
      })

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ledger-${mode === 'range' && fromDate && toDate ? `${fromDate}-${toDate}` : 'all'}-${Date.now()}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export downloaded')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Export failed'
      toast.error(msg)
    } finally {
      setExporting(false)
    }
  }

  const unitLabel = (item) => item.unitSet?.symbol ?? item.unitSet?.description ?? ''

  const handleCreateOrRegenerateApiKey = async () => {
    setApiKeyAction('generate')
    try {
      const res = await apiHelper.post('/api/users/me/api-key')
      if (res.data?.success && res.data?.data) {
        setApiKeyReveal(res.data.data)
        setApiKeyStatus({ hasApiKey: true, maskedKey: res.data.data.apiKey?.slice(0, 10) + '…' + res.data.data.apiKey?.slice(-4) })
        toast.success('API key created. Copy it now; the secret will not be shown again.')
      } else {
        toast.error(res.data?.message || 'Failed to create API key')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create API key')
    } finally {
      setApiKeyAction(null)
    }
  }

  const handleDeleteApiKey = async () => {
    setShowDeleteApiKeyModal(false)
    setApiKeyAction('delete')
    try {
      await apiHelper.delete('/api/users/me/api-key')
      setApiKeyStatus({ hasApiKey: false, maskedKey: null })
      setApiKeyReveal(null)
      toast.success('API key deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete API key')
    } finally {
      setApiKeyAction(null)
    }
  }

  const closeApiKeyReveal = () => {
    setApiKeyReveal(null)
  }

  return (
    <div>
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm mb-6">
          <h2 className="text-sm font-medium text-gray-900 mb-2">API key</h2>
          <p className="text-xs text-gray-500 mb-3">Create an API key to access this app programmatically. Regenerating replaces your existing key.</p>
          {apiKeyLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : apiKeyReveal ? (
            <div className="space-y-3">
              <p className="text-xs text-amber-700 font-medium">Copy these now; the secret will not be shown again.</p>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 space-y-2 font-mono text-sm break-all">
                <div>
                  <span className="text-gray-500">API Key:</span>{' '}
                  <span className="text-gray-900">{apiKeyReveal.apiKey}</span>
                </div>
                <div>
                  <span className="text-gray-500">API Secret:</span>{' '}
                  <span className="text-gray-900">{apiKeyReveal.apiSecret}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeApiKeyReveal}
                className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                I’ve copied the key
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {apiKeyStatus.hasApiKey && (
                <span className="text-sm text-gray-600">Current key: {apiKeyStatus.maskedKey}</span>
              )}
              <button
                type="button"
                onClick={handleCreateOrRegenerateApiKey}
                disabled={apiKeyAction !== null}
                className="rounded border border-amber-500 bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {apiKeyAction === 'generate' ? 'Creating…' : apiKeyStatus.hasApiKey ? 'Regenerate key' : 'Create API key'}
              </button>
              {apiKeyStatus.hasApiKey && (
                <button
                  type="button"
                  onClick={() => setShowDeleteApiKeyModal(true)}
                  disabled={apiKeyAction !== null}
                  className="rounded border border-red-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete key
                </button>
              )}
            </div>
          )}
        </section>

        <Modal
          open={showDeleteApiKeyModal}
          onClose={() => setShowDeleteApiKeyModal(false)}
          title="Delete API key?"
        >
          <p className="text-sm text-gray-600 mb-4">
            Remove your API key? Any apps using it will stop working. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteApiKeyModal(false)}
              className="px-3 py-2 rounded bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteApiKey}
              disabled={apiKeyAction === 'delete'}
              className="px-3 py-2 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {apiKeyAction === 'delete' ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>

        {lowStockLoading ? (
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm mb-6">
            <h2 className="text-sm font-medium text-gray-900 mb-2">Low stock</h2>
            <p className="text-sm text-gray-500">Loading…</p>
          </section>
        ) : lowStock.length > 0 ? (
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm mb-6">
            <h2 className="text-sm font-medium text-gray-900 mb-2">Low stock</h2>
            <p className="text-xs text-gray-500 mb-3">Items at or below their reminder threshold</p>
            <ul className="space-y-2">
              {lowStock.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2"
                >
                  {item.imageUrl ? (
                    <AuthImage
                      src={item.imageUrl}
                      alt=""
                      className="h-10 w-10 object-cover rounded border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded border border-gray-200 bg-gray-200 shrink-0 flex items-center justify-center text-gray-400 text-xs">—</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatNumber(item.quantity)} {unitLabel(item)} · threshold {formatNumber(item.lowReminderThreshold)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm mb-8">
          <h2 className="text-sm font-medium text-gray-900 mb-3">Bookkeeping</h2>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex rounded border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setMode('all')}
                className={`px-3 py-2 text-sm font-medium ${mode === 'all' ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                All time
              </button>
              <button
                type="button"
                onClick={() => setMode('range')}
                className={`px-3 py-2 text-sm font-medium ${mode === 'range' ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Date range
              </button>
            </div>
            {mode === 'range' && (
              <>
                <label className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-500">From</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1.5 text-sm w-36"
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-500">To</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1.5 text-sm w-36"
                  />
                </label>
              </>
            )}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting || dashboardLoading || (mode === 'range' && (!fromDate || !toDate))}
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            >
              {exporting ? 'Exporting…' : 'Export to Excel'}
            </button>
          </div>
          {dashboardLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : summary != null ? (
            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Total spent</p>
                <p className="text-gray-900 font-medium">{formatNumber(summary.totalSpent)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Total sold</p>
                <p className="text-gray-900 font-medium">{formatNumber(summary.totalSold)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">
                  {summary.profit >= 0 ? 'Profit' : 'Net loss'}
                </p>
                <p
                  className={`font-medium ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {summary.profit >= 0 ? '' : '−'}
                  {formatNumber(Math.abs(summary.profit))}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No data for this period.</p>
          )}
          {!dashboardLoading && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Top selling</h3>
              {topSelling.length === 0 ? (
                <p className="text-sm text-gray-500">No sales in this period.</p>
              ) : (
                <ul className="space-y-2">
                  {topSelling.map((row, index) => (
                    <li
                      key={row.productId}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2"
                    >
                      <span className="text-xs font-medium text-gray-500 w-5">#{index + 1}</span>
                      {row.imageUrl ? (
                        <AuthImage
                          src={row.imageUrl}
                          alt=""
                          className="h-10 w-10 object-cover rounded border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded border border-gray-200 bg-gray-200 shrink-0 flex items-center justify-center text-gray-400 text-xs">—</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{row.productName}</p>
                        <p className="text-xs text-gray-500">
                          {formatNumber(row.quantitySold)} sold · {formatNumber(row.totalRevenue)} revenue
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {topSellingLimit === 1 && topSelling.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTopSellingLimit(10)}
                  className="mt-2 text-sm font-medium text-amber-600 hover:text-amber-700 focus:outline-none"
                >
                  Show more
                </button>
              )}
              {topSellingLimit > 1 && (
                <button
                  type="button"
                  onClick={() => setTopSellingLimit(1)}
                  className="mt-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  Show less
                </button>
              )}
            </div>
          )}
          {!dashboardLoading && chartData.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Income & spending over time</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip formatter={(v) => formatNumber(v)} labelFormatter={(l) => l} />
                    <Legend />
                    <Line type="monotone" dataKey="sold" name="Income" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="spent" name="Spent" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>
    </div>
  )
}
