import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'

const ADMIN_CARDS = [
  { id: 'system', title: 'System', description: 'App name, logo, registration', path: '/admin/system', Icon: Settings },
]

const AdminPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Admin</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_CARDS.map((card) => {
            const Icon = card.Icon
            return (
              <Link
                key={card.id}
                to={card.path}
                className="block p-5 rounded-xl bg-white border border-gray-200 hover:border-amber-400 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Icon className="w-8 h-8 mb-2 text-gray-700" aria-hidden />
                <h2 className="font-medium text-gray-900">{card.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{card.description}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AdminPage
