import { Link } from 'react-router-dom'
import { useImage } from '../context/ImageContext'
import { BarChart3, Package, PenSquare, Key } from 'lucide-react'

export default function LandingPage() {
  const { logo, appName } = useImage()

  return (
    <div className="min-h-[calc(100vh-2.5rem)] flex flex-col">
      {/* Hero */}
      <section className="text-center py-16 md:py-24">
        <div className="inline-flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl">
          <img src={logo} alt="" className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 object-contain" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">
          {appName}
        </h1>
        <p className="text-gray-600 text-lg max-w-md mx-auto mb-10">
          Manage inventory, track sales, and keep your bookkeeping in one place.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-lg bg-amber-500 text-gray-900 font-medium px-6 py-3 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 text-gray-700 font-medium px-6 py-3 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
          >
            Sign up
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-200 py-12 md:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <PenSquare className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Data entry</h3>
              <p className="text-sm text-gray-600">Products, items, and units in one workspace.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Stock & sales</h3>
              <p className="text-sm text-gray-600">Purchases, sales, and low-stock alerts.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Dashboard</h3>
              <p className="text-sm text-gray-600">Spending, income, and top sellers at a glance.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">API access</h3>
              <p className="text-sm text-gray-600">Create API keys to integrate with your tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mt-auto pt-8 pb-4 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-amber-600 hover:text-amber-700">
            Log in
          </Link>
          {' · '}
          <Link to="/register" className="font-medium text-amber-600 hover:text-amber-700">
            Sign up
          </Link>
        </p>
      </section>
    </div>
  )
}
