import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import apiHelper from '../../helper/apiHelper'
import { baseURL } from '../../helper/apiHelper'
import SearchableDropdown from '../SearchableDropdown'
import AuthImage from '../AuthImage'

const ItemForm = ({ initialValues, preferredUnitOptions = [], onSubmit, onCancel, isEdit }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [unitSet, setUnitSet] = useState('')
  const [lowReminderThreshold, setLowReminderThreshold] = useState('')
  const [imagePath, setImagePath] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Options for dropdown: value is unit set id; label shows description + preferred symbol
  const unitSetOptions = preferredUnitOptions.map((p) => ({
    unitSetId: p.unitSetId,
    label: `${p.unitSetDescription || 'Unit'} (${p.symbol || ''})`.trim() || p.unitSetId,
  }))

  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name ?? '')
      setDescription(initialValues.description ?? '')
      setUnitSet(initialValues.unitSet?._id ?? initialValues.unitSet ?? '')
      setLowReminderThreshold(initialValues.lowReminderThreshold != null ? String(initialValues.lowReminderThreshold) : '')
      setImagePath(initialValues.imagePath ?? '')
    } else {
      setName('')
      setDescription('')
      setUnitSet('')
      setLowReminderThreshold('')
      setImagePath('')
    }
  }, [initialValues, preferredUnitOptions])

  const itemImageSrc = imagePath
    ? (imagePath.startsWith('http') ? imagePath : `${baseURL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`)
    : ''

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await apiHelper.post('/api/images/upload', formData)
      if (data?.success && data?.data?.urlPath) {
        setImagePath(data.data.urlPath)
        toast.success('Image uploaded')
      } else {
        toast.error('Upload failed')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload failed'
      toast.error(msg)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!unitSet || !unitSet.trim()) {
      toast.error('Please select a unit set')
      return
    }
    const threshold = lowReminderThreshold.trim() === '' ? 0 : Math.max(0, Number(lowReminderThreshold) || 0)
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      unitSet: unitSet || undefined,
      lowReminderThreshold: threshold,
      imagePath: imagePath.trim() || undefined,
    })
  }

  const canSubmit = !!(unitSet && unitSet.trim())

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="item-name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          id="item-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="e.g. Rice bag"
          required
        />
      </div>

      <div>
        <label htmlFor="item-description" className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          id="item-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          rows={2}
          placeholder="Short description"
        />
      </div>

      <div>
        <label htmlFor="item-unit-set" className="block text-sm font-medium text-gray-700 mb-1">
          Unit set
        </label>
        <SearchableDropdown
          options={unitSetOptions}
          valueKey="unitSetId"
          labelKey="label"
          value={unitSet}
          onChange={(id) => setUnitSet(id)}
          placeholder="Select unit set"
        />
        {unitSetOptions.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">Create unit sets in the Units tab first.</p>
        )}
      </div>

      <div>
        <label htmlFor="item-low-reminder" className="block text-sm font-medium text-gray-700 mb-1">
          Low stock reminder threshold
        </label>
        <input
          id="item-low-reminder"
          type="number"
          min={0}
          step={1}
          value={lowReminderThreshold}
          onChange={(e) => setLowReminderThreshold(e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="0 = no reminder"
        />
        <p className="text-xs text-gray-500 mt-1">Remind when stock falls below this (same unit). Use 0 to disable.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
        <div className="flex flex-col gap-2">
          {itemImageSrc ? (
            <div className="flex items-center gap-3">
              <AuthImage
                src={itemImageSrc}
                alt="Item"
                className="h-20 w-auto object-contain rounded border border-gray-300 bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setImagePath('')}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Remove image
              </button>
            </div>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={handleImageUpload}
            disabled={uploading}
            className="w-full text-sm text-gray-600 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:bg-amber-500 file:text-gray-900 file:font-medium file:cursor-pointer hover:file:bg-amber-400"
          />
          {uploading && <span className="text-xs text-gray-500">Uploading…</span>}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-2 rounded bg-amber-500 text-gray-900 hover:bg-amber-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default ItemForm
