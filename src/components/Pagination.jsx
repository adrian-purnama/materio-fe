/**
 * Simple pagination: Prev | Page X of Y | Next
 * Props: page, totalPages, onPageChange
 */
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
      >
        Next
      </button>
    </div>
  )
}

export default Pagination
