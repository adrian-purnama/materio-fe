import { useState } from 'react'
import ItemStockSubPage from './stock/ItemStockSubPage'
import PurchasesSubPage from './stock/PurchasesSubPage'
import SoldsSubPage from './stock/SoldsSubPage'

const TABS = [
  { id: 'item-stock', label: 'Item stock', component: ItemStockSubPage },
  { id: 'purchases', label: 'Purchases', component: PurchasesSubPage },
  { id: 'sales', label: 'Sales', component: SoldsSubPage },
]

export default function StockPage() {
  const [activeTab, setActiveTab] = useState('item-stock')

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component ?? ItemStockSubPage

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Stock</h1>
        <p className="text-gray-600 mb-4">
          Record purchases and track stock movements. Use the tabs below to switch views.
        </p>

        <div className="mb-3 border-b border-gray-200">
          <nav className="-mb-px flex gap-4">
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    isActive
                      ? 'border-amber-500 text-amber-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}
