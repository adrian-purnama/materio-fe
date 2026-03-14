import { useState } from 'react'

const UnitForm = ({ initialValues, onSubmit, onCancel, isEdit }) => {
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [symbol, setSymbol] = useState(initialValues?.symbol ?? '')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      description: description.trim(),
      symbol: symbol.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="e.g. Litre"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Symbol
        </label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="e.g. L"
          required
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="px-4 py-2 rounded bg-amber-500 text-gray-900 hover:bg-amber-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {isEdit ? 'Update' : 'Save'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default UnitForm
