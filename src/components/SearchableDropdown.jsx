import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const SearchableDropdown = ({
  options = [],
  valueKey = '_id',
  labelKey = 'name',
  value = '',
  selectedValues = [],
  onChange,
  multiple = false,
  placeholder = 'Select...',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dropdownRect, setDropdownRect] = useState(null)
  const containerRef = useRef(null)
  const dropdownRef = useRef(null)

  const getLabel = (item) => (item && item[labelKey] != null ? String(item[labelKey]) : '')
  const getValue = (item) => (item && item[valueKey] != null ? item[valueKey] : '')

  const filteredOptions = options.filter((item) =>
    getLabel(item).toLowerCase().includes(search.trim().toLowerCase())
  )

  const selectedOption = options.find((o) => getValue(o) === value)
  const selectedOptions = options.filter((o) => selectedValues.includes(getValue(o)))

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownRect({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    } else {
      setDropdownRect(null)
    }
  }, [open])

  useEffect(() => {
    const updatePosition = () => {
      if (open && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDropdownRect({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        })
      }
    }
    if (open) {
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [open])

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inContainer = containerRef.current?.contains(e.target)
      const inDropdown = dropdownRef.current?.contains(e.target)
      if (!inContainer && !inDropdown) setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleSelect = (item) => {
    const id = getValue(item)
    if (multiple) {
      const next = selectedValues.includes(id)
        ? selectedValues.filter((v) => v !== id)
        : [...selectedValues, id]
      onChange(next)
    } else {
      onChange(id)
      setOpen(false)
      setSearch('')
    }
  }

  const handleTriggerClick = () => {
    if (!disabled) {
      setOpen((prev) => !prev)
      if (!open) setSearch('')
    }
  }

  const displayText = multiple
    ? selectedOptions.length > 0
      ? `${selectedOptions.length} selected`
      : placeholder
    : selectedOption
      ? getLabel(selectedOption)
      : placeholder

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={handleTriggerClick}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 border border-gray-300 rounded px-3 py-2 text-left text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={selectedOption || (multiple && selectedOptions.length > 0) ? 'text-gray-900' : 'text-gray-500'}>
          {displayText}
        </span>
        <span className="text-gray-400 shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {open &&
        dropdownRect &&
        createPortal(
          <div
            ref={dropdownRef}
            className="absolute z-9999 rounded border border-gray-200 bg-white shadow-xl"
            style={{
              top: dropdownRect.top + 4,
              left: dropdownRect.left,
              width: dropdownRect.width,
              minWidth: dropdownRect.width,
            }}
          >
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded border border-gray-300 bg-gray-50 px-2 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ul className="max-h-48 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500">No matches</li>
              ) : (
                filteredOptions.map((item) => {
                  const id = getValue(item)
                  const label = getLabel(item)
                  const isSelected = multiple ? selectedValues.includes(id) : value === id
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(item)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                          isSelected ? 'bg-amber-50 text-amber-700' : 'text-gray-800'
                        }`}
                      >
                        {multiple && (
                          <span className="shrink-0 w-4 h-4 rounded border flex items-center justify-center">
                            {isSelected ? '✓' : ''}
                          </span>
                        )}
                        {label}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  )
}

export default SearchableDropdown
